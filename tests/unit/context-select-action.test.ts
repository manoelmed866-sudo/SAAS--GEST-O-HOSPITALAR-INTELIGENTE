import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  validateActiveContext: vi.fn(),
  writeContextCookie: vi.fn(),
}));

export {};

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth/context", () => ({
  validateActiveContext: mocks.validateActiveContext,
}));

vi.mock("@/lib/auth/context-cookie", () => ({
  writeContextCookie: mocks.writeContextCookie,
}));

const ORG_RAW = "11111111-1111-4111-8111-111111111111";
const HOSP_RAW = "22222222-2222-4222-8222-222222222222";
const ORG_BANK = "33333333-3333-4333-8333-333333333333";
const HOSP_BANK = "44444444-4444-4444-8444-444444444444";

const IDLE_STATE = { status: "idle" } as const;

function makeFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();

  Object.entries(entries).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

describe("selectActiveContextAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.writeContextCookie.mockResolvedValue(undefined);
  });

  it("retorna invalid quando contextSelection esta ausente", async () => {
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    const result = await selectActiveContextAction(IDLE_STATE, makeFormData({}));

    expect(result).toEqual({
      status: "invalid",
      message: "Selecione um hospital válido.",
    });
    expect(mocks.validateActiveContext).not.toHaveBeenCalled();
    expect(mocks.writeContextCookie).not.toHaveBeenCalled();
  });

  it("retorna invalid quando contextSelection nao e string", async () => {
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );
    const formData = new FormData();
    formData.append("contextSelection", new Blob([`${ORG_RAW}:${HOSP_RAW}`]));

    const result = await selectActiveContextAction(IDLE_STATE, formData);

    expect(result.status).toBe("invalid");
    expect(mocks.validateActiveContext).not.toHaveBeenCalled();
    expect(mocks.writeContextCookie).not.toHaveBeenCalled();
  });

  it("retorna invalid quando nao ha separador", async () => {
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    const result = await selectActiveContextAction(
      IDLE_STATE,
      makeFormData({ contextSelection: `${ORG_RAW}${HOSP_RAW}` }),
    );

    expect(result.status).toBe("invalid");
    expect(mocks.validateActiveContext).not.toHaveBeenCalled();
  });

  it("retorna invalid quando ha apenas uma parte", async () => {
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    const result = await selectActiveContextAction(
      IDLE_STATE,
      makeFormData({ contextSelection: ORG_RAW }),
    );

    expect(result.status).toBe("invalid");
    expect(mocks.validateActiveContext).not.toHaveBeenCalled();
  });

  it("retorna invalid quando ha mais de duas partes", async () => {
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    const result = await selectActiveContextAction(
      IDLE_STATE,
      makeFormData({ contextSelection: `${ORG_RAW}:${HOSP_RAW}:${ORG_BANK}` }),
    );

    expect(result.status).toBe("invalid");
    expect(mocks.validateActiveContext).not.toHaveBeenCalled();
  });

  it("retorna invalid quando organizationId nao e UUID", async () => {
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    const result = await selectActiveContextAction(
      IDLE_STATE,
      makeFormData({ contextSelection: `organizacao:${HOSP_RAW}` }),
    );

    expect(result.status).toBe("invalid");
    expect(mocks.validateActiveContext).not.toHaveBeenCalled();
  });

  it("retorna invalid quando hospitalId nao e UUID", async () => {
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    const result = await selectActiveContextAction(
      IDLE_STATE,
      makeFormData({ contextSelection: `${ORG_RAW}:hospital` }),
    );

    expect(result.status).toBe("invalid");
    expect(mocks.validateActiveContext).not.toHaveBeenCalled();
  });

  it("mapeia validateActiveContext invalid para estado invalid indisponivel", async () => {
    mocks.validateActiveContext.mockResolvedValueOnce({ status: "invalid" });
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    const result = await selectActiveContextAction(
      IDLE_STATE,
      makeFormData({ contextSelection: `${ORG_RAW}:${HOSP_RAW}` }),
    );

    expect(mocks.validateActiveContext).toHaveBeenCalledWith({
      organizationId: ORG_RAW,
      hospitalId: HOSP_RAW,
    });
    expect(result).toEqual({
      status: "invalid",
      message: "Este hospital não está disponível para o seu acesso.",
    });
    expect(mocks.writeContextCookie).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("mapeia validateActiveContext error para estado error temporario", async () => {
    mocks.validateActiveContext.mockResolvedValueOnce({ status: "error" });
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    const result = await selectActiveContextAction(
      IDLE_STATE,
      makeFormData({ contextSelection: `${ORG_RAW}:${HOSP_RAW}` }),
    );

    expect(result).toEqual({
      status: "error",
      message: "Não foi possível concluir a seleção agora. Tente novamente.",
    });
    expect(mocks.writeContextCookie).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("grava o cookie e redireciona para /painel quando o contexto e active", async () => {
    mocks.validateActiveContext.mockResolvedValueOnce({
      status: "active",
      context: { organizationId: ORG_RAW, hospitalId: HOSP_RAW },
    });
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    await expect(
      selectActiveContextAction(
        IDLE_STATE,
        makeFormData({ contextSelection: `${ORG_RAW}:${HOSP_RAW}` }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/painel");

    expect(mocks.writeContextCookie).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/painel");
  });

  it("grava usando os IDs retornados pelo banco, nao os IDs brutos do form", async () => {
    mocks.validateActiveContext.mockResolvedValueOnce({
      status: "active",
      context: { organizationId: ORG_BANK, hospitalId: HOSP_BANK },
    });
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    await expect(
      selectActiveContextAction(
        IDLE_STATE,
        makeFormData({ contextSelection: `${ORG_RAW}:${HOSP_RAW}` }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/painel");

    expect(mocks.writeContextCookie).toHaveBeenCalledWith({
      organizationId: ORG_BANK,
      hospitalId: HOSP_BANK,
    });
  });

  it("grava o cookie antes de redirecionar", async () => {
    mocks.validateActiveContext.mockResolvedValueOnce({
      status: "active",
      context: { organizationId: ORG_RAW, hospitalId: HOSP_RAW },
    });
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    await expect(
      selectActiveContextAction(
        IDLE_STATE,
        makeFormData({ contextSelection: `${ORG_RAW}:${HOSP_RAW}` }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/painel");

    const writeOrder = mocks.writeContextCookie.mock.invocationCallOrder[0];
    const redirectOrder = mocks.redirect.mock.invocationCallOrder[0];
    expect(writeOrder).toBeLessThan(redirectOrder);
  });

  it("ignora qualquer campo next enviado no FormData", async () => {
    mocks.validateActiveContext.mockResolvedValueOnce({
      status: "active",
      context: { organizationId: ORG_RAW, hospitalId: HOSP_RAW },
    });
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    await expect(
      selectActiveContextAction(
        IDLE_STATE,
        makeFormData({
          contextSelection: `${ORG_RAW}:${HOSP_RAW}`,
          next: "https://malicioso.example/painel",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/painel");

    expect(mocks.redirect).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/painel");
  });

  it("nao expoe UUIDs nem erro interno nas mensagens", async () => {
    mocks.validateActiveContext.mockResolvedValueOnce({ status: "error" });
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    const invalidResult = await selectActiveContextAction(
      IDLE_STATE,
      makeFormData({ contextSelection: ORG_RAW }),
    );
    const errorResult = await selectActiveContextAction(
      IDLE_STATE,
      makeFormData({ contextSelection: `${ORG_RAW}:${HOSP_RAW}` }),
    );

    for (const state of [invalidResult, errorResult]) {
      if (state.status === "idle") {
        throw new Error("esperava estado com mensagem");
      }

      expect(state.message).not.toContain(ORG_RAW);
      expect(state.message).not.toContain(HOSP_RAW);
      expect(state.message).not.toMatch(/supabase/i);
    }
  });

  it("nao redireciona nos estados invalid e error", async () => {
    mocks.validateActiveContext
      .mockResolvedValueOnce({ status: "invalid" })
      .mockResolvedValueOnce({ status: "error" });
    const { selectActiveContextAction } = await import(
      "@/app/(protected)/painel/selecionar-contexto/actions"
    );

    await selectActiveContextAction(
      IDLE_STATE,
      makeFormData({ contextSelection: `${ORG_RAW}:${HOSP_RAW}` }),
    );
    await selectActiveContextAction(
      IDLE_STATE,
      makeFormData({ contextSelection: `${ORG_RAW}:${HOSP_RAW}` }),
    );

    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("nao importa Supabase, service role nem storage do navegador (estatico)", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/app/(protected)/painel/selecionar-contexto/actions.ts",
      ),
      "utf8",
    );
    // Remove comentarios: a checagem incide sobre o codigo real.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

    expect(code).not.toMatch(/@\/lib\/supabase\/server/);
    expect(code).not.toMatch(/createClient/);
    expect(code).not.toMatch(/service[_-]?role/i);
    expect(code).not.toMatch(/localStorage/);
    expect(code).not.toMatch(/sessionStorage/);
    // Nao le "next" do FormData para definir o destino do redirect.
    expect(code).not.toMatch(/get\(\s*["'`]next["'`]\s*\)/);
  });
});
