import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export {};

// Sprint 04A - Revisao estatica de seguranca e arquitetura
//
// Protege as decisoes das etapas 04A1 (contrato SQL) e 04A2 (consumidor
// server-side) contra regressao futura, sem alterar comportamento. As garantias
// comportamentais ficam nas suites dedicadas (auth-capabilities.test.ts e o
// pgTAP 007); aqui verificamos apenas invariantes de codigo. Todo o texto e lido
// como fonte e os comentarios sao removidos antes das checagens, para nao
// acusar palavras presentes apenas em comentarios.

function stripTsComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function stripSqlComments(source: string): string {
  return source.replace(/--.*$/gm, "");
}

function readStrippedTs(relativePath: string): string {
  return stripTsComments(readFileSync(resolve(process.cwd(), relativePath), "utf8"));
}

function readStrippedSql(relativePath: string): string {
  return stripSqlComments(readFileSync(resolve(process.cwd(), relativePath), "utf8"));
}

// Extrai o trecho entre um marcador inicial e o proximo marcador (ja sem
// comentarios), para restringir a verificacao ao escopo correto.
function sliceBody(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  if (from === -1) {
    throw new Error("marcador inicial nao encontrado: " + start);
  }
  const to = source.indexOf(end, from + start.length);

  return source.slice(from, to === -1 ? undefined : to);
}

const CAPABILITIES = "src/lib/auth/capabilities.ts";
const MIGRATION =
  "supabase/migrations/20260713010000_sprint_04a_effective_hospital_capabilities.sql";
const TYPES = "src/types/database.types.ts";
const COOKIE = "src/lib/auth/context-cookie.ts";

const RAW_PERMISSION_CODES = [
  /hospitals?\.read/,
  /hospital_memberships\.read/,
  /hospital_memberships\.manage/,
  /audit\.read/,
  /context\.switch/,
];

const CLINICAL_TERMS = [
  /pacientes?/i,
  /patients?\b/i,
  /prontuario/i,
  /triagem/i,
  /diagnos/i,
  /protocolo/i,
  /medicament/i,
  /insumo/i,
  /\bestoque\b/i,
  /laboratorio/i,
  /\buti\b/i,
  /assistencial/i,
];

