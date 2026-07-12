import { existsSync } from "node:fs";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  updateSession: vi.fn(async () => NextResponse.next()),
}));

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: mocks.updateSession,
}));

describe("src/proxy", () => {
  it("exporta proxy e delega para updateSession", async () => {
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("https://app.local/");

    await proxy(request);

    expect(mocks.updateSession).toHaveBeenCalledWith(request);
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
});
