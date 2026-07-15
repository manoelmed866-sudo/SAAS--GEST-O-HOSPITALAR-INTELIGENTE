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

export type HospitalTeamAssignedRole = {
  label: string;
  // Referencia publica opaca do papel (32 hex, nunca UUID e nunca role.code).
  roleRef: string;
  canRevoke: boolean;
};

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
  // Papeis administraveis do integrante (somente para quem possui manage);
  // null para quem possui apenas leitura.
  assignedRoles: HospitalTeamAssignedRole[] | null;
};

export type HospitalAssignableRole = {
  label: string;
  roleRef: string;
};

export type HospitalTeamResult =
  | {
      status: "allowed";
      context: ActiveContext;
      members: HospitalTeamMember[];
      // Catalogo hospitalar minimo atribuivel (somente para quem possui
      // manage); null para quem possui apenas leitura.
      assignableRoles: HospitalAssignableRole[] | null;
    }
  | { status: "denied"; context: ActiveContext }
  | { status: "absent" }
  | { status: "invalid" }
  | { status: "error" };

const OPAQUE_REF_PATTERN = /^[0-9a-f]{32}$/;

const assignedRoleSchema = z
  .object({
    label: z.string().min(1),
    roleRef: z.string().regex(OPAQUE_REF_PATTERN),
    canRevoke: z.boolean(),
  })
  .strict();

// Schema estrito de cada linha da RPC: status no enum fechado, nome e rotulos
// nao vazios, referencias opacas de 32 hex e papeis administraveis somente
// para quem gerencia.
const teamMemberRowSchema = z
  .object({
    display_name: z.string().min(1),
    membership_status: z.enum(["active", "suspended", "pending"]),
    role_labels: z.array(z.string().min(1)),
    // 32 hex minusculos: formato opaco que jamais coincide com UUID.
    management_ref: z
      .string()
      .regex(OPAQUE_REF_PATTERN)
      .nullable(),
    can_suspend: z.boolean(),
    can_reactivate: z.boolean(),
    assigned_roles: z.array(assignedRoleSchema).nullable(),
  })
  .strict();

const teamResponseSchema = z.array(teamMemberRowSchema);

const assignableRoleRowSchema = z
  .object({
    role_label: z.string().min(1),
    role_ref: z.string().regex(OPAQUE_REF_PATTERN),
  })
  .strict();

const assignableRolesResponseSchema = z.array(assignableRoleRowSchema);

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

  // Catalogo atribuivel somente para quem gerencia; a RPC revalida a
  // permissao internamente e leitores recebem null (nunca lista parcial).
  let assignableRoles: HospitalAssignableRole[] | null = null;

  if (result.capabilities.canManageMemberships) {
    const catalog = await supabase.rpc("get_hospital_assignable_roles", {
      target_hospital_id: result.context.hospitalId,
    });

    if (catalog.error) {
      return { status: "error" };
    }

    const parsedCatalog = assignableRolesResponseSchema.safeParse(catalog.data);

    if (!parsedCatalog.success) {
      return { status: "error" };
    }

    assignableRoles = parsedCatalog.data.map((row) => ({
      label: row.role_label,
      roleRef: row.role_ref,
    }));
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
      assignedRoles: row.assigned_roles,
    })),
    assignableRoles,
  };
}
