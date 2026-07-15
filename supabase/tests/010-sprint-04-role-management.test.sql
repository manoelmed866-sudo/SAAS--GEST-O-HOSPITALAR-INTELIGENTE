-- Sprint 04 (fechamento) - Gestao de papeis hospitalares por RPC auditada
--
-- Responsabilidade:
-- Comprovar a referencia opaca do catalogo de papeis, o hardening RPC-only de
-- hospital_membership_roles (sem INSERT/UPDATE/DELETE diretos e sem policies
-- de mutacao), a extensao coerente da auditoria administrativa (novos eventos
-- e target_role_id com constraints cruzadas), a RPC
-- change_hospital_membership_role (SECURITY DEFINER, VOLATILE, lock, sem
-- bypass), as regras de assign/revoke/reatribuicao e as protecoes de
-- auto-revogacao e ultimo administrador, alem do catalogo atribuivel e dos
-- papeis administraveis em get_hospital_team.
--
-- Estrategia anti-contaminacao:
-- Entidades proprias com UUIDs deterministicos (faixa ...920+); refs de
-- vinculo explicitas; refs de papel capturadas via set_config (sao geradas
-- pelo default do banco). Transacional com rollback: nada persiste.

begin;

select plan(67);

-- Identidades ficticias -------------------------------------------------------
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000921', 'authenticated', 'authenticated', 'member-04d@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000922', 'authenticated', 'authenticated', 'admin1-04d@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000923', 'authenticated', 'authenticated', 'auditor-04d@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000924', 'authenticated', 'authenticated', 'org-admin-04d@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000925', 'authenticated', 'authenticated', 'platform-04d@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000926', 'authenticated', 'authenticated', 'target-04d@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000927', 'authenticated', 'authenticated', 'retarget-04d@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000928', 'authenticated', 'authenticated', 'target-a2-04d@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000929', 'authenticated', 'authenticated', 'admin2-04d@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000930', 'authenticated', 'authenticated', 'target-b1-04d@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000931', 'authenticated', 'authenticated', 'suspenso-04d@pgtap.test', 'not-real', now(), now(), now());

insert into public.profiles (id, display_name, status)
values
  ('00000000-0000-4000-8000-000000000921', 'Membro 04D', 'active'),
  ('00000000-0000-4000-8000-000000000922', 'Admin Um 04D', 'active'),
  ('00000000-0000-4000-8000-000000000923', 'Auditor 04D', 'active'),
  ('00000000-0000-4000-8000-000000000924', 'Org Admin 04D', 'active'),
  ('00000000-0000-4000-8000-000000000925', 'Platform 04D', 'active'),
  ('00000000-0000-4000-8000-000000000926', 'Alvo 04D', 'active'),
  ('00000000-0000-4000-8000-000000000927', 'Alvo Reatribuicao 04D', 'active'),
  ('00000000-0000-4000-8000-000000000928', 'Alvo A2 04D', 'active'),
  ('00000000-0000-4000-8000-000000000929', 'Admin Dois 04D', 'active'),
  ('00000000-0000-4000-8000-000000000930', 'Alvo B1 04D', 'active'),
  ('00000000-0000-4000-8000-000000000931', 'Alvo Suspenso 04D', 'active');

insert into public.organizations (id, code, display_name, status)
values
  ('10000000-0000-4000-8000-000000000921', 'org-04d-a', 'Instituicao 04D A', 'active'),
  ('10000000-0000-4000-8000-000000000922', 'org-04d-b', 'Instituicao 04D B', 'active');

insert into public.hospitals (id, organization_id, code, display_name, status)
values
  ('20000000-0000-4000-8000-000000000921', '10000000-0000-4000-8000-000000000921', 'hospital-04d-a1', 'Hospital 04D A1', 'active'),
  ('20000000-0000-4000-8000-000000000922', '10000000-0000-4000-8000-000000000921', 'hospital-04d-a2', 'Hospital 04D A2', 'active'),
  ('20000000-0000-4000-8000-000000000923', '10000000-0000-4000-8000-000000000922', 'hospital-04d-b1', 'Hospital 04D B1', 'active');

insert into public.organization_memberships (id, organization_id, user_id, status)
select
  ('30000000-0000-4000-8000-0000000009' || n)::uuid,
  case when n = '30' then '10000000-0000-4000-8000-000000000922'::uuid else '10000000-0000-4000-8000-000000000921'::uuid end,
  ('00000000-0000-4000-8000-0000000009' || n)::uuid,
  'active'
