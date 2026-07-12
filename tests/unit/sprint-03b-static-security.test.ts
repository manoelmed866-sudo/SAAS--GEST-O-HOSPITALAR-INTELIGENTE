import { readFileSync } from "node:fs";

const sprintSourceFiles = [
  "src/lib/env/public.ts",
  "src/lib/supabase/client.ts",
  "src/lib/supabase/server.ts",
  "src/lib/supabase/proxy.ts",
  "src/proxy.ts",
];

function readProjectFile(path: string) {
  return readFileSync(path, "utf8");
}

describe("revisao estatica de seguranca da Sprint 03B", () => {
  it("nao usa APIs ou padroes proibidos nos arquivos de codigo da Sprint 03B", () => {
    const source = sprintSourceFiles.map(readProjectFile).join("\n");

    expect(source).not.toMatch(/getSession/);
    expect(source).not.toMatch(/service_role/i);
    expect(source).not.toMatch(/sb_secret_/i);
    expect(source).not.toMatch(/access_token/i);
    expect(source).not.toMatch(/localStorage/);
    expect(source).not.toMatch(/auth-helpers/i);
    expect(source).not.toMatch(/redirect/i);
    expect(source).not.toMatch(/organization_id/);
    expect(source).not.toMatch(/hospital_id/);
  });

  it("mantem getClaims no Proxy e nao cria middleware", () => {
    const proxySource = readProjectFile("src/lib/supabase/proxy.ts");

    expect(proxySource).toMatch(/getClaims/);
    expect(() => readProjectFile("middleware.ts")).toThrow();
    expect(() => readProjectFile("src/middleware.ts")).toThrow();
  });

  it("mantem .env.example sem segredo concreto", () => {
    const envExample = readProjectFile(".env.example");

    expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(envExample).toContain("replace_with_local_publishable_key");
    expect(envExample).not.toMatch(/postgres(?:ql)?:\/\//i);
    expect(envExample).not.toMatch(/eyJhbGci/i);
    expect(envExample).not.toMatch(/service_role/i);
    expect(envExample).not.toMatch(/sb_secret_/i);
  });
});
