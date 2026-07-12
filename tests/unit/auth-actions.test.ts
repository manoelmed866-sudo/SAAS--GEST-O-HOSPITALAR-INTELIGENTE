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

    expect(mocks.getUser).toHaveBeenCalledTimes(1);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("nao chama signOut quando nao existe usuario autenticado", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { logoutAction } = await import("@/app/(auth)/actions");

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.signOut).not.toHaveBeenCalled();
  });
});
