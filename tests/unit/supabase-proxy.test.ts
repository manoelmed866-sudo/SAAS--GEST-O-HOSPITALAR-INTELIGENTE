import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getClaims: vi.fn(),
  getSession: vi.fn(),
  createServerClient: vi.fn((...args: unknown[]) => {
    void args;

    return {
      auth: {
        getClaims: mocks.getClaims,
        getSession: mocks.getSession,
      },
      from: mocks.from,
    };
  }),
}));

type ProxyCookieController = {
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

function getProxyCookieController(): ProxyCookieController {
  const options = mocks.createServerClient.mock.calls[0]?.[2];

  if (!options || typeof options !== "object") {
    throw new Error("Cliente Supabase do Proxy nao recebeu opcoes de cookies.");
  }

  return options as ProxyCookieController;
}

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

describe("updateSession", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-local-key";
    mocks.getClaims.mockResolvedValue({ data: { claims: {} }, error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function makeRequest() {
    return new NextRequest("https://app.local/dashboard", {
      headers: {
        cookie: "preferencia=compacta; sb-session=antigo",
      },
    });
  }

  it("cria cliente SSR, fornece cookies e chama getClaims uma vez", async () => {
    const { updateSession } = await import("@/lib/supabase/proxy");
    const request = makeRequest();

    const response = await updateSession(request);
    const options = getProxyCookieController();

    expect(response).toBeInstanceOf(NextResponse);
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
    expect(options.cookies.getAll()).toEqual(
      expect.arrayContaining([
        { name: "preferencia", value: "compacta" },
        { name: "sb-session", value: "antigo" },
      ]),
    );
    expect(mocks.getClaims).toHaveBeenCalledTimes(1);
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  it("aplica cookies retornados na requisicao e na resposta", async () => {
    mocks.getClaims.mockImplementationOnce(async () => {
      const options = getProxyCookieController();
      options.cookies.setAll(
        [{ name: "sb-session", value: "novo", options: { path: "/" } }],
        { "Cache-Control": "private, no-store" },
      );
      return { data: { claims: {} }, error: null };
    });
    const { updateSession } = await import("@/lib/supabase/proxy");
    const request = makeRequest();

    const response = await updateSession(request);

    expect(request.cookies.get("sb-session")?.value).toBe("novo");
    expect(response.cookies.get("sb-session")?.value).toBe("novo");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(request.cookies.get("preferencia")?.value).toBe("compacta");
  });

  it("ambiente invalido falha sem revelar valor", async () => {
    const secretLookingValue = "valor-nao-deve-aparecer";
    process.env.NEXT_PUBLIC_SUPABASE_URL = secretLookingValue;
    const { updateSession } = await import("@/lib/supabase/proxy");

    await expect(updateSession(makeRequest())).rejects.toThrow(/supabase invalida/i);

    try {
      await updateSession(makeRequest());
    } catch (error) {
      expect(String(error)).not.toContain(secretLookingValue);
    }
  });

  it("nao redireciona e nao consulta tabelas institucionais", async () => {
    const { updateSession } = await import("@/lib/supabase/proxy");

    const response = await updateSession(makeRequest());

    expect(response.headers.get("location")).toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
