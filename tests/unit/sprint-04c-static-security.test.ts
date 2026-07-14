import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export {};

// Sprint 04C.1 - Revisao estatica de seguranca e arquitetura
//
// Protege a listagem somente leitura da equipe do hospital ativo: a migration
// da RPC get_hospital_team (SECURITY DEFINER com validacao interna explicita),
// o resolver server-side, o painel e a pagina da equipe. Os testes leem os
// arquivos como texto, removem comentarios antes das buscas e restringem cada
// verificacao ao corpo relevante, evitando falsos positivos. O formulario de
// logout e explicitamente permitido; nenhum outro action de formulario e
// aceito. Nenhum conteudo integral de arquivo, segredo ou valor de ambiente e
// impresso.

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

function countMatches(source: string, pattern: RegExp): number {
  return (source.match(pattern) ?? []).length;
}

const MIGRATION =
  "supabase/migrations/20260714010000_sprint_04c_hospital_team_listing.sql";
const RESOLVER = "src/lib/auth/hospital-team.ts";
const PANEL = "src/app/(protected)/painel/page.tsx";
const ADMIN = "src/app/(protected)/painel/admin/equipe/page.tsx";

describe("Sprint 04C - migration da listagem da equipe", () => {
  const migration = stripSqlComments(readRaw(MIGRATION));

  it("cria uma unica RPC publica, SECURITY DEFINER, STABLE e com search_path vazio", () => {
    expect(countMatches(migration, /create or replace function/g)).toBe(1);
    expect(migration).toMatch(/create or replace function public\.get_hospital_team\(/);
    expect(migration).toMatch(/security definer/);
    expect(migration).toMatch(/\bstable\b/);
    expect(migration).toMatch(/set search_path = ''/);
  });

  it("nao altera RLS, policies, grants de tabela, roles ou permissions", () => {
    expect(migration).not.toMatch(/create policy|alter policy|drop policy/i);
    expect(migration).not.toMatch(/enable row level security|disable row level security/i);
    expect(migration).not.toMatch(/grant (select|insert|update|delete)/i);
    expect(migration).not.toMatch(/insert into public\.(roles|permissions|role_permissions)/);
    expect(migration).not.toMatch(/alter table/i);
  });

  it("nao le auth.users nem devolve e-mail ou UUID", () => {
    expect(migration).not.toMatch(/auth\.users/);
    expect(migration).not.toMatch(/\bemail\b/i);
    // O retorno e minimo: tres colunas, nenhuma uuid.
    expect(migration).toMatch(
      /returns table \(\s*display_name text,\s*membership_status text,\s*role_labels text\[\]\s*\)/,
    );
    expect(migration).not.toMatch(/returns table[\s\S]{0,200}uuid/);
  });

  it("EXECUTE revogado de PUBLIC e anon, concedido somente a authenticated", () => {
    expect(migration).toMatch(
      /revoke execute on function public\.get_hospital_team\(uuid\) from public/,
    );
    expect(migration).toMatch(
      /revoke execute on function public\.get_hospital_team\(uuid\) from anon/,
    );
    expect(migration).toMatch(
      /grant execute on function public\.get_hospital_team\(uuid\) to authenticated/,
    );
    expect(countMatches(migration, /grant execute/g)).toBe(1);
  });

  it("autorizacao explicita por hospital_memberships.read nos dois escopos, sem bypass", () => {
    expect(migration).toMatch(/app_private\.current_profile_is_active\(\)/);
    expect(migration).toMatch(
      /app_private\.current_user_has_hospital_permission\(\s*h\.id,\s*'hospital_memberships\.read'\s*\)/,
    );
    expect(migration).toMatch(
      /app_private\.current_user_has_organization_permission\(\s*h\.organization_id,\s*'hospital_memberships\.read'\s*\)/,
    );
    // Nenhum bypass hardcoded por nome de papel ou platform_admin.
    expect(migration).not.toMatch(/current_user_is_platform_admin/);
    expect(migration).not.toMatch(/platform_admin/);
    expect(migration).not.toMatch(/r\.code\s*=\s*'hospital_admin'/);
  });

  it("isola pelo hospital alvo e usa roles.display_name, nunca role.code no retorno", () => {
    expect(migration).toMatch(/h\.id = target_hospital_id/);
    expect(migration).toMatch(/hm\.hospital_id = t\.hospital_id/);
    expect(migration).toMatch(/array_agg\(distinct r\.display_name order by r\.display_name\)/);
    // r.code nunca participa da projecao de rotulos.
    expect(migration).not.toMatch(/array_agg\([^)]*r\.code/);
    // Organizacao proprietaria ativa e status validos.
    expect(migration).toMatch(/o\.status = 'active'/);
    expect(migration).toMatch(/h\.status = 'active'/);
    expect(migration).toMatch(/hm\.status in \('active', 'suspended', 'pending'\)/);
    expect(migration).toMatch(/om\.status = 'active'/);
    expect(migration).toMatch(/p\.status = 'active'/);
    // Sem SQL dinamico e sem service_role.
    expect(migration).not.toMatch(/\bexecute\s+format\b/i);
    expect(migration).not.toMatch(/service[_-]?role/i);
  });
});

describe("Sprint 04C - resolver server-side da equipe", () => {
  const resolver = readStripped(RESOLVER);

  it("nao aceita argumentos externos e resolve capacidades uma unica vez", () => {
    expect(resolver).toMatch(
      /export async function resolveActiveHospitalTeam\(\)/,
    );
    expect(
      countMatches(resolver, /resolveActiveHospitalCapabilities\(\)/g),
    ).toBe(1);
    expect(resolver).not.toMatch(/function resolveActiveHospitalTeam\([^)]+\)/);
  });

  it("so chama a RPC quando canReadMemberships e verdadeiro, com o hospitalId do contexto", () => {
    expect(resolver).toMatch(/!result\.capabilities\.canReadMemberships/);
    expect(resolver).toMatch(
      /\{\s*status:\s*"denied",\s*context:\s*result\.context\s*\}/,
    );
    expect(countMatches(resolver, /\.rpc\(/g)).toBe(1);
    expect(resolver).toMatch(
      /\.rpc\("get_hospital_team",\s*\{\s*target_hospital_id:\s*result\.context\.hospitalId,?\s*\}\)/,
    );
    expect(resolver).not.toMatch(/organizationId/);
  });

  it("nao acessa infraestrutura proibida", () => {
    expect(resolver).not.toMatch(/\.from\(/);
    expect(resolver).not.toMatch(/cookie/i);
    expect(resolver).not.toMatch(/\bredirect\b/);
    expect(resolver).not.toMatch(/notFound/);
    expect(resolver).not.toMatch(/service[_-]?role/i);
    expect(resolver).not.toMatch(/auth\.users/);
    expect(resolver).not.toMatch(/\bany\b/);
    expect(resolver).not.toMatch(/@ts-ignore|@ts-expect-error/);
  });

  it("valida com Zod estrito e contrato minimo, sem e-mail nem UUID", () => {
    expect(resolver).toMatch(/\.strict\(\)/);
    expect(resolver).toMatch(/z\.enum\(\["active", "suspended", "pending"\]\)/);
    expect(resolver).toMatch(/display_name:\s*z\.string\(\)\.min\(1\)/);
    expect(resolver).toMatch(/role_labels:\s*z\.array\(z\.string\(\)\.min\(1\)\)/);
    expect(resolver).not.toMatch(/email/i);
    expect(resolver).not.toMatch(/profileId|userId|user_id/);
    // O contrato de membro expoe apenas tres campos.
    expect(resolver).toMatch(
      /displayName:\s*string;\s*membershipStatus:\s*HospitalTeamMemberStatus;\s*roleLabels:\s*string\[\];/,
    );
  });
});

describe("Sprint 04C - painel", () => {
  const panel = readStripped(PANEL);

  it("o link da equipe depende de canReadMemberships, nao de canManageMemberships", () => {
    expect(panel).toMatch(/capabilities\.canReadMemberships/);
    expect(panel).not.toMatch(/canManageMemberships/);
    expect(panel).toMatch(/Ver equipe/);
    expect(panel).not.toMatch(/Gerenciar equipe/);
  });

  it("Trocar hospital permanece incondicional no estado active", () => {
    expect(panel).toMatch(/Trocar hospital/);
    expect(panel).not.toMatch(/canSwitchContext/);
  });
});

describe("Sprint 04C - pagina da equipe", () => {
  const admin = readStripped(ADMIN);

  it("usa resolveActiveHospitalTeam e nao consulta capacidades, gate ou RPC diretamente", () => {
    expect(countMatches(admin, /resolveActiveHospitalTeam\(\)/g)).toBe(1);
    expect(admin).not.toMatch(/evaluateHospitalCapability/);
    expect(admin).not.toMatch(/resolveActiveHospitalCapabilities/);
    expect(admin).not.toMatch(/createClient|\.rpc\(|\.from\(/);
    expect(admin).not.toMatch(/@\/lib\/supabase/);
  });

  it("sem props, params, searchParams ou IDs externos", () => {
    expect(admin).toMatch(/export default async function AdminTeamPage\(\)/);
    expect(admin).not.toMatch(/searchParams|\bparams\b|\bprops\b/);
    expect(admin).not.toMatch(/hospitalId\b|organizationId/);
  });

  it("traduz o status interno e nunca expoe e-mail, UUID, role code ou capacidade", () => {
    expect(admin).toMatch(/active:\s*"Ativo"/);
    expect(admin).toMatch(/suspended:\s*"Suspenso"/);
    expect(admin).toMatch(/pending:\s*"Pendente"/);
    expect(admin).not.toMatch(/email/i);
    expect(admin).not.toMatch(/canReadMemberships|canManageMemberships/);
    expect(admin).not.toMatch(/hospital_admin|hospital_memberships/);
    expect(admin).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    );
  });

  it("sem CRUD: unico form e o de logout, sem controles de mutacao", () => {
    const formActions = countMatches(admin, /action=\{/g);
    const logoutActions = countMatches(admin, /action=\{logoutAction\}/g);
    expect(formActions).toBeGreaterThan(0);
    expect(formActions).toBe(logoutActions);
    expect(admin).not.toMatch(/["'`]use server["'`]/);
    expect(admin).not.toMatch(/<input|<select|<textarea/);
    expect(admin).not.toMatch(/adicionar|convidar|editar|reativar|excluir|remover|salvar/i);
    expect(admin).not.toMatch(/\bsuspender\b/i);
  });

  it("estados completos: allowed com lista e vazio, denied, absent, invalid e error", () => {
    expect(admin).toMatch(/team\.status === "allowed"/);
    expect(admin).toMatch(/team\.status === "denied"/);
    expect(admin).toMatch(/team\.status === "absent"/);
    expect(admin).toMatch(/team\.status === "invalid"/);
    expect(admin).toMatch(/Equipe do hospital/);
    expect(admin).toMatch(/Nenhum integrante encontrado/);
    expect(admin).toMatch(/Sem permissão para visualizar a equipe/);
    expect(admin).toMatch(/Não foi possível carregar a equipe/);
    expect(admin).toMatch(/action=\{logoutAction\}/);
  });
});