from unnest(array['21','22','23','24','26','27','28','29','30','31']) as n;

insert into public.organization_membership_roles (organization_membership_id, role_id, status)
values
  ('30000000-0000-4000-8000-000000000924', (select id from public.roles where scope = 'organization' and code = 'organization_admin'), 'active');

insert into public.platform_role_assignments (user_id, role_id, status)
values
  ('00000000-0000-4000-8000-000000000925', (select id from public.roles where scope = 'platform' and code = 'platform_admin'), 'active');

insert into public.hospital_memberships (id, organization_id, hospital_id, organization_membership_id, status, management_ref)
values
  ('40000000-0000-4000-8000-000000000921', '10000000-0000-4000-8000-000000000921', '20000000-0000-4000-8000-000000000921', '30000000-0000-4000-8000-000000000921', 'active',    '00000000000000000000000000000921'),
  ('40000000-0000-4000-8000-000000000922', '10000000-0000-4000-8000-000000000921', '20000000-0000-4000-8000-000000000921', '30000000-0000-4000-8000-000000000922', 'active',    '00000000000000000000000000000922'),
  ('40000000-0000-4000-8000-000000000923', '10000000-0000-4000-8000-000000000921', '20000000-0000-4000-8000-000000000921', '30000000-0000-4000-8000-000000000923', 'active',    '00000000000000000000000000000923'),
  ('40000000-0000-4000-8000-000000000926', '10000000-0000-4000-8000-000000000921', '20000000-0000-4000-8000-000000000921', '30000000-0000-4000-8000-000000000926', 'active',    '00000000000000000000000000000926'),
  ('40000000-0000-4000-8000-000000000927', '10000000-0000-4000-8000-000000000921', '20000000-0000-4000-8000-000000000921', '30000000-0000-4000-8000-000000000927', 'active',    '00000000000000000000000000000927'),
  ('40000000-0000-4000-8000-000000000928', '10000000-0000-4000-8000-000000000921', '20000000-0000-4000-8000-000000000922', '30000000-0000-4000-8000-000000000928', 'active',    '00000000000000000000000000000928'),
  ('40000000-0000-4000-8000-000000000929', '10000000-0000-4000-8000-000000000921', '20000000-0000-4000-8000-000000000921', '30000000-0000-4000-8000-000000000929', 'active',    '00000000000000000000000000000929'),
  ('40000000-0000-4000-8000-000000000930', '10000000-0000-4000-8000-000000000922', '20000000-0000-4000-8000-000000000923', '30000000-0000-4000-8000-000000000930', 'active',    '00000000000000000000000000000930'),
  ('40000000-0000-4000-8000-000000000931', '10000000-0000-4000-8000-000000000921', '20000000-0000-4000-8000-000000000921', '30000000-0000-4000-8000-000000000931', 'suspended', '00000000000000000000000000000931');

