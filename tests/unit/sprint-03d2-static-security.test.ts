import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export {};

// Sprint 03D2 - Revisao estatica de seguranca consolidada
//
// Varre os arquivos de codigo da selecao de contexto (action, formulario
// cliente e pagina server) garantindo que nenhum deles introduza service role,
// cliente Supabase direto, storage do navegador, fetch ou destino de redirect
// vindo do navegador. As garantias comportamentais ficam nas suites dedicadas;
// aqui protegemos os invariantes contra regressao futura.

const SPRINT_03D2_SOURCES = [
  "src/app/(protected)/painel/selecionar-contexto/actions.ts",
  "src/app/(protected)/painel/selecionar-contexto/context-selector-form.tsx",
  "src/app/(protected)/painel/selecionar-contexto/page.tsx",
];

function readCode(relativePath: string): string {
  const source = readFileSync(resolve(process.cwd(), relativePath), "utf8");

  // Remove comentarios: a checagem incide sobre o codigo real.
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

describe("revisao estatica de seguranca da Sprint 03D2", () => {
  it.each(SPRINT_03D2_SOURCES)(
    "%s nao usa Supabase direto, service role nem storage do navegador",
    (relativePath) => {
      const code = readCode(relativePath);

      expect(code).not.toMatch(/@\/lib\/supabase\/server/);
      expect(code).not.toMatch(/createClient/);
      expect(code).not.toMatch(/service[_-]?role/i);
      expect(code).not.toMatch(/localStorage/);
      expect(code).not.toMatch(/sessionStorage/);
      expect(code).not.toMatch(/\bfetch\b/);
    },
  );

  it("a action nao le um destino de redirect vindo do navegador", () => {
    const code = readCode(
      "src/app/(protected)/painel/selecionar-contexto/actions.ts",
    );

    // O unico redirect permitido e fixo para /painel; nenhum next do FormData.
    expect(code).not.toMatch(/get\(\s*["'`]next["'`]\s*\)/);
    expect(code).toMatch(/redirect\(\s*["'`]\/painel["'`]\s*\)/);
  });

  it("o formulario cliente e a pagina nao chamam redirect", () => {
    const formCode = readCode(
      "src/app/(protected)/painel/selecionar-contexto/context-selector-form.tsx",
    );
    const pageCode = readCode(
      "src/app/(protected)/painel/selecionar-contexto/page.tsx",
    );

    expect(formCode).not.toMatch(/redirect/);
    expect(pageCode).not.toMatch(/redirect/);
    expect(pageCode).not.toMatch(/resolveActiveContext/);
  });
});
