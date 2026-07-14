import { z } from "zod";
import { resolveActiveHospitalCapabilities } from "@/lib/auth/capabilities";
import type { ActiveContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

// Sprint 04C.1 - Resolver server-side da equipe do hospital ativo
//
// Responsabilidade:
// Resolver, para o hospital ATIVO do usuario autenticado, a lista somente
// leitura dos integrantes (nome de exibicao, status do vinculo e rotulos
// amigaveis de papeis). A autorizacao vem em duas camadas: o gate semantico
// canReadMemberships (04A) decide allowed/denied no servidor, e a RPC
// public.get_hospital_team revalida a permissao internamente (SECURITY
// DEFINER com validacao explicita, fail-closed) antes de devolver linhas.
//
// Origem unica do hospital:
// O hospital vem EXCLUSIVAMENTE de resolveActiveHospitalCapabilities(), que ja
// revalida o contexto sob RLS. O resolver nao recebe hospitalId ou
// organizationId por argumento, nao le cookie, navegador, URL, query string ou
// form data, nao redireciona e nao chama notFound. Nenhum e-mail, UUID, codigo
// cru de permissao ou role.code entra no contrato de saida.
//
// Fail-closed:
// Erro da RPC, item malformado (campo ausente, nulo, tipo incorreto ou
// propriedade extra) ou status fora do enum fechado resultam em status
// "error". Nunca ha lista parcial nem fallback permissivo. Lista vazia e um
// resultado valido ("allowed" com members vazio).

export type HospitalTeamMemberStatus = "active" | "suspended" | "pending";

export type HospitalTeamMember = {
  displayName: string;
  membershipStatus: HospitalTeamMemberStatus;
  roleLabels: string[];
  // Referencia publica opaca (32 hex, nunca UUID) para acoes administrativas;
  // nula para quem possui apenas leitura. Os indicadores can* sao orientacao
  // de interface: a RPC de mutacao revalida tudo no servidor.
  managementRef: string | null;
  canSuspend: boolean;
  canReactivate: boolean;
};

export type HospitalTeamResult =
  | {
      status: "allowed";
      context: ActiveContext;
      members: HospitalTeamMember[];
    }
  | { status: "denied"; context: ActiveContext }
  | { status: "absent" }
  | { status: "invalid" }
  | { status: "error" };

// Schema estrito de cada linha da RPC: exatamente tres campos, status no enum
// fechado, nome e rotulos nao vazios.
const teamMemberRowSchema = z
  .object({
    display_name: z.string().min(1),
    membership_status: z.enum(["active", "suspended", "pending"]),
    role_labels: z.array(z.string().min(1)),
    // 32 hex minusculos: formato opaco que jamais coincide com UUID.
    management_ref: z
      .string()
      .regex(/^[0-9a-f]{32}$/)
      .nullable(),
    can_suspend: z.boolean(),
    can_reactivate: z.boolean(),
  })
  .strict();

const teamResponseSchema = z.array(teamMemberRowSchema);

export async function resolveActiveHospitalTeam(): Promise<HospitalTeamResult> {
  const result = await resolveActiveHospitalCapabilities();

  // absent / invalid / error sao propagados sem tocar no banco.
  if (result.status !== "active") {
    return result;
  }

  // Sem a capacidade de leitura, denied com o mesmo contexto e sem RPC.
  if (!result.capabilities.canReadMemberships) {
    return { status: "denied", context: result.context };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_hospital_team", {
    target_hospital_id: result.context.hospitalId,
  });

  if (error) {
    return { status: "error" };
  }

  const parsed = teamResponseSchema.safeParse(data);

  if (!parsed.success) {
    return { status: "error" };
  }

  return {
    status: "allowed",
    // Devolve o mesmo ActiveContext ja revalidado sob RLS.
    context: result.context,
    members: parsed.data.map((row) => ({
      displayName: row.display_name,
      membershipStatus: row.membership_status,
      roleLabels: row.role_labels,
      managementRef: row.management_ref,
      canSuspend: row.can_suspend,
      canReactivate: row.can_reactivate,
    })),
  };
}