-- Papeis iniciais: dois hospital_admin em A1; 927 possui atribuicao REVOGADA de
-- auditor (para o teste de reatribuicao sem duplicata).
insert into public.hospital_membership_roles (hospital_membership_id, role_id, status)
values
  ('40000000-0000-4000-8000-000000000921', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active'),
  ('40000000-0000-4000-8000-000000000922', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active'),
  ('40000000-0000-4000-8000-000000000923', (select id from public.roles where scope = 'hospital' and code = 'auditor'), 'active'),
  ('40000000-0000-4000-8000-000000000926', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active'),
  ('40000000-0000-4000-8000-000000000928', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active'),
  ('40000000-0000-4000-8000-000000000929', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active'),
  ('40000000-0000-4000-8000-000000000930', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active');

insert into public.hospital_membership_roles (hospital_membership_id, role_id, role_scope, status, revoked_at)
values
  ('40000000-0000-4000-8000-000000000927', (select id from public.roles where scope = 'hospital' and code = 'auditor'), 'hospital', 'revoked', now());

-- Refs opacas dos papeis (geradas pelo default do banco), via configuracao local.
select set_config('test.ref_member',   (select management_ref from public.roles where scope = 'hospital' and code = 'member'), true);
select set_config('test.ref_auditor',  (select management_ref from public.roles where scope = 'hospital' and code = 'auditor'), true);
select set_config('test.ref_admin',    (select management_ref from public.roles where scope = 'hospital' and code = 'hospital_admin'), true);
select set_config('test.ref_orgscope', (select management_ref from public.roles where scope = 'organization' and code = 'organization_admin'), true);

-- === Assercoes estruturais (como owner) =======================================

select has_column('public', 'roles', 'management_ref', 'roles.management_ref existe');
select col_is_unique('public', 'roles', 'management_ref', 'roles.management_ref e unique');
select is(
  (select count(*) from public.roles where management_ref !~ '^[0-9a-f]{32}$'),
  0::bigint,
  'todas as linhas do catalogo possuem management_ref de 32 hex'
);
select alike(
  (
    select pg_catalog.pg_get_expr(d.adbin, d.adrelid)
    from pg_catalog.pg_attrdef d
    join pg_catalog.pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
    where d.adrelid = 'public.roles'::regclass
      and a.attname = 'management_ref'
  ),
  '%gen_random_bytes%',
  'o default gera a referencia do papel no banco com alta entropia'
);

-- Hardening RPC-only de hospital_membership_roles.
select is(
  pg_catalog.has_table_privilege('authenticated', 'public.hospital_membership_roles', 'INSERT'),
  false,
  'authenticated nao possui INSERT em hospital_membership_roles'
);
select is(
  pg_catalog.has_table_privilege('authenticated', 'public.hospital_membership_roles', 'UPDATE'),
  false,
  'authenticated nao possui UPDATE em hospital_membership_roles'
);
select is(
  pg_catalog.has_table_privilege('authenticated', 'public.hospital_membership_roles', 'DELETE'),
  false,
  'authenticated nao possui DELETE em hospital_membership_roles'
);
select is(
  pg_catalog.has_column_privilege('authenticated', 'public.hospital_membership_roles', 'hospital_membership_id', 'INSERT'),
  false,
  'authenticated nao possui INSERT de coluna em hospital_membership_roles'
);
select is(
  pg_catalog.has_column_privilege('authenticated', 'public.hospital_membership_roles', 'status', 'UPDATE'),
  false,
  'authenticated nao possui UPDATE da coluna status'
);
select is(
  pg_catalog.has_column_privilege('authenticated', 'public.hospital_membership_roles', 'revoked_at', 'UPDATE'),
  false,
  'authenticated nao possui UPDATE da coluna revoked_at'
);
select is(
  pg_catalog.has_table_privilege('authenticated', 'public.hospital_membership_roles', 'SELECT'),
  true,
  'SELECT legitimo de hospital_membership_roles preservado'
);
select is(
  (select count(*) from pg_catalog.pg_policies
   where schemaname = 'public' and tablename = 'hospital_membership_roles' and cmd in ('INSERT', 'UPDATE', 'DELETE')),
  0::bigint,
  'nenhuma policy de mutacao em hospital_membership_roles'
);
select is(
  (select count(*) from pg_catalog.pg_policies
   where schemaname = 'public' and tablename = 'hospital_membership_roles' and cmd = 'SELECT'),
  1::bigint,
  'a policy de SELECT de hospital_membership_roles permanece'
);

-- Auditoria estendida.
select has_column('public', 'administrative_audit_events', 'target_role_id', 'auditoria possui target_role_id opcional');
select ok(
  exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'administrative_audit_events_transition_consistency_check'
      and conrelid = 'public.administrative_audit_events'::regclass
      and contype = 'c'
  ),
  'a constraint cruzada de consistencia continua presente apos a extensao'
);
select throws_ok(
  $$ insert into public.administrative_audit_events (
       organization_id, hospital_id, actor_profile_id, target_hospital_membership_id,
       event_type, previous_status, new_status)
     values ('10000000-0000-4000-8000-000000000921', '20000000-0000-4000-8000-000000000921',
             '00000000-0000-4000-8000-000000000922', '40000000-0000-4000-8000-000000000926',
             'hospital_role_assigned', 'none', 'active') $$,
  '23514',
  null,
  'evento de papel sem target_role_id e rejeitado'
);
select throws_ok(
  $$ insert into public.administrative_audit_events (
       organization_id, hospital_id, actor_profile_id, target_hospital_membership_id,
       target_role_id, event_type, previous_status, new_status)
     values ('10000000-0000-4000-8000-000000000921', '20000000-0000-4000-8000-000000000921',
             '00000000-0000-4000-8000-000000000922', '40000000-0000-4000-8000-000000000926',
             (select id from public.roles where scope = 'hospital' and code = 'member'),
             'hospital_membership_suspended', 'active', 'suspended') $$,
  '23514',
  null,
  'evento de vinculo com target_role_id e rejeitado'
);
select throws_ok(
  $$ insert into public.administrative_audit_events (
       organization_id, hospital_id, actor_profile_id, target_hospital_membership_id,
       target_role_id, event_type, previous_status, new_status)
     values ('10000000-0000-4000-8000-000000000921', '20000000-0000-4000-8000-000000000921',
             '00000000-0000-4000-8000-000000000922', '40000000-0000-4000-8000-000000000926',
             (select id from public.roles where scope = 'hospital' and code = 'member'),
             'hospital_role_assigned', 'active', 'active') $$,
  '23514',
  null,
  'evento de atribuicao com transicao incoerente e rejeitado'
);

-- RPC de mutacao de papeis.
select has_function(
  'public', 'change_hospital_membership_role', ARRAY['uuid', 'text', 'text', 'text'],
  'a RPC de papeis existe com a assinatura esperada'
);
select is(
  (select p.prosecdef from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'change_hospital_membership_role'),
  true,
  'a RPC de papeis e SECURITY DEFINER com validacao interna'
);
select is(
  (select p.provolatile from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'change_hospital_membership_role'),
  'v',
  'a RPC de papeis e VOLATILE'
);
select is(
  (select array_to_string(p.proconfig, ',') from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'change_hospital_membership_role'),
  'search_path=""',
  'a RPC de papeis fixa search_path vazio'
);
select alike(
  (select pg_catalog.pg_get_functiondef(p.oid) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'change_hospital_membership_role'),
  '%for update%',
  'a RPC de papeis serializa mutacoes com lock (SELECT ... FOR UPDATE)'
);
select function_privs_are(
  'public', 'change_hospital_membership_role', ARRAY['uuid', 'text', 'text', 'text'], 'public', ARRAY[]::text[],
  'PUBLIC nao executa a RPC de papeis'
);
select function_privs_are(
  'public', 'change_hospital_membership_role', ARRAY['uuid', 'text', 'text', 'text'], 'anon', ARRAY[]::text[],
  'anon nao executa a RPC de papeis'
);
select function_privs_are(
  'public', 'change_hospital_membership_role', ARRAY['uuid', 'text', 'text', 'text'], 'authenticated', ARRAY['EXECUTE'],
  'authenticated executa a RPC de papeis'
);
select function_privs_are(
  'public', 'get_hospital_assignable_roles', ARRAY['uuid'], 'anon', ARRAY[]::text[],
  'anon nao executa o catalogo atribuivel'
);
select function_privs_are(
  'public', 'get_hospital_assignable_roles', ARRAY['uuid'], 'authenticated', ARRAY['EXECUTE'],
  'authenticated executa o catalogo atribuivel'
);

-- === Autorizacao (como authenticated) =========================================
set local role authenticated;

-- Mutacao direta esta fechada: a RPC e o unico caminho.
select throws_ok(
  $$ insert into public.hospital_membership_roles (hospital_membership_id, role_id, role_scope, status)
     values ('40000000-0000-4000-8000-000000000926',
             (select id from public.roles where scope = 'hospital' and code = 'auditor'),
             'hospital', 'active') $$,
  '42501',
  null,
  'authenticated nao consegue INSERT direto em hospital_membership_roles'
);
select throws_ok(
  $$ update public.hospital_membership_roles set status = 'revoked'
     where hospital_membership_id = '40000000-0000-4000-8000-000000000926' $$,
  '42501',
  null,
  'authenticated nao consegue UPDATE direto em hospital_membership_roles'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000921', true);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000926', current_setting('test.ref_auditor'), 'assign'),
  'not_allowed',
  'member sem manage nao atribui papel'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000923', true);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000926', current_setting('test.ref_auditor'), 'assign'),
  'not_allowed',
  'auditor (somente leitura) nao atribui papel'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000925', true);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000926', current_setting('test.ref_auditor'), 'assign'),
  'not_allowed',
  'platform_admin sem manage explicito nao atribui papel (sem bypass)'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000922', true);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000922', '00000000000000000000000000000928', current_setting('test.ref_member'), 'assign'),
  'not_allowed',
  'isolamento entre hospitais: admin de A1 nao administra papeis em A2'
);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000923', '00000000000000000000000000000930', current_setting('test.ref_member'), 'assign'),
  'not_allowed',
  'isolamento entre organizacoes: admin de A1 nao administra papeis em B1'
);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000928', current_setting('test.ref_member'), 'assign'),
  'not_allowed',
  'ref de vinculo de outro hospital retorna not_allowed (sem enumeracao)'
);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', 'deadbeefdeadbeefdeadbeefdeadbeef', current_setting('test.ref_member'), 'assign'),
  'not_allowed',
  'ref de vinculo inexistente retorna not_allowed'
);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000926', 'deadbeefdeadbeefdeadbeefdeadbeef', 'assign'),
  'not_allowed',
  'ref de papel inexistente retorna not_allowed'
);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000926', current_setting('test.ref_orgscope'), 'assign'),
  'not_allowed',
  'papel de scope organizacional nao e atribuivel por esta RPC'
);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000926', current_setting('test.ref_member'), 'delete'),
  'invalid_transition',
  'acao fora do dominio assign/revoke e rejeitada'
);

