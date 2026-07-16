import { z } from "zod";
import { type ActiveContext, resolveActiveContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

// Sprint 04A2 - Consumidor server-side das capacidades efetivas
//
// Responsabilidade:
// Resolver, para o hospital ATIVO do usuario autenticado, as capacidades
// semanticas efetivas, combinando os tres escopos (plataforma, organizacao e
// hospital). A combinacao e feita integralmente no banco pela RPC
// public.get_effective_hospital_capabilities, sob RLS (SECURITY INVOKER da
// Sprint 04A1); este modulo apenas orquestra e traduz.
//
// Origem unica do hospital:
// O hospital vem EXCLUSIVAMENTE de resolveActiveContext(), que ja revalida o
// cookie sob RLS. O resolver nao recebe hospitalId/organizationId por argumento,
// nao le navegador, query string, form data, storage nem cookie, e nao grava
// cookie nem redireciona. Nenhum papel, scope ou codigo de permissao cru e
// exposto: apenas cinco booleanos semanticos.
//
// Fail-closed:
// Erro da RPC, ausencia de linha, mais de uma linha, campo ausente/nulo/nao
// booleano ou propriedade inesperada resultam em status "error". Nunca ha
// capacidade parcial nem fallback permissivo.

export type HospitalCapabilities = {
  canReadHospital: boolean;
  canReadMemberships: boolean;
  canManageMemberships: boolean;
  canReadAudit: boolean;
  canSwitchContext: boolean;
  canReadStructure: boolean;
  canManageStructure: boolean;
};

export type ActiveHospitalCapabilities = {
  context: ActiveContext;
  capabilities: HospitalCapabilities;
};

export type HospitalCapabilitiesResult =
  | {
      status: "active";
      context: ActiveContext;
      capabilities: HospitalCapabilities;
    }
  | { status: "absent" }
  | { status: "invalid" }
  | { status: "error" };

// Schema estrito da linha devolvida pela RPC: exatamente sete booleanos, sem
// propriedades adicionais (Sprint 05 adiciona os dois booleanos de estrutura).
const capabilitiesRowSchema = z
  .object({
    can_read_hospital: z.boolean(),
    can_read_memberships: z.boolean(),
    can_manage_memberships: z.boolean(),
    can_read_audit: z.boolean(),
    can_switch_context: z.boolean(),
    can_read_structure: z.boolean(),
    can_manage_structure: z.boolean(),
  })
  .strict();

// A RPC deriva de "returns table", logo devolve um array; exigimos exatamente
// uma linha.
const capabilitiesResponseSchema = z.array(capabilitiesRowSchema).length(1);

export async function resolveActiveHospitalCapabilities(): Promise<HospitalCapabilitiesResult> {
  const context = await resolveActiveContext();

  // absent / invalid / error sao propagados sem tocar no banco.
  if (context.status !== "active") {
    return context;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "get_effective_hospital_capabilities",
    { target_hospital_id: context.context.hospitalId },
  );

  if (error) {
    return { status: "error" };
  }

  const parsed = capabilitiesResponseSchema.safeParse(data);

  if (!parsed.success) {
    return { status: "error" };
  }

  const row = parsed.data[0];

  return {
    status: "active",
    // Devolve o mesmo ActiveContext ja revalidado sob RLS.
    context: context.context,
    capabilities: {
      canReadHospital: row.can_read_hospital,
      canReadMemberships: row.can_read_memberships,
      canManageMemberships: row.can_manage_memberships,
      canReadAudit: row.can_read_audit,
      canSwitchContext: row.can_switch_context,
      canReadStructure: row.can_read_structure,
      canManageStructure: row.can_manage_structure,
    },
  };
}
