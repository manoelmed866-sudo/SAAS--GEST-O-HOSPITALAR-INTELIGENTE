import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export {};

// Sprint 03D4 - Revisao estatica de seguranca consolidada
//
// Protege as decisoes das Etapas 1 e 2 contra regressao futura, sem alterar
// comportamento nem aparencia. As garantias comportamentais (ordem do gate,
// render dos estados, mapeamento do contexto) ficam nas suites dedicadas; aqui
// verificamos apenas invariantes de codigo, com escopo por funcao para evitar
// falsos positivos (ex.: o inventario da 03D1 consulta organizations de forma
// legitima em outra funcao de context.ts).

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function readStripped(relativePath: string): string {
  return stripComments(
    readFileSync(resolve(process.cwd(), relativePath), "utf8"),
  );
}

// Extrai o trecho entre um marcador inicial e o proximo marcador, ja com
// comentarios removidos, para restringir a verificacao ao escopo correto.
function sliceBody(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  if (from === -1) {
    throw new Error("marcador inicial nao encontrado: " + start);
  }
  const to = source.indexOf(end, from + start.length);

  return source.slice(from, to === -1 ? undefined : to);
}

const CLINICAL_TERMS = [
  /patients?\b/i,
  /pacientes?/i,
  /diagnos/i,
  /protocol/i,
  /protocolo/i,
  /medicat/i,
  /medicament/i,
  /supplies/i,
  /insumo/i,
  /\binventory\b/i,
  /\bestoque\b/i,
  /clinical/i,
  /assistential/i,
  /assistencial/i,
];

const PANEL = "src/app/(protected)/painel/page.tsx";
const CONTEXT = "src/lib/auth/context.ts";
const COOKIE = "src/lib/auth/context-cookie.ts";
const ACTION =
  "src/app/(protected)/painel/selecionar-contexto/actions.ts";