reset role;
select is(
  (select count(*) from public.administrative_audit_events),
  0::bigint,
  'falhas de autorizacao e validacao nao geram evento de auditoria'
);
set local role authenticated;

-- === Assign / duplicidade / reatribuicao ======================================

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000922', true);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000926', current_setting('test.ref_auditor'), 'assign'),
  'updated',
  'hospital_admin atribui papel hospitalar existente'
);

reset role;
select results_eq(
  $$ select hmr.status, (hmr.revoked_at is null), hmr.granted_by::text
     from public.hospital_membership_roles hmr
     join public.roles r on r.id = hmr.role_id
     where hmr.hospital_membership_id = '40000000-0000-4000-8000-000000000926' and r.code = 'auditor' $$,
  $$ values ('active', true, '00000000-0000-4000-8000-000000000922') $$,
  'a atribuicao nasce ativa, sem revoked_at e com granted_by do ator'
);
select results_eq(
  $$ select event_type, previous_status, new_status,
            (target_role_id = (select id from public.roles where scope = 'hospital' and code = 'auditor')),
            actor_profile_id::text, target_hospital_membership_id::text
     from public.administrative_audit_events $$,
  $$ values ('hospital_role_assigned', 'none', 'active', true,
             '00000000-0000-4000-8000-000000000922', '40000000-0000-4000-8000-000000000926') $$,
  'atribuicao gera exatamente um evento com papel, ator, alvo e estados corretos'
);
set local role authenticated;

