import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export {};

// Sprint 04 (fechamento) - Revisao estatica de seguranca e arquitetura da
// gestao de papeis hospitalares: migration (refs opacas, hardening RPC-only,
// auditoria estendida, RPC de papeis e catalogo), Server Action e componente
// cliente. Os testes leem os arquivos como texto e removem comentarios antes
// das buscas. Nenhum conteudo integral, segredo ou valor de ambiente e
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

function countMatches(source: string, pattern: RegExp): number {
  return (source.match(pattern) ?? []).length;
}

const MIGRATION =
  "supabase/migrations/20260715010000_sprint_04_role_management.sql";
const RESOLVER = "src/lib/auth/hospital-team.ts";
const TEAM_ACTIONS = "src/app/(protected)/painel/admin/equipe/actions.ts";
const ROLE_CONTROLS =
  "src/app/(protected)/painel/admin/equipe/team-role-controls.tsx";

describe("Sprint 04 (fechamento) - migration de gestao de papeis", () => {
  const migration = stripSqlComments(readRaw(MIGRATION));

  it("referencia opaca do catalogo de papeis gerada no banco, unica e com formato", () => {
    expect(migration).toMatch(/alter table public\.roles\s+add column management_ref text not null/);
    expect(migration).toMatch(
      /default encode\(extensions\.gen_random_bytes\(16\), 'hex'\)/,
    );
    expect(migration).toMatch(/roles_management_ref_unique unique \(management_ref\)/);
    expect(migration).toMatch(/check \(management_ref ~ '\^\[0-9a-f\]\{32\}\$'\)/);
  });

  it("hardening RPC-only: revoga mutacao direta e remove policies, preservando SELECT", () => {
    expect(migration).toMatch(
      /revoke insert \(hospital_membership_id, role_id, status, granted_by\)\s+on table public\.hospital_membership_roles\s+from authenticated/,
    );
    expect(migration).toMatch(
      /revoke update \(status, revoked_at\)\s+on table public\.hospital_membership_roles\s+from authenticated/,
    );
    expect(migration).toMatch(
      /revoke insert, update, delete\s+on table public\.hospital_membership_roles\s+from authenticated/,
    );
    expect(migration).toMatch(
      /drop policy if exists hospital_membership_roles_insert_allowed/,
    );
    expect(migration).toMatch(
      /drop policy if exists hospital_membership_roles_update_allowed/,
    );
    // Nenhum grant novo de tabela e nenhuma revogacao de SELECT.
    expect(migration).not.toMatch(/grant (select|insert|update|delete)/i);
    expect(migration).not.toMatch(/revoke select/i);
    // Dominios fora do escopo permanecem intocados.
    expect(migration).not.toMatch(/organization_membership_roles/);
    expect(migration).not.toMatch(/platform_role_assignments/);
    expect(migration).not.toMatch(/insert into public\.(roles|permissions|role_permissions)/);
    expect(migration).not.toMatch(/\bpermissions\b/i);
  });

  it("auditoria estendida coerente: novos eventos, target_role_id e consistencia", () => {
    expect(migration).toMatch(/add column target_role_id bigint references public\.roles\(id\)/);
    expect(migration).toMatch(/'hospital_role_assigned'/);
    expect(migration).toMatch(/'hospital_role_revoked'/);
    expect(migration).toMatch(/administrative_audit_events_transition_consistency_check/);
    // Eventos de vinculo sem papel; eventos de papel exigem papel.
    expect(migration).toMatch(/and target_role_id is null/);
    expect(migration).toMatch(/and target_role_id is not null/);
    // Continua sem policy e sem grant direto para a auditoria.
    expect(migration).not.toMatch(/create policy/i);
    expect(migration).not.toMatch(/grant (select|insert|update|delete)/i);
  });

  it("RPC de papeis: DEFINER, VOLATILE, search_path vazio, lock e mesma transacao", () => {
    expect(migration).toMatch(
      /create or replace function public\.change_hospital_membership_role\(/,
    );
    expect(migration).toMatch(/language plpgsql\s*volatile\s*security definer\s*set search_path = ''/);
    expect(countMatches(migration, /for update of h;/g)).toBe(1);
    expect(countMatches(migration, /for update of hm;/g)).toBe(1);
    expect(countMatches(migration, /for update of hmr;/g)).toBe(1);
    const fnBody = migration.slice(
      migration.indexOf("change_hospital_membership_role"),
      migration.indexOf("get_hospital_assignable_roles"),
    );
    expect(fnBody).toMatch(/insert into public\.hospital_membership_roles/);
    expect(fnBody).toMatch(/update public\.hospital_membership_roles/);
    expect(fnBody).toMatch(/insert into public\.administrative_audit_events/);
    // Sem SQL dinamico, sem service_role, sem auth.users, sem DELETE fisico.
    expect(migration).not.toMatch(/execute format/i);
    expect(migration).not.toMatch(/service[_-]?role/i);
    expect(migration).not.toMatch(/auth\.users/);
    expect(migration).not.toMatch(/\bdelete from\b/i);
  });

  it("autorizacao explicita por manage, invariantes e resultados estruturados", () => {
    expect(migration).toMatch(/'hospital_memberships\.manage'/);
    expect(migration).not.toMatch(/current_user_is_platform_admin/);
    expect(migration).toMatch(/requested_action not in \('assign', 'revoke'\)/);
    expect(migration).toMatch(/self_admin_role_forbidden/);
    expect(migration).toMatch(/last_admin_forbidden/);
    expect(migration).toMatch(/invalid_transition/);
    expect(migration).toMatch(/not_allowed/);
    // Papel restrito ao escopo hospital e resolvido por referencia opaca.
    expect(migration).toMatch(/r\.management_ref = target_role_ref/);
    expect(migration).toMatch(/r\.scope = 'hospital'/);
    // Reatribuicao reativa a linha existente (sem duplicata).
    expect(migration).toMatch(/set status = 'active',\s*revoked_at = null/);
    // EXECUTE restrito nas duas funcoes novas.
    expect(migration).toMatch(
      /grant execute on function public\.change_hospital_membership_role\(uuid, text, text, text\) to authenticated/,
    );
    expect(migration).toMatch(
      /revoke execute on function public\.change_hospital_membership_role\(uuid, text, text, text\) from anon/,
    );
    expect(migration).toMatch(
      /grant execute on function public\.get_hospital_assignable_roles\(uuid\) to authenticated/,
    );
    expect(migration).toMatch(
      /revoke execute on function public\.get_hospital_assignable_roles\(uuid\) from anon/,
    );
  });

  it("get_hospital_team expoe papeis administraveis somente a quem gerencia, sem codigo cru", () => {
    expect(migration).toMatch(/assigned_roles jsonb/);
    expect(migration).toMatch(/case when cm\.can_manage then/);
    // O JSON usa display_name e management_ref; role.code so participa da
    // logica interna de protecao do administrador, nunca da projecao.
    expect(migration).toMatch(/'label', r\.display_name/);
    expect(migration).toMatch(/'roleRef', r\.management_ref/);
    expect(migration).not.toMatch(/'code'/);
    expect(migration).not.toMatch(/\bemail\b/i);
  });
});

describe("Sprint 04 (fechamento) - Server Action de papeis", () => {
  const action = stripComments(readRaw(TEAM_ACTIONS));

  it("recebe somente membershipRef, roleRef e requestedAction, validados por Zod", () => {
    expect(action).toMatch(/membershipRef:\s*z\.string\(\)\.regex\(\/\^\[0-9a-f\]\{32\}\$\/\)/);
    expect(action).toMatch(/roleRef:\s*z\.string\(\)\.regex\(\/\^\[0-9a-f\]\{32\}\$\/\)/);
    expect(action).toMatch(/requestedAction:\s*z\.enum\(\["assign", "revoke"\]\)/);
    expect(action).not.toMatch(/formData\.get\("(hospitalId|organizationId|role|permission|actorId|email)"\)/);
  });

  it("hospital do contexto, capacidade manage e RPC unica de papeis", () => {
    expect(action).toMatch(/change_hospital_membership_role/);
    expect(action).toMatch(/target_membership_ref:\s*parsedInput\.data\.membershipRef/);
    expect(action).toMatch(/target_role_ref:\s*parsedInput\.data\.roleRef/);
    expect(action).toMatch(/requested_action:\s*parsedInput\.data\.requestedAction/);
    // Enum fechado de outcomes, incluindo os dois bloqueios de administrador.
    expect(action).toMatch(/self_admin_role_forbidden/);
    expect(action).toMatch(/case "last_admin_forbidden":/);
  });

  it("nao acessa infraestrutura proibida", () => {
    expect(action).not.toMatch(/\.from\(/);
    expect(action).not.toMatch(/service[_-]?role/i);
    expect(action).not.toMatch(/auth\.users/);
    expect(action).not.toMatch(/\bredirect\b/);
    expect(action).not.toMatch(/role\.code|permission\.code/);
  });
});

describe("Sprint 04 (fechamento) - componente de controles de papeis", () => {
  const controls = stripComments(readRaw(ROLE_CONTROLS));

  it("envia somente refs opacas e a acao, com confirmacao explicita", () => {
    expect(controls).toMatch(/name="membershipRef"/);
    expect(controls).toMatch(/name="roleRef"/);
    expect(controls).toMatch(/name="requestedAction"/);
    expect(countMatches(controls, /<input/g)).toBe(3);
    expect(controls).toMatch(/type="hidden"/);
    expect(controls).not.toMatch(/hospitalId|organizationId/);
    expect(controls).toMatch(/Confirmar atribuição/);
    expect(controls).toMatch(/Confirmar revogação/);
    expect(controls).toMatch(/Cancelar/);
    expect(controls).not.toMatch(/window\.confirm/);
  });

  it("sem acoes proibidas e sem dados internos", () => {
    expect(controls).not.toMatch(/excluir|remover|convidar|adicionar|criar conta|senha/i);
    expect(controls).not.toMatch(/\bemail\b/i);
    expect(controls).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    );
    // As referencias nunca sao renderizadas como texto: apenas em value de
    // inputs ocultos e values de option.
    expect(controls).not.toMatch(/\{membershipRef\}(?![\s\S]{0,10}\/>)/);
  });
});

describe("Sprint 04 (fechamento) - resolver com catalogo atribuivel", () => {
  const resolver = stripComments(readRaw(RESOLVER));

  it("catalogo somente sob canManageMemberships e validado por Zod estrito", () => {
    expect(resolver).toMatch(/if \(result\.capabilities\.canManageMemberships\)/);
    expect(resolver).toMatch(/get_hospital_assignable_roles/);
    expect(resolver).toMatch(/role_label:\s*z\.string\(\)\.min\(1\)/);
    expect(resolver).toMatch(/role_ref:\s*z\.string\(\)\.regex\(OPAQUE_REF_PATTERN\)/);
    expect(resolver).toMatch(/assigned_roles:\s*z\.array\(assignedRoleSchema\)\.nullable\(\)/);
    // Fail-closed no catalogo: erro ou resposta malformada viram error.
    expect(resolver).toMatch(/if \(catalog\.error\)/);
  });
});