describe("Sprint 03D4 - seguranca estatica do painel", () => {
  const panel = readStripped(PANEL);

  it("consome o gate e as capacidades pelas funcoes corretas", () => {
    expect(panel).toMatch(/requirePortalAccess/);
    // Sprint 04B2: o painel resolve contexto E capacidades numa unica chamada.
    expect(panel).toMatch(/resolveActiveHospitalCapabilities/);
    // E nao chama mais resolveActiveContext diretamente: a resolucao do
    // contexto passa a ser interna a resolveActiveHospitalCapabilities (04A2).
    expect(panel).not.toMatch(/resolveActiveContext\b/);
    expect(panel).toMatch(/hospitalDisplayName/);
    expect(panel).toMatch(/hospitalCode/);
    expect(panel).toMatch(/["'`]\/painel\/selecionar-contexto["'`]/);
  });

  it("nao acessa Supabase, cookie, storage, fetch nem redirect", () => {
    expect(panel).not.toMatch(/createClient/);
    expect(panel).not.toMatch(/@\/lib\/supabase\/server/);
    expect(panel).not.toMatch(/service[_-]?role/i);
    expect(panel).not.toMatch(/cookies\s*\(/);
    expect(panel).not.toMatch(/next\/headers/);
    expect(panel).not.toMatch(/localStorage/);
    expect(panel).not.toMatch(/sessionStorage/);
    expect(panel).not.toMatch(/\bfetch\b/);
    expect(panel).not.toMatch(/\bredirect\b/);
    expect(panel).not.toMatch(/window\.location/);
  });

  it("nao expoe IDs como texto nem mantem o texto antigo", () => {
    expect(panel).not.toMatch(/hospitalId/);
    expect(panel).not.toMatch(/organizationId/);
    expect(panel).not.toMatch(/Esta sprint ainda nao cria contexto ativo/);
  });

  it("nao contem dominio clinico ou assistencial", () => {
    for (const term of CLINICAL_TERMS) {
      expect(panel).not.toMatch(term);
    }
  });
});

describe("Sprint 03D4 - seguranca estatica de validateActiveContext", () => {
  const context = readStripped(CONTEXT);
  const body = sliceBody(
    context,
    "export async function validateActiveContext",
    "export async function resolveActiveContext",
  );

  it("consulta apenas hospitals com os campos e filtros esperados", () => {
    expect(body).toMatch(/\.from\(\s*["'`]hospitals["'`]\s*\)/);
    expect((body.match(/\.from\(/g) ?? []).length).toBe(1);
    expect(body).toMatch(
      /\.select\(\s*["'`]id, organization_id, code, display_name["'`]\s*\)/,
    );
    expect(body).toMatch(/\.eq\(\s*["'`]id["'`]/);
    expect(body).toMatch(/\.eq\(\s*["'`]organization_id["'`]/);
    expect(body).toMatch(
      /\.eq\(\s*["'`]status["'`]\s*,\s*["'`]active["'`]\s*\)/,
    );
    expect(body).toMatch(/maybeSingle\(/);
  });

  it("nao consulta organizations, memberships, cookie nem faz redirect", () => {
    expect(body).not.toMatch(/["'`]organizations["'`]/);
    expect(body).not.toMatch(/membership/i);
    expect(body).not.toMatch(/service[_-]?role/i);
    expect(body).not.toMatch(/readContextCookie|cookies\s*\(/);
    expect(body).not.toMatch(/\bredirect\b/);
  });

  it("mapeia codigo e nome exclusivamente da linha do banco", () => {
    expect(body).toMatch(/hospitalCode:\s*data\.code/);
    expect(body).toMatch(/hospitalDisplayName:\s*data\.display_name/);
    // Nenhum ID e usado como fallback para nome ou codigo.
    expect(body).not.toMatch(/hospitalCode:\s*[^,}\n]*hospitalId/);
    expect(body).not.toMatch(/hospitalDisplayName:\s*[^,}\n]*organizationId/);
  });

  it("nao contem dominio clinico ou assistencial", () => {
    for (const term of CLINICAL_TERMS) {
      expect(body).not.toMatch(term);
    }
  });
});

describe("Sprint 03D4 - payload do cookie permanece minimo", () => {
  const cookie = readStripped(COOKIE);
  const writeBody = sliceBody(
    cookie,
    "export async function writeContextCookie",
    "export async function readContextCookie",
  );

  it("serializa somente organizationId, hospitalId e v", () => {
    expect(writeBody).toMatch(/organizationId/);
    expect(writeBody).toMatch(/hospitalId/);
    expect(writeBody).toMatch(/v:\s*ACTIVE_CONTEXT_FORMAT_VERSION/);
  });

  it("nao persiste nome, codigo ou nome de organizacao", () => {
    expect(writeBody).not.toMatch(/hospitalCode/);
    expect(writeBody).not.toMatch(/hospitalDisplayName/);
    expect(writeBody).not.toMatch(/displayName/);
    expect(writeBody).not.toMatch(/organizationName/);
    expect(writeBody).not.toMatch(/\bcode\b/);
  });
});

describe("Sprint 03D4 - seguranca estatica da acao de selecao", () => {
  const action = readStripped(ACTION);

  it("revalida por validateActiveContext e grava so no caminho active", () => {
    expect(action).toMatch(/validateActiveContext/);
    expect(action).toMatch(/writeContextCookie/);
    expect(action).toMatch(/status\s*!==\s*["'`]active["'`]/);
  });

  it("redireciona apenas para /painel, sem next do navegador", () => {
    expect(action).toMatch(/redirect\(\s*["'`]\/painel["'`]\s*\)/);
    expect((action.match(/redirect\(/g) ?? []).length).toBe(1);
    expect(action).not.toMatch(/get\(\s*["'`]next["'`]\s*\)/);
    expect(action).not.toMatch(/https?:\/\//);
  });

  it("nao usa Supabase direto, storage nem grava nome/codigo no cookie", () => {
    expect(action).not.toMatch(/createClient/);
    expect(action).not.toMatch(/@\/lib\/supabase\/server/);
    expect(action).not.toMatch(/localStorage/);
    expect(action).not.toMatch(/sessionStorage/);
    expect(action).not.toMatch(/hospitalCode/);
    expect(action).not.toMatch(/hospitalDisplayName/);
  });
});