select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000926', current_setting('test.ref_auditor'), 'assign'),
  'invalid_transition',
  'atribuicao ja ativa nao pode ser duplicada'
);

-- Reatribuicao de papel revogado reativa a linha existente (sem duplicata).
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000927', current_setting('test.ref_auditor'), 'assign'),
  'updated',
  'papel anteriormente revogado pode ser reatribuido'
);

reset role;
select results_eq(
  $$ select count(*)::int, bool_and(hmr.status = 'active' and hmr.revoked_at is null)
     from public.hospital_membership_roles hmr
     join public.roles r on r.id = hmr.role_id
     where hmr.hospital_membership_id = '40000000-0000-4000-8000-000000000927' and r.code = 'auditor' $$,
  $$ values (1, true) $$,
  'a reatribuicao reativa a linha existente sem criar duplicata'
);
select is(
  (select count(*) from public.administrative_audit_events
    where event_type = 'hospital_role_assigned' and previous_status = 'revoked' and new_status = 'active'
      and target_hospital_membership_id = '40000000-0000-4000-8000-000000000927'),
  1::bigint,
  'a reatribuicao audita previous_status revoked'
);
set local role authenticated;

-- Vinculo suspenso (nao revogado) pode receber papel.
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000931', current_setting('test.ref_member'), 'assign'),
  'updated',
  'vinculo suspenso (nao revogado) pode receber papel'
);

-- === Revoke / invariantes =====================================================

select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000926', current_setting('test.ref_auditor'), 'revoke'),
  'updated',
  'hospital_admin revoga papel ativo'
);

reset role;
select results_eq(
  $$ select hmr.status, (hmr.revoked_at is not null)
     from public.hospital_membership_roles hmr
     join public.roles r on r.id = hmr.role_id
     where hmr.hospital_membership_id = '40000000-0000-4000-8000-000000000926' and r.code = 'auditor' $$,
  $$ values ('revoked', true) $$,
  'a revogacao marca status revoked e revoked_at preenchido'
);
select is(
  (select count(*) from public.administrative_audit_events
    where event_type = 'hospital_role_revoked' and previous_status = 'active' and new_status = 'revoked'
      and target_hospital_membership_id = '40000000-0000-4000-8000-000000000926'),
  1::bigint,
  'a revogacao gera exatamente um evento coerente'
);
set local role authenticated;

