"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { resolveActiveHospitalCapabilities } from "@/lib/auth/capabilities";
import { createClient } from "@/lib/supabase/server";

// Sprint 04C.2 - Server Action de suspensao/reativacao de vinculo hospitalar
//
// Responsabilidade:
// Receber do formulario SOMENTE a referencia opaca (managementRef) e o estado
// solicitado (requestedStatus), validar com Zod, exigir canManageMemberships
// no servidor e delegar a mutacao a RPC change_hospital_membership_status,
// que revalida TUDO internamente (autorizacao, transicao, auto-suspensao,
// ultimo administrador) com lock e auditoria na mesma transacao.
//
// Limites de seguranca:
// - Nenhum hospitalId, organizationId, UUID, papel, permissao ou actorId vem
//   do navegador: o hospital vem exclusivamente do contexto ativo revalidado.
// - Sem service_role, sem consulta direta a tabelas (.from), sem redirect.
// - Os indicadores da interface nunca autorizam; a RPC decide.
// - Nenhum erro interno, UUID ou codigo cru vaza em mensagem.

export type MembershipMutationState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "denied"; message: string }
  | { status: "blocked"; message: string }
  | { status: "error"; message: string };

const DENIED_MESSAGE =
  "Sua conta não está autorizada a executar esta ação.";
const CONTEXT_MESSAGE =
  "Selecione novamente o hospital para continuar.";
const TEMPORARY_ERROR_MESSAGE =
  "Não foi possível concluir a ação agora. Tente novamente.";
const INVALID_TRANSITION_MESSAGE =
  "O vínculo não está em um estado compatível com esta ação.";
const SELF_SUSPENSION_MESSAGE = "Você não pode suspender o próprio vínculo.";
const LAST_ADMIN_MESSAGE =
  "Não é possível suspender o último administrador ativo do hospital.";
const SUSPENDED_MESSAGE = "Vínculo suspenso com sucesso.";
const REACTIVATED_MESSAGE = "Vínculo reativado com sucesso.";

// Entrada minima: referencia opaca de 32 hex e o estado solicitado.
const mutationInputSchema = z.object({
  managementRef: z.string().regex(/^[0-9a-f]{32}$/),
  requestedStatus: z.enum(["suspended", "active"]),
});

// Resultado estruturado da RPC: enum fechado, sem interpretacao livre.
const mutationOutcomeSchema = z.enum([
  "updated",
  "not_allowed",
  "invalid_transition",
  "self_suspension_forbidden",
  "last_admin_forbidden",
]);

function getStringField(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

export async function changeMembershipStatusAction(
  previousState: MembershipMutationState,
  formData: FormData,
): Promise<MembershipMutationState> {
  void previousState;

  const parsedInput = mutationInputSchema.safeParse({
    managementRef: getStringField(formData, "managementRef"),
    requestedStatus: getStringField(formData, "requestedStatus"),
  });

  if (!parsedInput.success) {
    return { status: "error", message: TEMPORARY_ERROR_MESSAGE };
  }

  const capabilities = await resolveActiveHospitalCapabilities();

  if (capabilities.status === "error") {
    return { status: "error", message: TEMPORARY_ERROR_MESSAGE };
  }

  if (capabilities.status !== "active") {
    return { status: "error", message: CONTEXT_MESSAGE };
  }

  if (!capabilities.capabilities.canManageMemberships) {
    return { status: "denied", message: DENIED_MESSAGE };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "change_hospital_membership_status",
    {
      // O hospital vem EXCLUSIVAMENTE do contexto ativo revalidado.
      target_hospital_id: capabilities.context.hospitalId,
      target_management_ref: parsedInput.data.managementRef,
      requested_status: parsedInput.data.requestedStatus,
    },
  );

  if (error) {
    return { status: "error", message: TEMPORARY_ERROR_MESSAGE };
  }

  const outcome = mutationOutcomeSchema.safeParse(data);

  if (!outcome.success) {
    return { status: "error", message: TEMPORARY_ERROR_MESSAGE };
  }

  switch (outcome.data) {
    case "updated":
      revalidatePath("/painel/admin/equipe");

      return {
        status: "success",
        message:
          parsedInput.data.requestedStatus === "suspended"
            ? SUSPENDED_MESSAGE
            : REACTIVATED_MESSAGE,
      };
    case "self_suspension_forbidden":
      return { status: "blocked", message: SELF_SUSPENSION_MESSAGE };
    case "last_admin_forbidden":
      return { status: "blocked", message: LAST_ADMIN_MESSAGE };
    case "invalid_transition":
      return { status: "blocked", message: INVALID_TRANSITION_MESSAGE };
    case "not_allowed":
      return { status: "denied", message: DENIED_MESSAGE };
  }
}
