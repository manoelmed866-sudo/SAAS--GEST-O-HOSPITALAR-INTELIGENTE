const mocks = vi.hoisted(() => {
  const cookieStore = {
    getAll: vi.fn(() => [{ name: "sb-session", value: "cookie-atual" }]),
    set: vi.fn(),
  };

  return {
    cookieStore,
    cookies: vi.fn(async () => cookieStore),
    createServerClient: vi.fn((...args: unknown[]) => {
      void args;

      return {
        auth: {
          getClaims: vi.fn(),
          getSession: vi.fn(),
        },
      };
    }),
  };
});

type CookieController = {
  cookies: {
    getAll: () => { name: string; value: string }[];
    setAll: (
      cookiesToSet: {
        name: string;
        value: string;
        options: Record<string, unknown>;
      }[],
      headers: Record<string, string>,
    ) => void;
  };
};

function getCookieController(): CookieController {
  const options = mocks.createServerClient.mock.calls[0]?.[2];

  if (!options || typeof options !== "object") {
    throw new Error("Cliente Supabase server nao recebeu opcoes de cookies.");
  }

  return options as CookieController;
}

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

describe("createClient para servidor", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-local-key";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("cria cliente server com cookies getAll e setAll", async () => {
    const { createClient } = await import("@/lib/supabase/server");

    await createClient();

    expect(mocks.createServerClient).toHaveBeenCalledWith(
      "http://127.0.0.1:54321",
      "publishable-local-key",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    );

    const options = getCookieController();
    expect(options.cookies.getAll()).toEqual([
      { name: "sb-session", value: "cookie-atual" },
    ]);

    options.cookies.setAll(
      [{ name: "sb-session", value: "cookie-novo", options: { path: "/" } }],
      {},
    );

    expect(mocks.cookieStore.set).toHaveBeenCalledWith(
      "sb-session",
      "cookie-novo",
      { path: "/" },
    );
  });

  it("ignora apenas erro esperado de cookie somente leitura", async () => {
    mocks.cookieStore.set.mockImplementationOnce(() => {
      throw new Error("Cookies can only be modified in a Server Action");
    });
    const { createClient } = await import("@/lib/supabase/server");

    await createClient();
    const options = getCookieController();

    expect(() =>
      options.cookies.setAll(
        [{ name: "sb-session", value: "cookie-novo", options: { path: "/" } }],
        {},
      ),
    ).not.toThrow();
  });

  it("propaga erro desconhecido de escrita de cookie", async () => {
    mocks.cookieStore.set.mockImplementationOnce(() => {
      throw new Error("falha inesperada");
    });
    const { createClient } = await import("@/lib/supabase/server");

    await createClient();
    const options = getCookieController();

    expect(() =>
      options.cookies.setAll(
        [{ name: "sb-session", value: "cookie-novo", options: { path: "/" } }],
        {},
      ),
    ).toThrow("falha inesperada");
  });

  it("nao executa getSession e nao reutiliza cliente global", async () => {
    const { createClient } = await import("@/lib/supabase/server");

    const firstClient = await createClient();
    const secondClient = await createClient();

    expect(mocks.createServerClient).toHaveBeenCalledTimes(2);
    expect(firstClient.auth.getSession).not.toHaveBeenCalled();
    expect(secondClient.auth.getSession).not.toHaveBeenCalled();
  });

  it("ambiente invalido impede criacao do cliente", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "url-invalida";
    const { createClient } = await import("@/lib/supabase/server");

    await expect(createClient()).rejects.toThrow(/supabase invalida/i);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });
});