select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000926', current_setting('test.ref_auditor'), 'revoke'),
  'invalid_transition',
  'revogar atribuicao ja revogada e invalido'
);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000921', current_setting('test.ref_admin'), 'revoke'),
  'invalid_transition',
  'revogar papel nunca atribuido e invalido'
);

-- Auto-revogacao de hospital_admin bloqueada.
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000922', current_setting('test.ref_admin'), 'revoke'),
  'self_admin_role_forbidden',
  'o ator nao revoga o proprio papel hospital_admin'
);

-- Com dois administradores, um pode ser revogado; o restante fica protegido.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000924', true);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000929', current_setting('test.ref_admin'), 'revoke'),
  'updated',
  'organization_admin revoga hospital_admin quando existem dois administradores'
);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000922', current_setting('test.ref_admin'), 'revoke'),
  'last_admin_forbidden',
  'o ultimo hospital_admin ativo qualificado nao pode ser revogado'
);
select is(
  public.change_hospital_membership_role('20000000-0000-4000-8000-000000000921', '00000000000000000000000000000929', current_setting('test.ref_admin'), 'assign'),
  'updated',
  'o papel de administrador revogado pode ser reatribuido (restauracao)'
);

reset role;
select is(
  (select count(*) from public.administrative_audit_events),
  6::bigint,
  'somente sucessos geram auditoria (6 eventos no total)'
);
select is(
  (select count(*) from public.administrative_audit_events
    where not (
      (event_type = 'hospital_membership_suspended' and previous_status = 'active' and new_status = 'suspended' and target_role_id is null)
      or (event_type = 'hospital_membership_reactivated' and previous_status = 'suspended' and new_status = 'active' and target_role_id is null)
      or (event_type = 'hospital_role_assigned' and previous_status in ('none', 'revoked') and new_status = 'active' and target_role_id is not null)
      or (event_type = 'hospital_role_revoked' and previous_status = 'active' and new_status = 'revoked' and target_role_id is not null)
    )),
  0::bigint,
  'nenhuma combinacao inconsistente existe na auditoria'
);
set local role authenticated;

-- === Catalogo atribuivel e papeis administraveis ==============================

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000922', true);
select results_eq(
  $$ select count(*)::int, bool_and(role_ref ~ '^[0-9a-f]{32}$')
     from public.get_hospital_assignable_roles('20000000-0000-4000-8000-000000000921') $$,
  $$ values (3, true) $$,
  'gestor recebe o catalogo hospitalar minimo com refs opacas de 32 hex'
);
select is(
  (select count(distinct(elem->>'roleRef')) from public.get_hospital_team('20000000-0000-4000-8000-000000000921') t,
     jsonb_array_elements(t.assigned_roles) elem
   where (elem->>'roleRef') !~ '^[0-9a-f]{32}$'),
  0::bigint,
  'assigned_roles expoe somente refs opacas de 32 hex ao gestor'
);
select is(
  (select bool_or((elem->>'canRevoke')::boolean)
   from public.get_hospital_team('20000000-0000-4000-8000-000000000921') t,
     jsonb_array_elements(t.assigned_roles) elem
   where t.display_name = 'Admin Um 04D'),
  false,
  'o proprio papel hospital_admin do ator nunca aparece como revogavel'
);
select is(
  (select bool_and((elem->>'canRevoke')::boolean)
   from public.get_hospital_team('20000000-0000-4000-8000-000000000921') t,
     jsonb_array_elements(t.assigned_roles) elem
   where t.display_name = 'Membro 04D'),
  true,
  'papel comum de outro integrante aparece como revogavel para o gestor'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000923', true);
select is(
  (select count(*)::int from public.get_hospital_assignable_roles('20000000-0000-4000-8000-000000000921')),
  0,
  'auditor nao recebe o catalogo atribuivel'
);
select is(
  (select bool_and(assigned_roles is null)
   from public.get_hospital_team('20000000-0000-4000-8000-000000000921')),
  true,
  'auditor nao recebe assigned_roles (papeis administraveis ocultos)'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000921', true);
select is(
  (select count(*)::int from public.get_hospital_assignable_roles('20000000-0000-4000-8000-000000000921')),
  0,
  'member nao recebe o catalogo atribuivel'
);

select * from finish();

rollback;
