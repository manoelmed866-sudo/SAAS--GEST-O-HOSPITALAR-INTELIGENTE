import { existsSync } from "node:fs";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  refreshSession: vi.fn(async () => ({
    response: NextResponse.next(),
    claims: null as Record<string, unknown> | null,
  })),
}));

vi.mock("@/lib/supabase/proxy", () => ({
  refreshSession: mocks.refreshSession,
}));

describe("src/proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.refreshSession.mockResolvedValue({
      response: NextResponse.next(),
      claims: null,
    });
  });

  it("exporta proxy e delega para refreshSession", async () => {
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("https://app.local/");

    await proxy(request);

    expect(mocks.refreshSession).toHaveBeenCalledWith(request);
  });

  it("exporta matcher sem excluir areas futuras da aplicacao", async () => {
    const { config } = await import("@/proxy");
    const matcher = config.matcher[0];

    expect(matcher).toContain("_next/static");
    expect(matcher).toContain("_next/image");
    expect(matcher).toContain("favicon.ico");
    expect(matcher).toContain("robots.txt");
    expect(matcher).toContain("sitemap.xml");
    expect(matcher).not.toContain("login");
    expect(matcher).not.toContain("authenticated");
  });

  it("nao cria middleware.ts", () => {
    expect(existsSync("middleware.ts")).toBe(false);
    expect(existsSync("src/middleware.ts")).toBe(false);
  });

  it("mantem rotas publicas sem redirecionamento quando nao ha sessao", async () => {
    const { proxy } = await import("@/proxy");

    const homeResponse = await proxy(new NextRequest("https://app.local/"));
    const loginResponse = await proxy(
      new NextRequest("https://app.local/login"),
    );
    const deniedResponse = await proxy(
      new NextRequest("https://app.local/acesso-negado"),
    );

    expect(homeResponse.headers.get("location")).toBeNull();
    expect(loginResponse.headers.get("location")).toBeNull();
    expect(deniedResponse.headers.get("location")).toBeNull();
  });

  it("redireciona usuario anonimo de rota protegida para login com next seguro", async () => {
    const { proxy } = await import("@/proxy");

    const response = await proxy(new NextRequest("https://app.local/painel"));

    expect(response.headers.get("location")).toBe(
      "https://app.local/login?next=%2Fpainel",
    );
  });

  it("preserva acesso ao painel quando ha claims autenticadas", async () => {
    mocks.refreshSession.mockResolvedValueOnce({
      response: NextResponse.next(),
      claims: { sub: "usuario-1" },
    });
    const { proxy } = await import("@/proxy");

    const response = await proxy(new NextRequest("https://app.local/painel"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("redireciona login autenticado para o painel", async () => {
    mocks.refreshSession.mockResolvedValueOnce({
      response: NextResponse.next(),
      claims: { sub: "usuario-1" },
    });
    const { proxy } = await import("@/proxy");

    const response = await proxy(new NextRequest("https://app.local/login"));

    expect(response.headers.get("location")).toBe("https://app.local/painel");
  });

  it("preserva cookies renovados ao redirecionar", async () => {
    const refreshedResponse = NextResponse.next();
    refreshedResponse.cookies.set("sb-session", "novo", { path: "/" });
    mocks.refreshSession.mockResolvedValueOnce({
      response: refreshedResponse,
      claims: null,
    });
    const { proxy } = await import("@/proxy");

    const response = await proxy(new NextRequest("https://app.local/painel"));

    expect(response.cookies.get("sb-session")?.value).toBe("novo");
  });
});
