import { readFileSync } from "node:fs";

const sprint03cSourceFiles = [
  "src/app/(auth)/actions.ts",
  "src/app/(auth)/login/login-form.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/acesso-negado/page.tsx",
  "src/app/(protected)/painel/page.tsx",
  "src/lib/auth/access.ts",
  "src/lib/auth/redirects.ts",
  "src/lib/supabase/proxy.ts",
  "src/proxy.ts",
];

describe("controles estaticos da Sprint 03C", () => {
  const source = sprint03cSourceFiles
    .map((filePath) => readFileSync(filePath, "utf8"))
    .join("\n");

  it("nao implementa cadastro publico, recuperacao de senha ou leitura insegura de sessao", () => {
    expect(source).not.toMatch(/signUp|resetPasswordForEmail|getSession/);
  });

  it("nao usa chaves secretas, service role ou armazenamento local", () => {
    expect(source).not.toMatch(/service_role|sb_secret_|localStorage|sessionStorage/);
  });

  it("nao cria contexto ativo de instituicao ou hospital", () => {
    expect(source).not.toMatch(/activeInstitution|activeHospital|selectedHospital/);
  });

  it("nao adiciona rotas de Sprint 03D", () => {
    expect(source).not.toMatch(/selecionar-instituicao|selecionar-hospital/);
  });
});
