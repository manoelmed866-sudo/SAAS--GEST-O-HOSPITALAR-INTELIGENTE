const mocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  revalidatePath: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
  createClient: vi.fn(),
  clearContextCookie: vi.fn(),
}));

export {};

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/auth/context-cookie", () => ({
  clearContextCookie: mocks.clearContextCookie,
}));

function makeFormData(values: Record<string, string>): FormData {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

function mockSupabaseClient() {
  return {
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
      getUser: mocks.getUser,
      getSession: mocks.getSession,
    },
  };
}

describe("actions de autenticacao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue(mockSupabaseClient());
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "usuario-1" } },
      error: null,
    });
    mocks.clearContextCookie.mockResolvedValue(undefined);
  });

  it("valida campos de login sem consultar Supabase", async () => {
    const { loginAction } = await import("@/app/(auth)/actions");

    const result = await loginAction(
      { status: "idle" },
      makeFormData({ email: "invalido", password: "", next: "/painel" }),
    );

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/revise/i);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("executa login com email normalizado e redireciona para next seguro", async () => {
    const { loginAction } = await import("@/app/(auth)/actions");

    await expect(
      loginAction(
        { status: "idle" },
        makeFormData({
          email: " MEDICO@HOSPITAL.TEST ",
          password: "senha-local",
          next: "/painel",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/painel");

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "medico@hospital.test",
      password: "senha-local",
    });
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("retorna erro generico quando as credenciais falham", async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({
      error: new Error("senha incorreta interna"),
    });
    const { loginAction } = await import("@/app/(auth)/actions");

    const result = await loginAction(
      { status: "idle" },
      makeFormData({
        email: "usuario@hospital.test",
        password: "senha-local",
        next: "/painel",
      }),
    );

    expect(result).toMatchObject({
      status: "error",
      message: "Nao foi possivel entrar com os dados informados.",
    });
    expect(String(result.message)).not.toContain("senha incorreta interna");
  });

  it("encerra sessao local e redireciona para login", async () => {
    const { logoutAction } = await import("@/app/(auth)/actions");

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.clearContextCookie).toHaveBeenCalledTimes(1);
    expect(mocks.getUser).toHaveBeenCalledTimes(1);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("limpa o contexto e nao chama signOut quando nao existe usuario autenticado", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { logoutAction } = await import("@/app/(auth)/actions");

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.clearContextCookie).toHaveBeenCalledTimes(1);
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("limpa o contexto e lanca mensagem generica quando o signOut falha", async () => {
    mocks.signOut.mockResolvedValueOnce({
      error: new Error("sessao supabase corrompida interna"),
    });
    const { logoutAction } = await import("@/app/(auth)/actions");

    await expect(logoutAction()).rejects.toThrow(
      "Nao foi possivel encerrar a sessao com seguranca.",
    );

    expect(mocks.clearContextCookie).toHaveBeenCalledTimes(1);
    // Nao ocorre redirect final: o unico redirect possivel seria o de saida.
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("nao expoe a mensagem interna do Supabase ao falhar o signOut", async () => {
    mocks.signOut.mockResolvedValueOnce({
      error: new Error("sessao supabase corrompida interna"),
    });
    const { logoutAction } = await import("@/app/(auth)/actions");

    await expect(logoutAction()).rejects.not.toThrow(
      /sessao supabase corrompida interna/,
    );
  });

  it("limpa o contexto antes do signOut", async () => {
    const { logoutAction } = await import("@/app/(auth)/actions");

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/login");

    const clearOrder = mocks.clearContextCookie.mock.invocationCallOrder[0];
    const signOutOrder = mocks.signOut.mock.invocationCallOrder[0];
    expect(clearOrder).toBeLessThan(signOutOrder);
  });

  it("limpa o contexto antes do redirect quando nao ha usuario", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { logoutAction } = await import("@/app/(auth)/actions");

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/login");

    const clearOrder = mocks.clearContextCookie.mock.invocationCallOrder[0];
    const redirectOrder = mocks.redirect.mock.invocationCallOrder[0];
    expect(clearOrder).toBeLessThan(redirectOrder);
  });
});