describe("Sprint 04A - capabilities.ts: invariantes de seguranca", () => {
  const full = readStrippedTs(CAPABILITIES);
  const resolverBody = sliceBody(
    full,
    "export async function resolveActiveHospitalCapabilities",
    "\n}",
  );

  it("o resolver nao possui parametros", () => {
    expect(full).toMatch(/resolveActiveHospitalCapabilities\(\)\s*:/);
    expect(full).not.toMatch(/resolveActiveHospitalCapabilities\(\s*[A-Za-z_]/);
  });

  it("chama resolveActiveContext exatamente uma vez no resolver", () => {
    expect((resolverBody.match(/resolveActiveContext\(/g) ?? []).length).toBe(1);
  });

  it("chama .rpc exatamente uma vez (caminho active)", () => {
    expect((resolverBody.match(/\.rpc\(/g) ?? []).length).toBe(1);
  });

  it("nao consulta tabelas via .from nem roles/permissions diretamente", () => {
    expect(full).not.toMatch(/\.from\(/);
    expect(full).not.toMatch(/["'`]roles["'`]/);
    expect(full).not.toMatch(/["'`]permissions["'`]/);
    expect(full).not.toMatch(/["'`]role_permissions["'`]/);
  });

  it("nao le cookie, storage, query string nem form data", () => {
    expect(full).not.toMatch(/next\/headers/);
    expect(full).not.toMatch(/\bcookies?\b/i);
    expect(full).not.toMatch(/localStorage/);
    expect(full).not.toMatch(/sessionStorage/);
    expect(full).not.toMatch(/searchParams|querystring|URLSearchParams/i);
    expect(full).not.toMatch(/formData|FormData/);
  });

  it("nao redireciona, nao usa getSession/getClaims nem service role", () => {
    expect(full).not.toMatch(/\bredirect\b/);
    expect(full).not.toMatch(/getSession/);
    expect(full).not.toMatch(/getClaims/);
    expect(full).not.toMatch(/service[_-]?role/i);
  });

  it("nao expoe codigos crus de permissao, papel ou scope", () => {
    for (const code of RAW_PERMISSION_CODES) {
      expect(full).not.toMatch(code);
    }
    expect(full).not.toMatch(/\bscope\b/);
    expect(full).not.toMatch(/\brole\b/);
  });

  it("nao contem termos clinicos ou assistenciais", () => {
    for (const term of CLINICAL_TERMS) {
      expect(full).not.toMatch(term);
    }
  });
});

describe("Sprint 04A - capabilities.ts: origem do hospital", () => {
  const full = readStrippedTs(CAPABILITIES);
  const resolverBody = sliceBody(
    full,
    "export async function resolveActiveHospitalCapabilities",
    "\n}",
  );

  it("chama exatamente a RPC get_effective_hospital_capabilities", () => {
    expect(resolverBody).toMatch(
      /\.rpc\(\s*["'`]get_effective_hospital_capabilities["'`]/,
    );
  });

  it("o argumento e apenas target_hospital_id derivado do context revalidado", () => {
    expect(resolverBody).toMatch(
      /target_hospital_id:\s*context\.context\.hospitalId/,
    );
    // Nenhum organizationId e enviado como argumento da RPC.
    expect(resolverBody).not.toMatch(/organizationId/);
  });

  it("devolve o mesmo context.context revalidado", () => {
    expect(resolverBody).toMatch(/context:\s*context\.context/);
  });
});

describe("Sprint 04A - capabilities.ts: contrato e validacao", () => {
  const full = readStrippedTs(CAPABILITIES);
  const capabilitiesType = sliceBody(
    full,
    "export type HospitalCapabilities = {",
    "}",
  );

  it("HospitalCapabilities tem exatamente as sete capacidades camelCase", () => {
    for (const cap of [
      "canReadHospital",
      "canReadMemberships",
      "canManageMemberships",
      "canReadAudit",
      "canSwitchContext",
      "canReadStructure",
      "canManageStructure",
    ]) {
      expect(capabilitiesType).toContain(cap);
    }
    // Exatamente sete propriedades booleanas no tipo (Sprint 05 adiciona duas).
    expect((capabilitiesType.match(/:\s*boolean/g) ?? []).length).toBe(7);
  });

  it("HospitalCapabilitiesResult preserva somente os quatro estados", () => {
    const states = new Set(
      [...full.matchAll(/status:\s*["'`](\w+)["'`]/g)].map((m) => m[1]),
    );
    expect(states).toEqual(new Set(["active", "absent", "invalid", "error"]));
  });

  it("o schema da linha usa .strict() com os sete campos snake_case", () => {
    const schema = sliceBody(full, "capabilitiesRowSchema", "capabilitiesResponseSchema");
    for (const field of [
      "can_read_hospital",
      "can_read_memberships",
      "can_manage_memberships",
      "can_read_audit",
      "can_switch_context",
      "can_read_structure",
      "can_manage_structure",
    ]) {
      expect(schema).toContain(field);
    }
    expect((schema.match(/z\.boolean\(\)/g) ?? []).length).toBe(7);
    expect(schema).toMatch(/\.strict\(\)/);
  });

  it("a resposta exige array de tamanho exatamente 1", () => {
    expect(full).toMatch(/z\.array\([\s\S]*?\)\.length\(1\)/);
  });

  it("nao ha fallback true nem coalescencia permissiva", () => {
    expect(full).not.toMatch(/\?\?\s*true/);
    expect(full).not.toMatch(/\|\|\s*true/);
    // Nenhuma coalescencia no mapeamento das capacidades.
    expect(full).not.toMatch(/can[A-Za-z]+:\s*[^,\n]*\?\?/);
  });

  it("falha de parsing ou erro devolve somente { status: error }", () => {
    expect(full).toMatch(/safeParse/);
    expect(full).toMatch(/return\s*\{\s*status:\s*["'`]error["'`]\s*\}/);
  });

  it("o retorno active contem context e as cinco capacidades completas", () => {
    // A vírgula (object literal) distingue o RETURN do estado do type union.
    const activeReturn = sliceBody(full, 'status: "active",', "};");
    for (const pair of [
      /canReadHospital:\s*row\.can_read_hospital/,
      /canReadMemberships:\s*row\.can_read_memberships/,
      /canManageMemberships:\s*row\.can_manage_memberships/,
      /canReadAudit:\s*row\.can_read_audit/,
      /canSwitchContext:\s*row\.can_switch_context/,
    ]) {
      expect(activeReturn).toMatch(pair);
    }
    expect(activeReturn).toMatch(/context:\s*context\.context/);
  });
});

describe("Sprint 04A - migration SQL: invariantes", () => {
  const sql = readStrippedSql(MIGRATION);
  const returnsBlock = sliceBody(sql, "returns table (", "language sql");

  it("cria somente a funcao get_effective_hospital_capabilities", () => {
    expect(sql).toMatch(
      /create or replace function public\.get_effective_hospital_capabilities\(/,
    );
    expect((sql.match(/create\s+(or\s+replace\s+)?function/gi) ?? []).length).toBe(1);
  });

  it("e LANGUAGE sql, STABLE, SECURITY INVOKER e search_path vazio", () => {
    expect(sql).toMatch(/language sql/i);
    expect(sql).toMatch(/\bstable\b/i);
    expect(sql).toMatch(/security invoker/i);
    expect(sql).toMatch(/set search_path\s*=\s*''/i);
    expect(sql).not.toMatch(/security definer/i);
  });

  it("o retorno possui exatamente cinco colunas boolean e nenhum text/uuid/role", () => {
    expect((returnsBlock.match(/\bboolean\b/g) ?? []).length).toBe(5);
    expect(returnsBlock).not.toMatch(/\btext\b/);
    expect(returnsBlock).not.toMatch(/\buuid\b/);
    expect(returnsBlock).not.toMatch(/\brole\b/);
    expect(returnsBlock).not.toMatch(/\bscope\b/);
  });

  it("produz uma linha via agregacao e usa auth.uid()", () => {
    expect(sql).toMatch(/bool_or\(/);
    expect(sql).toMatch(/coalesce\(/i);
    expect(sql).toMatch(/auth\.uid\(\)/);
  });

  it("considera os tres escopos e filtra status ativo e revoked_at nulo", () => {
    expect(sql).toMatch(/r\.scope\s*=\s*'platform'/);
    expect(sql).toMatch(/r\.scope\s*=\s*'organization'/);
    expect(sql).toMatch(/r\.scope\s*=\s*'hospital'/);
    expect(sql).toMatch(/status\s*=\s*'active'/);
    expect(sql).toMatch(/revoked_at is null/i);
    expect(sql).toMatch(/h\.status\s*=\s*'active'/);
    expect(sql).toMatch(/h\.id\s*=\s*target_hospital_id/);
  });

  it("o mapeamento e ciente de scope", () => {
    expect(sql).toMatch(/scope in \('platform', 'organization'\)/);
    expect(sql).toMatch(/scope\s*=\s*'hospital'/);
  });

  it("nao concede por nome platform_admin nem marca tudo true", () => {
    expect(sql).not.toMatch(/platform_admin/);
    expect(sql).not.toMatch(/values\s*\(\s*true/i);
    expect(sql).not.toMatch(/\btrue\s+as\s+can_/i);
  });

  it("nao altera policies, RLS, grants de tabela, roles ou permissions", () => {
    expect(sql).not.toMatch(/create policy/i);
    expect(sql).not.toMatch(/alter policy/i);
    expect(sql).not.toMatch(/alter table/i);
    expect(sql).not.toMatch(/enable row level security/i);
    expect(sql).not.toMatch(/grant\s+(select|insert|update|delete)/i);
    expect(sql).not.toMatch(/insert into public\.roles/i);
    expect(sql).not.toMatch(/insert into public\.permissions/i);
    expect(sql).not.toMatch(/create\s+role/i);
  });

  it("revoga EXECUTE de public e anon e concede somente a authenticated", () => {
    expect(sql).toMatch(
      /revoke execute on function public\.get_effective_hospital_capabilities\(uuid\) from public/i,
    );
    expect(sql).toMatch(
      /revoke execute on function public\.get_effective_hospital_capabilities\(uuid\) from anon/i,
    );
    expect(sql).toMatch(
      /grant execute on function public\.get_effective_hospital_capabilities\(uuid\) to authenticated/i,
    );
  });

  it("nao introduz termos clinicos", () => {
    for (const term of CLINICAL_TERMS) {
      expect(sql).not.toMatch(term);
    }
  });
});

describe("Sprint 04A - tipos gerados", () => {
  const types = readFileSync(resolve(process.cwd(), TYPES), "utf8");

  it("a funcao esta presente com Args apenas target_hospital_id: string", () => {
    expect(types).toMatch(/get_effective_hospital_capabilities:\s*\{/);
    expect(types).toMatch(/Args:\s*\{\s*target_hospital_id:\s*string\s*\}/);
  });

  it("Returns e array com exatamente os sete booleanos snake_case e sem string", () => {
    const fnBlock = sliceBody(types, "get_effective_hospital_capabilities:", "}[]");
    const returnsBlock = fnBlock.slice(fnBlock.indexOf("Returns: {"));
    for (const field of [
      "can_read_hospital",
      "can_read_memberships",
      "can_manage_memberships",
      "can_read_audit",
      "can_switch_context",
      "can_read_structure",
      "can_manage_structure",
    ]) {
      expect(returnsBlock).toContain(field);
    }
    expect((returnsBlock.match(/:\s*boolean/g) ?? []).length).toBe(7);
    expect(returnsBlock).not.toMatch(/:\s*string/);
    expect(types).toMatch(/Returns:\s*\{[\s\S]*?\}\[\]/);
  });
});

describe("Sprint 04A - cookie institucional permanece minimo", () => {
  const cookie = readStrippedTs(COOKIE);
  // Abrange ActiveContextSelection (organizationId/hospitalId) + ActiveContextPayload (v).
  const payload = sliceBody(
    cookie,
    "export type ActiveContextSelection = {",
    "export type ContextCookieReadResult",
  );

  it("o cookie nao referencia capability, permission, role ou scope", () => {
    expect(cookie).not.toMatch(/capabilit/i);
    expect(cookie).not.toMatch(/permission/i);
    expect(cookie).not.toMatch(/\brole\b/i);
    expect(cookie).not.toMatch(/\bscope\b/i);
  });

  it("o payload continua limitado a organizationId, hospitalId e v", () => {
    expect(payload).toMatch(/organizationId/);
    expect(payload).toMatch(/hospitalId/);
    expect(payload).toMatch(/v:/);
  });
});
