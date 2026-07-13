import { cookies } from "next/headers";
import { z } from "zod";

// Sprint 03D3 - Cookie de contexto institucional ativo (Etapa 1)
//
// Responsabilidade:
// Este modulo cuida EXCLUSIVAMENTE do ciclo de vida do cookie que aponta o
// contexto institucional ativo (organization + hospital selecionados). Ele
// apenas serializa, le, valida o formato e limpa o cookie. Nao consulta o
// banco, nao importa Supabase e nao decide autorizacao: o cookie e um ponteiro,
// nunca a fonte de verdade. A revalidacao institucional contra o RLS fica em
// src/lib/auth/context.ts (etapas seguintes da 03D3).
//
// Limites:
// - Payload minimo: apenas organizationId, hospitalId e a versao do formato.
// - Nenhum papel, permissao, nome institucional ou dado clinico.
// - Sem localStorage, sem sessionStorage, sem banco remoto, sem service role.
// - Nunca registrar o conteudo do cookie em log.

export const ACTIVE_CONTEXT_COOKIE_NAME = "ghi_active_context";
export const ACTIVE_CONTEXT_FORMAT_VERSION = 1 as const;

const ACTIVE_CONTEXT_MAX_AGE_SECONDS = 60 * 60 * 12;

export type ActiveContextSelection = {
  organizationId: string;
  hospitalId: string;
};

export type ActiveContextPayload = ActiveContextSelection & {
  v: typeof ACTIVE_CONTEXT_FORMAT_VERSION;
};

export type ContextCookieReadResult =
  | { status: "absent" }
  | { status: "malformed" }
  | { status: "present"; payload: ActiveContextPayload };

const selectionSchema = z
  .object({
    organizationId: z.string().uuid(),
    hospitalId: z.string().uuid(),
  })
  .strict();

const payloadSchema = selectionSchema
  .extend({
    v: z.literal(ACTIVE_CONTEXT_FORMAT_VERSION),
  })
  .strict();

function baseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/painel",
  };
}

function parseContextCookieValue(rawValue: string): ContextCookieReadResult {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawValue);
  } catch {
    return { status: "malformed" };
  }

  const result = payloadSchema.safeParse(parsedJson);

  if (!result.success) {
    return { status: "malformed" };
  }

  return { status: "present", payload: result.data };
}

export async function writeContextCookie(
  selection: ActiveContextSelection,
): Promise<void> {
  // Valida a selecao ANTES de escrever. Entrada invalida lanca erro generico e
  // o cookie nao e gravado. O erro nunca expoe os IDs ou o conteudo recebido.
  const validation = selectionSchema.safeParse(selection);

  if (!validation.success) {
    throw new Error("Selecao de contexto institucional invalida.");
  }

  // A versao do formato e acrescentada internamente; o chamador nunca a informa.
  const payload: ActiveContextPayload = {
    organizationId: validation.data.organizationId,
    hospitalId: validation.data.hospitalId,
    v: ACTIVE_CONTEXT_FORMAT_VERSION,
  };

  const cookieStore = await cookies();

  cookieStore.set(ACTIVE_CONTEXT_COOKIE_NAME, JSON.stringify(payload), {
    ...baseCookieOptions(),
    maxAge: ACTIVE_CONTEXT_MAX_AGE_SECONDS,
  });
}

export async function readContextCookie(): Promise<ContextCookieReadResult> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ACTIVE_CONTEXT_COOKIE_NAME);

  if (!cookie || cookie.value.length === 0) {
    return { status: "absent" };
  }

  return parseContextCookieValue(cookie.value);
}

export async function clearContextCookie(): Promise<void> {
  const cookieStore = await cookies();

  // Limpeza por sobrescrita com maxAge 0, sem cookies().delete com opcoes.
  cookieStore.set(ACTIVE_CONTEXT_COOKIE_NAME, "", {
    ...baseCookieOptions(),
    maxAge: 0,
  });
}
