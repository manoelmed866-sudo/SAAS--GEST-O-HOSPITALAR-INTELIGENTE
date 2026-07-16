import { z } from "zod";
import { resolveActiveHospitalCapabilities } from "@/lib/auth/capabilities";
import type { ActiveContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

// Sprint 05 - Resolver server-side da estrutura institucional do hospital ativo
//
// Responsabilidade:
// Resolver, para o hospital ATIVO do usuario autenticado, a estrutura
// institucional configurada: unidades com seus setores e leitos aninhados e o
// catalogo de recursos institucionais. A autorizacao vem em duas camadas: o
// gate semantico canReadStructure decide allowed/denied no servidor, e o RLS
// da Sprint 05 e a barreira final em cada consulta (SECURITY INVOKER por
// construcao: leituras diretas sob o cliente autenticado, sem service role).
//
// Origem unica do hospital:
// O hospital vem EXCLUSIVAMENTE de resolveActiveHospitalCapabilities(), que ja
// revalida o contexto sob RLS. O resolver nao recebe hospitalId ou
// organizationId por argumento, nao le cookie, navegador, URL, query string ou
// form data, nao redireciona e nao chama notFound.
//
// Exposicao minima:
// Nenhum UUID interno entra no contrato de saida: itens sao identificados pela
// referencia publica opaca (32 hex) e apenas quando o usuario possui
// canManageStructure (leitores recebem managementRef nulo). O aninhamento
// unidade -> setor -> leito e montado internamente e os UUIDs sao descartados.
//
// Fail-closed:
// Erro de qualquer consulta ou linha malformada (campo ausente, nulo, tipo
// incorreto ou propriedade extra) resulta em status "error". Nunca ha
// estrutura parcial nem fallback permissivo. Estrutura vazia e um resultado
// valido ("allowed" com listas vazias).

export type HospitalStructureItemStatus = "active" | "inactive";

export type HospitalStructureBed = {
  code: string;
  displayName: string;
  status: HospitalStructureItemStatus;
  managementRef: string | null;
};

export type HospitalStructureSector = {
  code: string;
  displayName: string;
  status: HospitalStructureItemStatus;
  managementRef: string | null;
  beds: HospitalStructureBed[];
};

export type HospitalStructureUnit = {
  code: string;
  displayName: string;
  status: HospitalStructureItemStatus;
  managementRef: string | null;
  sectors: HospitalStructureSector[];
};

export type HospitalStructureResource = {
  code: string;
  displayName: string;
  description: string | null;
  status: HospitalStructureItemStatus;
  managementRef: string | null;
};

export type HospitalStructure = {
  units: HospitalStructureUnit[];
  resources: HospitalStructureResource[];
};

export type HospitalStructureResult =
  | {
      status: "allowed";
      context: ActiveContext;
      canManage: boolean;
      structure: HospitalStructure;
    }
  | { status: "denied"; context: ActiveContext }
  | { status: "absent" }
  | { status: "invalid" }
  | { status: "error" };

const OPAQUE_REF_PATTERN = /^[0-9a-f]{32}$/;

const statusSchema = z.enum(["active", "inactive"]);

// Schemas estritos das linhas lidas sob RLS. Os UUIDs (id, unit_id, sector_id)
// sao usados apenas para montar o aninhamento e nunca saem deste modulo.
const unitRowSchema = z
  .object({
    id: z.uuid(),
    code: z.string().min(1),
    display_name: z.string().min(1),
    status: statusSchema,
    management_ref: z.string().regex(OPAQUE_REF_PATTERN),
  })
  .strict();

const sectorRowSchema = z
  .object({
    id: z.uuid(),
    unit_id: z.uuid(),
    code: z.string().min(1),
    display_name: z.string().min(1),
    status: statusSchema,
    management_ref: z.string().regex(OPAQUE_REF_PATTERN),
  })
  .strict();

const bedRowSchema = z
  .object({
    sector_id: z.uuid(),
    code: z.string().min(1),
    display_name: z.string().min(1),
    status: statusSchema,
    management_ref: z.string().regex(OPAQUE_REF_PATTERN),
  })
  .strict();

const resourceRowSchema = z
  .object({
    code: z.string().min(1),
    display_name: z.string().min(1),
    description: z.string().min(1).nullable(),
    status: statusSchema,
    management_ref: z.string().regex(OPAQUE_REF_PATTERN),
  })
  .strict();

const unitsResponseSchema = z.array(unitRowSchema);
const sectorsResponseSchema = z.array(sectorRowSchema);
const bedsResponseSchema = z.array(bedRowSchema);
const resourcesResponseSchema = z.array(resourceRowSchema);

export async function resolveActiveHospitalStructure(): Promise<HospitalStructureResult> {
  const result = await resolveActiveHospitalCapabilities();

  // absent / invalid / error sao propagados sem tocar no banco.
  if (result.status !== "active") {
    return result;
  }

  // Sem a capacidade de leitura, denied com o mesmo contexto e sem consulta.
  if (!result.capabilities.canReadStructure) {
    return { status: "denied", context: result.context };
  }

  const canManage = result.capabilities.canManageStructure;
  const hospitalId = result.context.hospitalId;
  const supabase = await createClient();

  const unitsResult = await supabase
    .from("hospital_units")
    .select("id, code, display_name, status, management_ref")
    .eq("hospital_id", hospitalId)
    .order("display_name", { ascending: true })
    .order("id", { ascending: true });

  if (unitsResult.error) {
    return { status: "error" };
  }

  const sectorsResult = await supabase
    .from("hospital_sectors")
    .select("id, unit_id, code, display_name, status, management_ref")
    .eq("hospital_id", hospitalId)
    .order("display_name", { ascending: true })
    .order("id", { ascending: true });

  if (sectorsResult.error) {
    return { status: "error" };
  }

  const bedsResult = await supabase
    .from("hospital_beds")
    .select("sector_id, code, display_name, status, management_ref")
    .eq("hospital_id", hospitalId)
    .order("code", { ascending: true })
    .order("id", { ascending: true });

  if (bedsResult.error) {
    return { status: "error" };
  }

  const resourcesResult = await supabase
    .from("hospital_resources")
    .select("code, display_name, description, status, management_ref")
    .eq("hospital_id", hospitalId)
    .order("display_name", { ascending: true })
    .order("id", { ascending: true });

  if (resourcesResult.error) {
    return { status: "error" };
  }

  const parsedUnits = unitsResponseSchema.safeParse(unitsResult.data);
  const parsedSectors = sectorsResponseSchema.safeParse(sectorsResult.data);
  const parsedBeds = bedsResponseSchema.safeParse(bedsResult.data);
  const parsedResources = resourcesResponseSchema.safeParse(
    resourcesResult.data,
  );

  if (
    !parsedUnits.success ||
    !parsedSectors.success ||
    !parsedBeds.success ||
    !parsedResources.success
  ) {
    return { status: "error" };
  }

  // Referencias opacas sao expostas SOMENTE a quem gerencia; leitores recebem
  // null. A referencia nunca autoriza nada: as Server Actions revalidam tudo.
  const exposeRef = (ref: string): string | null => (canManage ? ref : null);

  const sectorsByUnit = new Map<string, HospitalStructureSector[]>();
  const bedsBySector = new Map<string, HospitalStructureBed[]>();

  for (const bed of parsedBeds.data) {
    const list = bedsBySector.get(bed.sector_id) ?? [];
    list.push({
      code: bed.code,
      displayName: bed.display_name,
      status: bed.status,
      managementRef: exposeRef(bed.management_ref),
    });
    bedsBySector.set(bed.sector_id, list);
  }

  for (const sector of parsedSectors.data) {
    const list = sectorsByUnit.get(sector.unit_id) ?? [];
    list.push({
      code: sector.code,
      displayName: sector.display_name,
      status: sector.status,
      managementRef: exposeRef(sector.management_ref),
      beds: bedsBySector.get(sector.id) ?? [],
    });
    sectorsByUnit.set(sector.unit_id, list);
  }

  const units: HospitalStructureUnit[] = parsedUnits.data.map((unit) => ({
    code: unit.code,
    displayName: unit.display_name,
    status: unit.status,
    managementRef: exposeRef(unit.management_ref),
    sectors: sectorsByUnit.get(unit.id) ?? [],
  }));

  const resources: HospitalStructureResource[] = parsedResources.data.map(
    (resource) => ({
      code: resource.code,
      displayName: resource.display_name,
      description: resource.description,
      status: resource.status,
      managementRef: exposeRef(resource.management_ref),
    }),
  );

  return {
    status: "allowed",
    // Devolve o mesmo ActiveContext ja revalidado sob RLS.
    context: result.context,
    canManage,
    structure: { units, resources },
  };
}
