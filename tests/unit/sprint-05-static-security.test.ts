import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export {};

// Sprint 05 - Revisao estatica de seguranca e arquitetura
//
// Protege o cadastro institucional hospitalar: a migration das quatro tabelas
// de estrutura (RLS fail-closed, grants minimos, sem DELETE, sem SECURITY
// DEFINER novo), o resolver server-side, as Server Actions, a pagina e os
// componentes cliente. Os testes leem os arquivos como texto, removem
// comentarios antes das buscas e restringem cada verificacao ao corpo
// relevante. Nenhum conteudo integral de arquivo, segredo ou valor de ambiente
// e impresso.

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function stripSqlComments(source: string): string {
  return source.replace(/--.*$/gm, "");
}

function readRaw(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function readStripped(relativePath: string): string {
  return stripComments(readRaw(relativePath));
}

function readStrippedSql(relativePath: string): string {
  return stripSqlComments(readRaw(relativePath));
}

function countMatches(source: string, pattern: RegExp): number {
  return (source.match(pattern) ?? []).length;
}

const MIGRATION =
  "supabase/migrations/20260715020000_sprint_05_hospital_structure.sql";
const RESOLVER = "src/lib/auth/hospital-structure.ts";
const CAPABILITIES = "src/lib/auth/capabilities.ts";
const ACTIONS = "src/app/(protected)/painel/admin/estrutura/actions.ts";
const PAGE = "src/app/(protected)/painel/admin/estrutura/page.tsx";
const FORMS =
  "src/app/(protected)/painel/admin/estrutura/structure-create-forms.tsx";
const CONTROLS =
  "src/app/(protected)/painel/admin/estrutura/structure-status-controls.tsx";
const PANEL = "src/app/(protected)/painel/page.tsx";

const STRUCTURE_TABLES = [
  "hospital_units",
  "hospital_sectors",
  "hospital_beds",
  "hospital_resources",
];

describe("Sprint 05 - migration SQL: superficie e privilegios", () => {
  const sql = readStrippedSql(MIGRATION);

  it("nao usa service_role, auth.users, SQL dinamico nem db reset", () => {
    expect(sql).not.toMatch(/service_role/i);
    expect(sql).not.toMatch(/auth\.users/i);
    expect(sql).not.toMatch(/\bexecute\s+format\b/i);
    expect(sql).not.toMatch(/drop\s+table/i);
    expect(sql).not.toMatch(/truncate/i);
  });

  it("nenhuma funcao nova e SECURITY DEFINER; a funcao publica e SECURITY INVOKER", () => {
    expect(sql).not.toMatch(/security definer/i);
    expect(sql).toMatch(/security invoker/i);
    // Toda funcao criada fixa search_path vazio.
    expect(countMatches(sql, /set search_path\s*=\s*''/gi)).toBe(
      countMatches(sql, /create or replace function/gi),
    );
  });

  it("habilita RLS e zera privilegios base nas quatro tabelas", () => {
    for (const table of STRUCTURE_TABLES) {
      expect(sql).toMatch(
        new RegExp(
          `alter table public\\.${table} enable row level security`,
          "i",
        ),
      );
      expect(sql).toMatch(
        new RegExp(
          `revoke all on table public\\.${table} from public, anon, authenticated`,
          "i",
        ),
      );
    }
  });

  it("nao concede DELETE nem policy de DELETE (desativacao logica apenas)", () => {
    expect(sql).not.toMatch(/grant[^;]*delete/i);
    expect(sql).not.toMatch(/for delete/i);
  });

  it("nenhuma policy para anon e nenhuma policy permissiva por conveniencia", () => {
    expect(sql).not.toMatch(/to anon/i);
    expect(sql).not.toMatch(/using\s*\(\s*true\s*\)/i);
    expect(sql).not.toMatch(/with check\s*\(\s*true\s*\)/i);
  });

  it("UPDATE concedido somente para a coluna status", () => {
    const updateGrants = sql.match(/grant update[^;]+;/gi) ?? [];
    expect(updateGrants.length).toBe(4);
    for (const grant of updateGrants) {
      expect(grant).toMatch(/grant update \(status\)/i);
    }
  });

  it("INSERT nao concede status, management_ref, created_by ou ids proprios", () => {
    const insertGrants = sql.match(/grant insert[^;]+;/gi) ?? [];
    expect(insertGrants.length).toBe(4);
    for (const grant of insertGrants) {
      expect(grant).not.toMatch(/management_ref/i);
      expect(grant).not.toMatch(/created_by/i);
      expect(grant).not.toMatch(/\bstatus\b/i);
    }
  });

  it("toda tabela tem FK composta para hospitals(id, organization_id)", () => {
    for (const table of STRUCTURE_TABLES) {
      expect(sql).toMatch(
        new RegExp(
          `${table}_hospital_organization_fk[\\s\\S]{0,200}references public\\.hospitals\\(id, organization_id\\)`,
          "i",
        ),
      );
    }
  });

  it("referencias opacas de 32 hex com unique e check em todas as tabelas", () => {
    for (const table of STRUCTURE_TABLES) {
      expect(sql).toMatch(
        new RegExp(`${table}_management_ref_unique unique \\(management_ref\\)`, "i"),
      );
      expect(sql).toMatch(
        new RegExp(
          `${table}_management_ref_format check \\(management_ref ~ '\\^\\[0-9a-f\\]\\{32\\}\\$'\\)`,
          "i",
        ),
      );
    }
  });

  it("policies fail-closed usam somente as permissoes hospital_structure.*", () => {
    const policies = sql.match(/create policy[\s\S]*?;/gi) ?? [];
    expect(policies.length).toBe(12);
    for (const policy of policies) {
      expect(policy).toMatch(/hospital_structure\.(read|manage)/);
      expect(policy).toMatch(/app_private\.current_user_has_/);
    }
  });

  it("nao altera tabelas, policies ou grants das Sprints 03/04", () => {
    expect(sql).not.toMatch(/alter table public\.hospital_memberships\b/i);
    expect(sql).not.toMatch(/alter table public\.organization_memberships/i);
    expect(sql).not.toMatch(/alter table public\.profiles/i);
    expect(sql).not.toMatch(/drop policy/i);
    expect(sql).not.toMatch(/administrative_audit_events/i);
    expect(sql).not.toMatch(/insert into public\.roles\b/i);
  });

  it("semeia exatamente as quatro permissoes hospital_structure e seis mapeamentos", () => {
    const permissionSeeds = countMatches(
      sql,
      /\('(organization|hospital)', 'hospital_structure\.(read|manage)'/g,
    );
    expect(permissionSeeds).toBe(4);
    const roleMappings = countMatches(
      sql,
      /\('(organization|hospital)', '(organization_admin|hospital_admin|auditor)', 'hospital_structure\.(read|manage)'\)/g,
    );
    expect(roleMappings).toBe(6);
    // member nunca recebe permissao de estrutura.
    expect(sql).not.toMatch(/'member', 'hospital_structure/);
  });

  it("a funcao de capacidades devolve os sete booleanos e nada mais", () => {
    const returnsBlock = sql.slice(
      sql.indexOf("returns table ("),
      sql.indexOf("language sql"),
    );
    expect(countMatches(returnsBlock, /\bboolean\b/g)).toBe(7);
    expect(returnsBlock).toMatch(/can_read_structure/);
    expect(returnsBlock).toMatch(/can_manage_structure/);
    expect(returnsBlock).not.toMatch(/\btext\b/);
    expect(returnsBlock).not.toMatch(/\buuid\b/);
  });
});

describe("Sprint 05 - resolver hospital-structure.ts", () => {
  const resolver = readStripped(RESOLVER);

  it("sem service_role, cookies, redirect, notFound ou RPC", () => {
    expect(resolver).not.toMatch(/service_role/i);
    expect(resolver).not.toMatch(/auth\.users/i);
    expect(resolver).not.toMatch(/cookies\(/);
    expect(resolver).not.toMatch(/redirect\(/);
    expect(resolver).not.toMatch(/notFound\(/);
    expect(resolver).not.toMatch(/\.rpc\(/);
  });

  it("o resolver nao aceita hospitalId/organizationId por argumento", () => {
    expect(resolver).toMatch(
      /export async function resolveActiveHospitalStructure\(\): Promise</,
    );
  });

  it("o hospital vem exclusivamente das capacidades resolvidas", () => {
    expect(resolver).toMatch(/resolveActiveHospitalCapabilities\(\)/);
    expect(resolver).toMatch(/result\.context\.hospitalId/);
    // Toda consulta filtra por hospital_id.
    expect(countMatches(resolver, /\.eq\("hospital_id", hospitalId\)/g)).toBe(4);
  });

  it("gate de leitura fail-closed antes de qualquer consulta", () => {
    const deniedIndex = resolver.indexOf("canReadStructure");
    const firstQueryIndex = resolver.indexOf(".from(");
    expect(deniedIndex).toBeGreaterThan(-1);
    expect(firstQueryIndex).toBeGreaterThan(deniedIndex);
  });

  it("nenhum UUID entra no contrato de saida (tipos sem campo id)", () => {
    const typesBlock = resolver.slice(
      resolver.indexOf("export type HospitalStructureBed"),
      resolver.indexOf("export type HospitalStructureResult"),
    );
    expect(typesBlock).not.toMatch(/\bid\b\s*:/);
    expect(typesBlock).not.toMatch(/unitId|sectorId|hospitalId|organizationId/);
  });

  it("referencias opacas expostas somente para quem gerencia", () => {
    expect(resolver).toMatch(/canManage \? ref : null/);
    expect(resolver).toMatch(/\.strict\(\)/);
  });
});

describe("Sprint 05 - Server Actions", () => {
  const actions = readStripped(ACTIONS);

  it("e um modulo use server sem service_role nem auth.users", () => {
    expect(actions).toMatch(/^"use server";/);
    expect(actions).not.toMatch(/service_role/i);
    expect(actions).not.toMatch(/auth\.users/i);
  });

  it("nunca le hospitalId/organizationId/ids do FormData", () => {
    expect(actions).not.toMatch(/formData\.get\("hospitalId"\)/);
    expect(actions).not.toMatch(/formData\.get\("organizationId"\)/);
    expect(actions).not.toMatch(/formData\.get\("id"\)/);
    expect(actions).not.toMatch(/formData\.get\("unitId"\)/);
    expect(actions).not.toMatch(/formData\.get\("sectorId"\)/);
    // Somente campos de cadastro e referencias opacas.
    const readFields = [
      ...actions.matchAll(/getStringField\(formData, "(\w+)"\)/g),
    ].map((m) => m[1]);
    expect(new Set(readFields)).toEqual(
      new Set([
        "code",
        "displayName",
        "description",
        "unitRef",
        "sectorRef",
        "kind",
        "managementRef",
        "requestedStatus",
      ]),
    );
  });

  it("o hospital e a organizacao vem exclusivamente do contexto ativo", () => {
    expect(actions).toMatch(/organizationId: capabilities\.context\.organizationId/);
    expect(actions).toMatch(/hospitalId: capabilities\.context\.hospitalId/);
    expect(countMatches(actions, /organization_id: gate\.organizationId/g)).toBe(4);
    expect(countMatches(actions, /hospital_id: gate\.hospitalId/g)).toBe(4);
  });

  it("todo insert/update exige o gate canManageStructure antes", () => {
    expect(actions).toMatch(/canManageStructure/);
    expect(countMatches(actions, /requireManageStructure\(\)/g)).toBeGreaterThanOrEqual(
      6,
    );
  });

  it("referencias opacas validadas por regex de 32 hex e enum fechado de tipos", () => {
    expect(actions).toMatch(/\^\[0-9a-f\]\{32\}\$/);
    expect(actions).toMatch(/z\.enum\(\["unit", "sector", "bed", "resource"\]\)/);
    expect(actions).toMatch(/z\.enum\(\["active", "inactive"\]\)/);
  });

  it("sem delete fisico e sem redirect", () => {
    expect(actions).not.toMatch(/\.delete\(/);
    expect(actions).not.toMatch(/redirect\(/);
  });

  it("mutacoes de pai resolvem a referencia restrita ao hospital ativo", () => {
    expect(countMatches(actions, /\.eq\("hospital_id", gate\.hospitalId\)/g)).toBeGreaterThanOrEqual(3);
    expect(countMatches(actions, /\.eq\("status", "active"\)/g)).toBe(2);
  });

  it("revalida somente a rota da estrutura e somente em sucesso", () => {
    const revalidates = actions.match(/revalidatePath\([^)]*\)/g) ?? [];
    expect(revalidates.length).toBeGreaterThanOrEqual(5);
    for (const call of revalidates) {
      expect(call).toBe('revalidatePath("/painel/admin/estrutura")');
    }
  });

  it("mensagens nunca expoem codigo interno, UUID ou permissao", () => {
    const messages = actions.match(/"[^"]*(?:ç|ã|õ|é|í)[^"]*"/g) ?? [];
    for (const message of messages) {
      expect(message).not.toMatch(/hospital_structure/);
      expect(message).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/i);
      expect(message).not.toMatch(/RLS|policy|grant/i);
    }
  });
});

describe("Sprint 05 - pagina /painel/admin/estrutura", () => {
  const page = readStripped(PAGE);

  it("Server Component force-dynamic sem Supabase direto", () => {
    expect(page).toMatch(/export const dynamic = "force-dynamic";/);
    expect(page).not.toMatch(/createClient/);
    expect(page).not.toMatch(/\.rpc\(/);
    expect(page).not.toMatch(/\.from\(/);
    expect(page).not.toMatch(/cookies\(/);
    expect(page).not.toMatch(/redirect\(/);
    expect(page).not.toMatch(/notFound\(/);
  });

  it("ordem obrigatoria: requirePortalAccess antes do resolver", () => {
    const gateIndex = page.indexOf("await requirePortalAccess()");
    const resolverIndex = page.indexOf(
      "await resolveActiveHospitalStructure()",
    );
    expect(gateIndex).toBeGreaterThan(-1);
    expect(resolverIndex).toBeGreaterThan(gateIndex);
    expect(countMatches(page, /resolveActiveHospitalStructure\(\)/g)).toBe(1);
  });

  it("renderiza os cinco estados sem vazar nomes internos", () => {
    // O estado error e o fallback final; os demais sao comparados por igualdade.
    for (const status of ["allowed", "denied", "absent", "invalid"]) {
      expect(page).toMatch(new RegExp(`"${status}"`));
    }
    expect(page).toMatch(/admin-structure-error-title/);
    expect(page).not.toMatch(/canReadStructure|canManageStructure/);
    expect(page).not.toMatch(/hospital_structure/);
    expect(page).not.toMatch(/\bscope\b/i);
  });

  it("formularios e controles somente sob canManage indicado pelo servidor", () => {
    expect(page).toMatch(/\{canManage \? \(/);
    expect(countMatches(page, /canManage && \w+\.managementRef !== null/g)).toBe(4);
  });

  it("estados de vazio, negacao e erro com mensagens amigaveis e logout", () => {
    expect(page).toMatch(/Nenhuma unidade cadastrada/);
    expect(page).toMatch(/Nenhum recurso institucional cadastrado/);
    expect(page).toMatch(/Sem permissão para visualizar a estrutura/);
    expect(page).toMatch(/Não foi possível carregar a estrutura/);
    expect(countMatches(page, /action=\{logoutAction\}/g)).toBe(5);
  });
});

describe("Sprint 05 - componentes cliente", () => {
  const forms = readStripped(FORMS);
  const controls = readStripped(CONTROLS);

  it("formularios enviam somente campos de cadastro e referencias opacas", () => {
    const names = [...forms.matchAll(/name="(\w+)"/g)].map((m) => m[1]);
    expect(new Set(names)).toEqual(
      new Set(["code", "displayName", "description", "unitRef", "sectorRef"]),
    );
    expect(forms).not.toMatch(/hospitalId|organizationId/);
  });

  it("controle de status envia somente kind, managementRef e requestedStatus", () => {
    const names = [...controls.matchAll(/name="(\w+)"/g)].map((m) => m[1]);
    expect(new Set(names)).toEqual(
      new Set(["kind", "managementRef", "requestedStatus"]),
    );
    expect(controls).not.toMatch(/hospitalId|organizationId/);
  });

  it("controle exige confirmacao explicita antes de submeter", () => {
    expect(controls).toMatch(/isConfirming/);
    expect(controls).toMatch(/Cancelar/);
    expect(controls).toMatch(/Confirmar desativação/);
    expect(controls).toMatch(/Confirmar reativação/);
  });

  it("componentes cliente sem Supabase, fetch ou storage", () => {
    for (const source of [forms, controls]) {
      expect(source).toMatch(/^"use client";/);
      expect(source).not.toMatch(/createClient|supabase/i);
      expect(source).not.toMatch(/fetch\(/);
      expect(source).not.toMatch(/localStorage|sessionStorage/);
    }
  });
});

describe("Sprint 05 - painel", () => {
  const panel = readStripped(PANEL);

  it("o link da estrutura e condicionado somente a canReadStructure", () => {
    expect(panel).toMatch(
      /capabilities\.canReadStructure \?[\s\S]{0,200}?\/painel\/admin\/estrutura[\s\S]{0,200}?Estrutura do hospital/,
    );
    expect(panel).not.toMatch(/capabilities\.canManageStructure/);
  });
});

describe("Sprint 05 - contrato de capacidades", () => {
  const capabilities = readStripped(CAPABILITIES);

  it("os dois novos booleanos seguem o mesmo fail-closed dos cinco anteriores", () => {
    expect(capabilities).toMatch(/can_read_structure: z\.boolean\(\)/);
    expect(capabilities).toMatch(/can_manage_structure: z\.boolean\(\)/);
    expect(capabilities).toMatch(/canReadStructure: row\.can_read_structure/);
    expect(capabilities).toMatch(
      /canManageStructure: row\.can_manage_structure/,
    );
  });
});
