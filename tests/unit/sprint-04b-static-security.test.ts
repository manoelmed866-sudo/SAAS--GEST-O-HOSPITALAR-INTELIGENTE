import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export {};

// Sprint 04B - Revisao estatica de seguranca e arquitetura
//
// Protege as decisoes da 04B contra regressao futura, sem alterar
// comportamento nem aparencia: o helper capability-gate (04B1), o painel com
// capacidades efetivas e a rota administrativa demonstrativa (04B2). As
// garantias comportamentais (render dos estados, mocks, ordem das chamadas em
// runtime) ficam nas suites dedicadas; aqui verificamos apenas invariantes de
// codigo, lendo os arquivos como texto, removendo comentarios antes das buscas
// e restringindo cada verificacao ao corpo relevante para evitar falsos
// positivos. O formulario de logout e explicitamente permitido; nenhum outro
// action de formulario e aceito. Nenhum conteudo integral de arquivo, segredo
// ou valor de ambiente e impresso.

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function readRaw(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function readStripped(relativePath: string): string {
  return stripComments(readRaw(relativePath));
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

function countMatches(source: string, pattern: RegExp): number {
  return (source.match(pattern) ?? []).length;
}

const GATE = "src/lib/auth/capability-gate.ts";
const PANEL = "src/app/(protected)/painel/page.tsx";
const ADMIN = "src/app/(protected)/painel/admin/equipe/page.tsx";
const ADMIN_TESTS = "tests/unit/auth-admin-team-page.test.tsx";
const D4_TESTS = "tests/unit/sprint-03d4-static-security.test.ts";

// Termos de dominio clinico/assistencial e de escopo futuro proibidos nos
// arquivos FUNCIONAIS da 04B. Esta lista vive apenas dentro deste teste
// estatico: encontra-la aqui e um falso positivo esperado, por isso o scan
// nunca inclui os proprios arquivos de teste.
const FORBIDDEN_SCOPE_TERMS = [
  /pacient/i,
  /prontu[aá]rio/i,
  /triagem/i,
  /protocolo/i,
  /diagn[oó]st/i,
  /medicament/i,
  /insumo/i,
  /estoque/i,
  /laborat[oó]rio/i,
  /\bUTI\b/,
  /\bIA\b/,
  /\bvoz\b/i,
  /integra[cç][aã]o/i,
];

// Codigos crus de permissao que jamais podem aparecer fora do banco.
const RAW_PERMISSION_CODES = [
  /hospital\.read/,
  /hospitals\.read/,
  /hospital_memberships\.read/,
  /hospital_memberships\.manage/,
  /audit\.read/,
  /context\.switch/,
];

describe("Sprint 04B - helper capability-gate", () => {
  const gate = readStripped(GATE);
  const fnBody = sliceBody(
    gate,
    "export async function evaluateHospitalCapability",
    "\n}",
  );

  it("assina exatamente um argumento tipado como HospitalCapability", () => {
    expect(gate).toMatch(
      /export async function evaluateHospitalCapability\(\s*capability:\s*HospitalCapability,?\s*\)/,
    );
    // Nenhum segundo parametro na assinatura.
    expect(gate).not.toMatch(
      /evaluateHospitalCapability\([^)]*,[^)]*:[^)]*\)/,
    );
  });

  it("deriva HospitalCapability de keyof HospitalCapabilities", () => {
    expect(gate).toMatch(
      /export type HospitalCapability\s*=\s*keyof HospitalCapabilities/,
    );
    // Sem string generica, any, unknown ou supressao de tipos.
    expect(gate).not.toMatch(/capability:\s*string/);
    expect(gate).not.toMatch(/\bany\b/);
    expect(gate).not.toMatch(/\bunknown\b/);
    expect(gate).not.toMatch(/@ts-ignore|@ts-expect-error/);
  });

  it("chama resolveActiveHospitalCapabilities exatamente uma vez", () => {
    expect(countMatches(gate, /resolveActiveHospitalCapabilities\(\)/g)).toBe(
      1,
    );
    expect(fnBody).toMatch(/await resolveActiveHospitalCapabilities\(\)/);
  });

  it("nao recebe hospitalId/organizationId nem acessa infraestrutura", () => {
    expect(gate).not.toMatch(/hospitalId/);
    expect(gate).not.toMatch(/organizationId/);
    expect(gate).not.toMatch(/createClient/);
    expect(gate).not.toMatch(/@\/lib\/supabase/);
    expect(gate).not.toMatch(/\.rpc\(/);
    expect(gate).not.toMatch(/\.from\(/);
    expect(gate).not.toMatch(/cookie/i);
    expect(gate).not.toMatch(/\bredirect\b/);
    expect(gate).not.toMatch(/notFound/);
    expect(gate).not.toMatch(/service[_-]?role/i);
  });

  it("nao interpreta papel, scope ou codigo cru de permissao", () => {
    expect(gate).not.toMatch(/\brole\b/i);
    expect(gate).not.toMatch(/\bscope\b/i);
    expect(gate).not.toMatch(/accessKind/);
    for (const code of RAW_PERMISSION_CODES) {
      expect(gate).not.toMatch(code);
    }
  });

  it("retorna somente os cinco estados do contrato discriminado", () => {
    expect(gate).toMatch(/\{\s*status:\s*"allowed";\s*context:\s*ActiveContext\s*\}/);
    expect(gate).toMatch(/\{\s*status:\s*"denied";\s*context:\s*ActiveContext\s*\}/);
    expect(gate).toMatch(/\{\s*status:\s*"absent"\s*\}/);
    expect(gate).toMatch(/\{\s*status:\s*"invalid"\s*\}/);
    expect(gate).toMatch(/\{\s*status:\s*"error"\s*\}/);
    // Nenhum estado fora do contrato.
    expect(countMatches(gate, /status:\s*"(?!allowed|denied|absent|invalid|error)/g)).toBe(0);
  });

  it("allowed/denied nao devolvem capabilities e so a capacidade pedida decide", () => {
    // Nenhum literal de retorno carrega a propriedade capabilities.
    expect(fnBody).not.toMatch(/capabilities:/);
    // A decisao vem exclusivamente de capabilities[capability].
    expect(fnBody).toMatch(/result\.capabilities\[capability\]/);
    expect(fnBody).toMatch(/\{\s*status:\s*"allowed",\s*context:\s*result\.context\s*\}/);
    expect(fnBody).toMatch(/\{\s*status:\s*"denied",\s*context:\s*result\.context\s*\}/);
    // Nenhuma capacidade e testada pelo nome dentro do helper.
    expect(fnBody).not.toMatch(/canManageMemberships|canReadHospital|canReadMemberships|canReadAudit|canSwitchContext/);
  });
});

describe("Sprint 04B - painel com capacidades efetivas", () => {
  const panel = readStripped(PANEL);

  it("aplica requirePortalAccess antes de resolver as capacidades, uma unica vez", () => {
    const accessAt = panel.indexOf("await requirePortalAccess()");
    const capabilitiesAt = panel.indexOf(
      "await resolveActiveHospitalCapabilities()",
    );
    expect(accessAt).toBeGreaterThan(-1);
    expect(capabilitiesAt).toBeGreaterThan(-1);
    expect(accessAt).toBeLessThan(capabilitiesAt);
    expect(
      countMatches(panel, /resolveActiveHospitalCapabilities\(\)/g),
    ).toBe(1);
  });

  it("nao chama resolveActiveContext diretamente nem acessa infraestrutura", () => {
    expect(panel).not.toMatch(/resolveActiveContext\b/);
    expect(panel).not.toMatch(/createClient/);
    expect(panel).not.toMatch(/@\/lib\/supabase/);
    expect(panel).not.toMatch(/\.rpc\(/);
    expect(panel).not.toMatch(/\.from\(/);
    expect(panel).not.toMatch(/cookies\s*\(|next\/headers/);
    expect(panel).not.toMatch(/\bredirect\b/);
  });

  it("mantem os quatro estados do contexto", () => {
    expect(panel).toMatch(/context\.status === "active"/);
    expect(panel).toMatch(/context\.status === "absent"/);
    expect(panel).toMatch(/context\.status === "invalid"/);
    expect(panel).toMatch(/context\.status === "error"/);
  });

  it("estado active: hospital do contexto revalidado e Trocar hospital fixo", () => {
    expect(panel).toMatch(/context\.context\.hospitalDisplayName/);
    expect(panel).toMatch(/context\.context\.hospitalCode/);
    expect(panel).toMatch(/Trocar hospital/);
    expect(panel).toMatch(/["'`]\/painel\/selecionar-contexto["'`]/);
    // "Trocar hospital" nao depende de canSwitchContext: a capacidade sequer
    // aparece no codigo do painel.
    expect(panel).not.toMatch(/canSwitchContext/);
  });

  it("link da equipe condicionado somente a canReadMemberships (04C.1)", () => {
    expect(panel).toMatch(
      /capabilities\.canReadMemberships \?[\s\S]{0,200}?["'`]\/painel\/admin\/equipe["'`][\s\S]{0,200}?Ver equipe/,
    );
    // canReadMemberships e a UNICA capacidade consumida pelo painel; a
    // visibilidade da listagem NAO depende mais de canManageMemberships.
    expect(countMatches(panel, /capabilities\./g)).toBe(1);
    expect(panel).not.toMatch(/capabilities\.canManageMemberships/);
    // Sem alternativa desabilitada quando a capacidade e falsa.
    expect(panel).not.toMatch(/disabled/i);
    expect(panel).not.toMatch(/aria-disabled/);
  });

  it("nao expoe nomes internos e mantem logout", () => {
    expect(panel).not.toMatch(/\brole\b/i);
    expect(panel).not.toMatch(/\bscope\b/i);
    expect(panel).not.toMatch(/accessKind/);
    for (const code of RAW_PERMISSION_CODES) {
      expect(panel).not.toMatch(code);
    }
    // O texto visivel nunca menciona o nome interno da capacidade fora do
    // condicional de codigo (unica ocorrencia ja contada acima).
    expect(countMatches(panel, /canReadMemberships/g)).toBe(1);
    expect(panel).toMatch(/logoutAction/);
    expect(panel).toMatch(/action=\{logoutAction\}/);
  });
});

describe("Sprint 04B - rota administrativa demonstrativa", () => {
  const admin = readStripped(ADMIN);

  it("e Server Component com force-dynamic", () => {
    expect(admin).not.toMatch(/["'`]use client["'`]/);
    expect(admin).toMatch(/export const dynamic = "force-dynamic"/);
  });

  it("aplica requirePortalAccess uma vez, antes do resolver da equipe (04C.1)", () => {
    expect(countMatches(admin, /requirePortalAccess\(\)/g)).toBe(1);
    const accessAt = admin.indexOf("await requirePortalAccess()");
    const teamAt = admin.indexOf("resolveActiveHospitalTeam(");
    expect(accessAt).toBeGreaterThan(-1);
    expect(teamAt).toBeGreaterThan(-1);
    expect(accessAt).toBeLessThan(teamAt);
  });

  it("delega tudo a resolveActiveHospitalTeam, chamado uma unica vez", () => {
    expect(countMatches(admin, /resolveActiveHospitalTeam\(\)/g)).toBe(1);
    // A pagina nao consulta capacidades nem o gate diretamente.
    expect(admin).not.toMatch(/evaluateHospitalCapability/);
    expect(admin).not.toMatch(/canManageMemberships|canReadMemberships/);
  });

  it("nao recebe props, searchParams, params nem IDs externos", () => {
    expect(admin).toMatch(/export default async function AdminTeamPage\(\)/);
    expect(admin).not.toMatch(/searchParams/);
    expect(admin).not.toMatch(/\bparams\b/);
    expect(admin).not.toMatch(/\bprops\b/);
    expect(admin).not.toMatch(/hospitalId\b/);
    expect(admin).not.toMatch(/organizationId/);
  });

  it("nao acessa infraestrutura nem interpreta permissao crua", () => {
    expect(admin).not.toMatch(/createClient/);
    expect(admin).not.toMatch(/@\/lib\/supabase/);
    expect(admin).not.toMatch(/\.rpc\(/);
    expect(admin).not.toMatch(/\.from\(/);
    expect(admin).not.toMatch(/cookie/i);
    expect(admin).not.toMatch(/\bredirect\b/);
    expect(admin).not.toMatch(/notFound/);
    expect(admin).not.toMatch(/service[_-]?role/i);
    expect(admin).not.toMatch(/\brole\b/i);
    expect(admin).not.toMatch(/\bscope\b/i);
    expect(admin).not.toMatch(/accessKind/);
    // Nao consulta o mapa de capacidades diretamente: so o gate decide.
    expect(admin).not.toMatch(/resolveActiveHospitalCapabilities/);
    expect(admin).not.toMatch(/\.capabilities\b/);
    for (const code of RAW_PERMISSION_CODES) {
      expect(admin).not.toMatch(code);
    }
  });

  it("nao cria Server Action, CRUD ou controles de mutacao", () => {
    expect(admin).not.toMatch(/["'`]use server["'`]/);
    expect(admin).not.toMatch(/adicionar/i);
    expect(admin).not.toMatch(/convidar/i);
    expect(admin).not.toMatch(/editar/i);
    expect(admin).not.toMatch(/suspender/i);
    expect(admin).not.toMatch(/excluir/i);
    expect(admin).not.toMatch(/remover/i);
    expect(admin).not.toMatch(/salvar/i);
    expect(admin).not.toMatch(/<input|<select|<textarea/);
  });

  it("o unico form permitido e o de logout", () => {
    const formActions = countMatches(admin, /action=\{/g);
    const logoutActions = countMatches(admin, /action=\{logoutAction\}/g);
    expect(formActions).toBeGreaterThan(0);
    expect(formActions).toBe(logoutActions);
  });
});

describe("Sprint 04B - estados da rota administrativa", () => {
  const admin = readStripped(ADMIN);
  const allowedBody = sliceBody(
    admin,
    'team.status === "allowed"',
    'team.status === "denied"',
  );
  const deniedBody = sliceBody(
    admin,
    'team.status === "denied"',
    'team.status === "absent"',
  );
  const absentBody = sliceBody(
    admin,
    'team.status === "absent"',
    'team.status === "invalid"',
  );
  const invalidBody = sliceBody(
    admin,
    'team.status === "invalid"',
    "admin-team-error-title",
  );
  // O bloco final (fallback) e o estado error.
  const errorBody = admin.slice(admin.indexOf("admin-team-error-title"));

  it("cobre os cinco estados do resolver", () => {
    expect(admin).toMatch(/team\.status === "allowed"/);
    expect(admin).toMatch(/team\.status === "denied"/);
    expect(admin).toMatch(/team\.status === "absent"/);
    expect(admin).toMatch(/team\.status === "invalid"/);
    expect(errorBody).toMatch(/Não foi possível carregar a equipe/);
  });

  it("allowed: equipe do hospital do contexto, com estado vazio proprio e sem CRUD", () => {
    expect(allowedBody).toMatch(/Equipe do hospital/);
    expect(allowedBody).toMatch(/team\.context\.hospitalDisplayName/);
    expect(allowedBody).toMatch(/Nenhum integrante encontrado/);
    expect(allowedBody).toMatch(/team\.members\.map/);
    expect(allowedBody).not.toMatch(/<input|<select|<textarea/);
  });

  it("denied: mensagem generica sem conteudo allowed nem vazamento interno", () => {
    expect(deniedBody).toMatch(/Sem permissão para visualizar a equipe/);
    expect(deniedBody).not.toMatch(/Equipe do hospital/);
    expect(deniedBody).not.toMatch(/hospitalDisplayName/);
    expect(deniedBody).not.toMatch(/canManageMemberships|canReadMemberships/);
    expect(deniedBody).not.toMatch(/\brole\b|\bscope\b|\bpapel\b|capacidad/i);
  });

  it("absent e invalid: apontam para o seletor e para o painel", () => {
    for (const body of [absentBody, invalidBody]) {
      expect(body).toMatch(/["'`]\/painel\/selecionar-contexto["'`]/);
      expect(body).toMatch(/["'`]\/painel["'`]/);
    }
  });

  it("error: tentar novamente na propria rota e retorno ao painel", () => {
    expect(errorBody).toMatch(/["'`]\/painel\/admin\/equipe["'`]/);
    expect(errorBody).toMatch(/Tentar novamente/);
    expect(errorBody).toMatch(/["'`]\/painel["'`]/);
  });

  it("todos os estados possuem logout", () => {
    for (const body of [allowedBody, deniedBody, absentBody, invalidBody, errorBody]) {
      expect(body).toMatch(/action=\{logoutAction\}/);
    }
  });
});

describe("Sprint 04B - a UI nao e a unica barreira", () => {
  const adminTests = readRaw(ADMIN_TESTS);

  it("existe cenario denied acessando a rota diretamente, sem renderizar o painel", () => {
    expect(adminTests).toMatch(/status:\s*"denied"/);
    // A suite importa somente a pagina administrativa; o painel nunca e
    // renderizado antes da rota.
    expect(adminTests).toMatch(/@\/app\/\(protected\)\/painel\/admin\/equipe\/page/);
    expect(adminTests).not.toMatch(/@\/app\/\(protected\)\/painel\/page/);
  });

  it("denied esconde o conteudo allowed e mantem o retorno ao painel", () => {
    expect(adminTests).toMatch(/sem permissão para visualizar a equipe/i);
    expect(adminTests).toMatch(/equipe do hospital/i);
    expect(adminTests).toMatch(/not\.toBeInTheDocument/);
    expect(adminTests).toMatch(/voltar ao painel/i);
  });

  it("comprova o gate server-side: requirePortalAccess e o resolver da equipe", () => {
    expect(adminTests).toMatch(/requirePortalAccess/);
    expect(adminTests).toMatch(/resolveActiveHospitalTeam/);
    expect(adminTests).toMatch(/toHaveBeenCalledTimes\(1\)/);
  });
});

describe("Sprint 04B - regressao da revisao estatica 03D4", () => {
  const d4 = readRaw(D4_TESTS);

  it("exige resolveActiveHospitalCapabilities e proibe resolveActiveContext direto", () => {
    expect(d4).toMatch(/toMatch\(\/resolveActiveHospitalCapabilities\//);
    expect(d4).toMatch(/not\.toMatch\(\/resolveActiveContext\\b\//);
  });

  it("mantem as proibicoes de infraestrutura no painel", () => {
    expect(d4).toMatch(/not\.toMatch\(\/createClient\//);
    expect(d4).toMatch(/not\.toMatch\(\/service\[_-\]\?role\/i\)/);
    expect(d4).toMatch(/not\.toMatch\(\/cookies\\s\*\\\(\//);
    expect(d4).toMatch(/not\.toMatch\(\/next\\\/headers\//);
    expect(d4).toMatch(/not\.toMatch\(\/\\bredirect\\b\//);
    expect(d4).toMatch(/not\.toMatch\(\/hospitalId\//);
    expect(d4).toMatch(/not\.toMatch\(\/organizationId\//);
  });

  it("mantem a revalidacao do contexto no servidor (.from restrito a hospitals)", () => {
    expect(d4).toMatch(/validateActiveContext/);
    expect(d4).toMatch(/hospitals/);
    expect(d4).toMatch(/maybeSingle/);
  });

  it("os quatro estados e o logout seguem comprovados nas suites comportamentais", () => {
    const pages = readRaw("tests/unit/auth-pages.test.tsx");
    expect(pages).toMatch(/status:\s*"active"/);
    expect(pages).toMatch(/status:\s*"absent"/);
    expect(pages).toMatch(/status:\s*"invalid"/);
    expect(pages).toMatch(/status:\s*"error"/);
    expect(pages).toMatch(/canManageMemberships/);
    expect(pages).toMatch(/sair/i);
  });
});

describe("Sprint 04B - escopo proibido nos arquivos funcionais", () => {
  // Somente arquivos FUNCIONAIS sao escaneados. As listas de proibicao dos
  // proprios testes estaticos (incluindo este) sao falsos positivos esperados
  // e ficam fora do scan.
  const functionalFiles = [GATE, PANEL, ADMIN];

  for (const file of functionalFiles) {
    it(`${file} nao introduz dominio clinico nem escopo futuro`, () => {
      const source = readStripped(file);
      for (const term of FORBIDDEN_SCOPE_TERMS) {
        expect(source).not.toMatch(term);
      }
    });
  }
});
