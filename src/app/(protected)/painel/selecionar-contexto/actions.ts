"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { writeContextCookie } from "@/lib/auth/context-cookie";
import { validateActiveContext } from "@/lib/auth/context";

// Sprint 03D2 - Server Action da selecao de contexto institucional (Etapa 1)
//
// Responsabilidade:
// Receber a selecao do formulario (um unico campo contextSelection no formato
// organizationId:hospitalId), validar o formato com Zod, revalidar os IDs no
// servidor sob RLS via validateActiveContext e, somente quando o contexto for
// ativo, gravar o cookie com os IDs retornados pelo banco e redirecionar para
// o painel.
//
// Limites de seguranca:
// - O inventario renderizado nunca autoriza: a autorizacao vem da revalidacao.
// - IDs enviados pelo navegador nunca sao a fonte de verdade nem sao gravados
//   diretamente; o cookie usa os IDs vindos de result.context.
// - Nenhum destino de redirect e aceito do navegador; o redirect e fixo.
// - Sem service role, sem consulta direta ao Supabase, sem localStorage ou
//   sessionStorage. Nenhum UUID, cookie, token, sessao ou erro interno em log
//   ou em mensagem exibida.

export type SelectContextActionState =
  | { status: "idle" }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

const INVALID_SELECTION_MESSAGE = "Selecione um hospital válido.";
const UNAVAILABLE_MESSAGE =
  "Este hospital não está disponível para o seu acesso.";
const TEMPORARY_ERROR_MESSAGE =
  "Não foi possível concluir a seleção agora. Tente novamente.";

const selectionSchema = z.object({
  organizationId: z.string().uuid(),
  hospitalId: z.string().uuid(),
});

function parseContextSelection(
  rawValue: FormDataEntryValue | null,
): { organizationId: string; hospitalId: string } | null {
  if (typeof rawValue !== "string") {
    return null;
  }

  const parts = rawValue.split(":");

  if (parts.length !== 2) {
    return null;
  }

  const parsed = selectionSchema.safeParse({
    organizationId: parts[0],
    hospitalId: parts[1],
  });

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export async function selectActiveContextAction(
  previousState: SelectContextActionState,
  formData: FormData,
): Promise<SelectContextActionState> {
  void previousState;

  const selection = parseContextSelection(formData.get("contextSelection"));

  if (!selection) {
    return { status: "invalid", message: INVALID_SELECTION_MESSAGE };
  }

  const result = await validateActiveContext(selection);

  if (result.status === "error") {
    return { status: "error", message: TEMPORARY_ERROR_MESSAGE };
  }

  if (result.status !== "active") {
    return { status: "invalid", message: UNAVAILABLE_MESSAGE };
  }

  // Grava usando os IDs revalidados pelo banco, nunca os IDs brutos do form.
  await writeContextCookie({
    organizationId: result.context.organizationId,
    hospitalId: result.context.hospitalId,
  });

  redirect("/painel");
}
