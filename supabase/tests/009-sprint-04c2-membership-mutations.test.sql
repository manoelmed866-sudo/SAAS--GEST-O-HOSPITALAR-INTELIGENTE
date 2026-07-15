-- Sprint 04C.2 - Suspensao/reativacao de vinculos com auditoria transacional
--
-- Responsabilidade:
-- Comprovar a referencia opaca management_ref, a tabela append-only de
-- auditoria sem acesso direto, a RPC change_hospital_membership_status
-- (SECURITY DEFINER, VOLATILE, lock do hospital, autorizacao explicita por
-- hospital_memberships.manage, sem bypass de platform_admin), as transicoes
-- permitidas (active<->suspended), as protecoes de auto-suspensao e ultimo
-- administrador, e os metadados de acao de get_hospital_team.
--
-- Estrategia anti-contaminacao:
-- Entidades proprias com UUIDs deterministicos (faixa ...900+) e
-- management_ref explicitos de 32 hex para permitir chamadas deterministas;
-- a geracao aleatoria do default e comprovada estruturalmente.
-- Transacional com rollback: nada persiste no banco local.

begin;

select plan(59);

-- Identidades ficticias -------------------------------------------------------
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000901', 'authenticated', 'authenticated', 'member-04c2@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000902', 'authenticated', 'authenticated', 'admin1-04c2@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000903', 'authenticated', 'authenticated', 'auditor-04c2@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000904', 'authenticated', 'authenticated', 'org-admin-04c2@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000905', 'authenticated', 'authenticated', 'platform-04c2@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000906', 'authenticated', 'authenticated', 'target-04c2@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000907', 'authenticated', 'authenticated', 'pending-04c2@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000908', 'authenticated', 'authenticated', 'revoked-04c2@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000909', 'authenticated', 'authenticated', 'admin2-04c2@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000910', 'authenticated', 'authenticated', 'admin-b1-04c2@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000911', 'authenticated', 'authenticated', 'inactive-04c2@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000912', 'authenticated', 'authenticated', 'target-a2-04c2@pgtap.test', 'not-real', now(), now(), now());

insert into public.profiles (id, display_name, status)
values
  ('00000000-0000-4000-8000-000000000901', 'Membro 04C2', 'active'),
  ('00000000-0000-4000-8000-000000000902', 'Admin Um 04C2', 'active'),
  ('00000000-0000-4000-8000-000000000903', 'Auditor 04C2', 'active'),
  ('00000000-0000-4000-8000-000000000904', 'Org Admin 04C2', 'active'),
  ('00000000-0000-4000-8000-000000000905', 'Platform 04C2', 'active'),
  ('00000000-0000-4000-8000-000000000906', 'Alvo Ativo 04C2', 'active'),
  ('00000000-0000-4000-8000-000000000907', 'Alvo Pendente 04C2', 'active'),
  ('00000000-0000-4000-8000-000000000908', 'Alvo Revogado 04C2', 'active'),
  ('00000000-0000-4000-8000-000000000909', 'Admin Dois 04C2', 'active'),
  ('00000000-0000-4000-8000-000000000910', 'Admin B1 04C2', 'active'),
  ('00000000-0000-4000-8000-000000000911', 'Ator Inativo 04C2', 'suspended'),
  ('00000000-0000-4000-8000-000000000912', 'Alvo A2 04C2', 'active');

insert into public.organizations (id, code, display_name, status)
values
  ('10000000-0000-4000-8000-000000000901', 'org-04c2-a', 'Instituicao 04C2 A', 'active'),
  ('10000000-0000-4000-8000-000000000902', 'org-04c2-b', 'Instituicao 04C2 B', 'active');

insert into public.hospitals (id, organization_id, code, display_name, status)
values
  ('20000000-0000-4000-8000-000000000901', '10000000-0000-4000-8000-000000000901', 'hospital-04c2-a1', 'Hospital 04C2 A1', 'active'),
  ('20000000-0000-4000-8000-000000000902', '10000000-0000-4000-8000-000000000901', 'hospital-04c2-a2', 'Hospital 04C2 A2', 'active'),
  ('20000000-0000-4000-8000-000000000903', '10000000-0000-4000-8000-000000000902', 'hospital-04c2-b1', 'Hospital 04C2 B1', 'active');

insert into public.organization_memberships (id, organization_id, user_id, status)
select
  ('30000000-0000-4000-8000-0000000009' || n)::uuid,
  case when n = '10' then '10000000-0000-4000-8000-000000000902'::uuid else '10000000-0000-4000-8000-000000000901'::uuid end,
  ('00000000-0000-4000-8000-0000000009' || n)::uuid,
  'active'
from unnest(array['01','02','03','04','06','07','08','09','10','11','12']) as n;

insert into public.organization_membership_roles (organization_membership_id, role_id, status)
values
  ('30000000-0000-4000-8000-000000000904', (select id from public.roles where scope = 'organization' and code = 'organization_admin'), 'active');

insert into public.platform_role_assignments (user_id, role_id, status)
values
  ('00000000-0000-4000-8000-000000000905', (select id from public.roles where scope = 'platform' and code = 'platform_admin'), 'active');

-- Vinculos hospitalares com refs opacas explicitas (32 hex deterministicos).
insert into public.hospital_memberships (id, organization_id, hospital_id, organization_membership_id, status, management_ref)
values
  ('40000000-0000-4000-8000-000000000901', '10000000-0000-4000-8000-000000000901', '20000000-0000-4000-8000-000000000901', '30000000-0000-4000-8000-000000000901', 'active',   '00000000000000000000000000000901'),
  ('40000000-0000-4000-8000-000000000902', '10000000-0000-4000-8000-000000000901', '20000000-0000-4000-8000-000000000901', '30000000-0000-4000-8000-000000000902', 'active',   '00000000000000000000000000000902'),
  ('40000000-0000-4000-8000-000000000903', '10000000-0000-4000-8000-000000000901', '20000000-0000-4000-8000-000000000901', '30000000-0000-4000-8000-000000000903', 'active',   '00000000000000000000000000000903'),
  ('40000000-0000-4000-8000-000000000906', '10000000-0000-4000-8000-000000000901', '20000000-0000-4000-8000-000000000901', '30000000-0000-4000-8000-000000000906', 'active',   '00000000000000000000000000000906'),
  ('40000000-0000-4000-8000-000000000907', '10000000-0000-4000-8000-000000000901', '20000000-0000-4000-8000-000000000901', '30000000-0000-4000-8000-000000000907', 'pending',  '00000000000000000000000000000907'),
  ('40000000-0000-4000-8000-000000000908', '10000000-0000-4000-8000-000000000901', '20000000-0000-4000-8000-000000000901', '30000000-0000-4000-8000-000000000908', 'revoked',  '00000000000000000000000000000908'),
  ('40000000-0000-4000-8000-000000000909', '10000000-0000-4000-8000-000000000901', '20000000-0000-4000-8000-000000000901', '30000000-0000-4000-8000-000000000909', 'active',   '00000000000000000000000000000909'),
  ('40000000-0000-4000-8000-000000000910', '10000000-0000-4000-8000-000000000902', '20000000-0000-4000-8000-000000000903', '30000000-0000-4000-8000-000000000910', 'active',   '00000000000000000000000000000910'),
  ('40000000-0000-4000-8000-000000000911', '10000000-0000-4000-8000-000000000901', '20000000-0000-4000-8000-000000000901', '30000000-0000-4000-8000-000000000911', 'active',   '00000000000000000000000000000911'),
  ('40000000-0000-4000-8000-000000000912', '10000000-0000-4000-8000-000000000901', '20000000-0000-4000-8000-000000000902', '30000000-0000-4000-8000-000000000912', 'active',   '00000000000000000000000000000912');

-- Papeis hospitalares: 902 tem DOIS papeis (admin com multiplos papeis continua
-- protegido); 909 e o segundo admin; 911 e admin com perfil inativo (ator).
insert into public.hospital_membership_roles (hospital_membership_id, role_id, status)
values
  ('40000000-0000-4000-8000-000000000901', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active'),
  ('40000000-0000-4000-8000-000000000902', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active'),
  ('40000000-0000-4000-8000-000000000902', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active'),
  ('40000000-0000-4000-8000-000000000903', (select id from public.roles where scope = 'hospital' and code = 'auditor'), 'active'),
  ('40000000-0000-4000-8000-000000000906', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active'),
  ('40000000-0000-4000-8000-000000000907', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active'),
  ('40000000-0000-4000-8000-000000000908', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active'),
  ('40000000-0000-4000-8000-000000000909', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active'),
  ('40000000-0000-4000-8000-000000000910', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active'),
  ('40000000-0000-4000-8000-000000000911', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active'),
  ('40000000-0000-4000-8000-000000000912', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active');

-- === Assercoes estruturais (como owner) =======================================

select has_column('public', 'hospital_memberships', 'management_ref', 'management_ref existe');

select col_is_unique('public', 'hospital_memberships', 'management_ref', 'management_ref e unique');

select is(
  (select count(*) from public.hospital_memberships where management_ref !~ '^[0-9a-f]{32}$'),
  0::bigint,
  'todas as linhas possuem management_ref de 32 hex (formato nao-UUID)'
);

select is(
  (select count(distinct management_ref) from public.hospital_memberships),
  (select count(*) from public.hospital_memberships),
  'nenhuma management_ref duplicada nas linhas existentes'
);

select alike(
  (
    select pg_catalog.pg_get_expr(d.adbin, d.adrelid)
    from pg_catalog.pg_attrdef d
    join pg_catalog.pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
    where d.adrelid = 'public.hospital_memberships'::regclass
      and a.attname = 'management_ref'
  ),
  '%gen_random_bytes%',
  'o default gera a referencia no banco com alta entropia (gen_random_bytes)'
);

select has_table('public', 'administrative_audit_events', 'tabela de auditoria administrativa existe');

select is(
  (select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'administrative_audit_events'),
  true,
  'RLS habilitado na tabela de auditoria (sem policy permissiva)'
);

select table_privs_are(
  'public', 'administrative_audit_events', 'authenticated', ARRAY[]::text[],
  'authenticated nao possui nenhum privilegio direto na auditoria'
);

select table_privs_are(
  'public', 'administrative_audit_events', 'anon', ARRAY[]::text[],
  'anon nao possui nenhum privilegio direto na auditoria'
);

select has_function(
  'public', 'change_hospital_membership_status', ARRAY['uuid', 'text', 'text'],
  'a RPC de mutacao existe com a assinatura esperada'
);

select is(
  (select p.prosecdef from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'change_hospital_membership_status'),
  true,
  'a RPC de mutacao e SECURITY DEFINER com validacao interna'
);

select is(
  (select p.provolatile from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'change_hospital_membership_status'),
  'v',
  'a RPC de mutacao e VOLATILE'
);

select is(
  (select array_to_string(p.proconfig, ',') from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'change_hospital_membership_status'),
  'search_path=""',
  'a RPC de mutacao fixa search_path vazio'
);

select alike(
  (select pg_catalog.pg_get_functiondef(p.oid) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'change_hospital_membership_status'),
  '%for update%',
  'a RPC serializa mutacoes com lock (SELECT ... FOR UPDATE)'
);

select function_privs_are(
  'public', 'change_hospital_membership_status', ARRAY['uuid', 'text', 'text'], 'public', ARRAY[]::text[],
  'PUBLIC nao executa a RPC de mutacao'
);

select function_privs_are(
  'public', 'change_hospital_membership_status', ARRAY['uuid', 'text', 'text'], 'anon', ARRAY[]::text[],
  'anon nao executa a RPC de mutacao'
);

select function_privs_are(
  'public', 'change_hospital_membership_status', ARRAY['uuid', 'text', 'text'], 'authenticated', ARRAY['EXECUTE'],
  'authenticated executa a RPC de mutacao'
);

-- === Hardening: RPC como unico caminho de mutacao =============================

select is(
  pg_catalog.has_table_privilege('authenticated', 'public.hospital_memberships', 'UPDATE'),
  false,
  'authenticated nao possui UPDATE de tabela em hospital_memberships'
);

select is(
  pg_catalog.has_column_privilege('authenticated', 'public.hospital_memberships', 'status', 'UPDATE'),
  false,
  'authenticated nao possui UPDATE da coluna status em hospital_memberships'
);

select is(
  (select count(*) from pg_catalog.pg_policies
   where schemaname = 'public' and tablename = 'hospital_memberships' and cmd = 'UPDATE'),
  0::bigint,
  'nao existe policy de UPDATE em hospital_memberships'
);

select is(
  (select count(*) from pg_catalog.pg_policies
   where schemaname = 'public' and policyname = 'hospital_memberships_update_allowed'),
  0::bigint,
  'a policy hospital_memberships_update_allowed foi removida'
);

select ok(
  exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'administrative_audit_events_transition_consistency_check'
      and conrelid = 'public.administrative_audit_events'::regclass
      and contype = 'c'
  ),
  'a constraint cruzada de consistencia evento/transicao existe na auditoria'
);

select throws_ok(
  $$ insert into public.administrative_audit_events (
       organization_id, hospital_id, actor_profile_id, target_hospital_membership_id,
       event_type, previous_status, new_status)
     values ('10000000-0000-4000-8000-000000000901', '20000000-0000-4000-8000-000000000901',
             '00000000-0000-4000-8000-000000000902', '40000000-0000-4000-8000-000000000906',
             'hospital_membership_suspended', 'suspended', 'active') $$,
  '23514',
  null,
  'evento de suspensao com transicao incoerente e rejeitado pela constraint'
);

select throws_ok(
  $$ insert into public.administrative_audit_events (
       organization_id, hospital_id, actor_profile_id, target_hospital_membership_id,
       event_type, previous_status, new_status)
     values ('10000000-0000-4000-8000-000000000901', '20000000-0000-4000-8000-000000000901',
             '00000000-0000-4000-8000-000000000902', '40000000-0000-4000-8000-000000000906',
             'hospital_membership_reactivated', 'active', 'suspended') $$,
  '23514',
  null,
  'evento de reativacao com transicao incoerente e rejeitado pela constraint'
);

-- === Autorizacao (como authenticated) =========================================
set local role authenticated;

-- O UPDATE direto foi revogado: a unica via de mutacao e a RPC.
select throws_ok(
  $$ update public.hospital_memberships set status = 'suspended'
     where management_ref = '00000000000000000000000000000906' $$,
  '42501',
  null,
  'authenticated nao consegue UPDATE direto em hospital_memberships'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000901', true);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000906', 'suspended'),
  'not_allowed',
  'member sem manage nao altera vinculo'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000903', true);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000906', 'suspended'),
  'not_allowed',
  'auditor (somente leitura) nao altera vinculo'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000905', true);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000906', 'suspended'),
  'not_allowed',
  'platform_admin sem manage explicito nao altera vinculo (sem bypass)'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000911', true);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000906', 'suspended'),
  'not_allowed',
  'ator com perfil inativo nao altera vinculo, mesmo com papel admin'
);

-- Isolamento: admin de A1 nao alcanca A2 nem B1.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000902', true);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000902', '00000000000000000000000000000912', 'suspended'),
  'not_allowed',
  'isolamento entre hospitais: admin de A1 nao altera vinculo de A2'
);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000903', '00000000000000000000000000000910', 'suspended'),
  'not_allowed',
  'isolamento entre organizacoes: admin de A1 nao altera vinculo de B1'
);

-- Alvo fora do escopo e ref invalida: mesmo resultado (sem enumeracao).
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000904', true);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000912', 'suspended'),
  'not_allowed',
  'ref de outro hospital com hospital A1 informado retorna not_allowed'
);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', 'deadbeefdeadbeefdeadbeefdeadbeef', 'suspended'),
  'not_allowed',
  'management_ref inexistente retorna not_allowed'
);

-- Nenhuma falha acima gerou evento de auditoria.
reset role;
select is(
  (select count(*) from public.administrative_audit_events),
  0::bigint,
  'falhas de autorizacao nao geram evento de auditoria'
);
set local role authenticated;

-- === Transicoes e invariantes =================================================

-- hospital_admin suspende membro ativo.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000902', true);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000906', 'suspended'),
  'updated',
  'hospital_admin suspende vinculo active'
);

reset role;
select is(
  (select status from public.hospital_memberships where id = '40000000-0000-4000-8000-000000000906'),
  'suspended',
  'o vinculo alvo ficou suspended'
);
select is(
  (select count(*) from public.administrative_audit_events),
  1::bigint,
  'sucesso gera exatamente um evento de auditoria'
);
select results_eq(
  $$ select event_type, previous_status, new_status,
            actor_profile_id::text, hospital_id::text, target_hospital_membership_id::text,
            (created_at is not null)
     from public.administrative_audit_events $$,
  $$ values ('hospital_membership_suspended', 'active', 'suspended',
             '00000000-0000-4000-8000-000000000902', '20000000-0000-4000-8000-000000000901',
             '40000000-0000-4000-8000-000000000906', true) $$,
  'evento de suspensao registra ator, hospital, alvo, estados e timestamp corretos'
);
set local role authenticated;

-- Repeticao da mesma transicao e bloqueada.
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000906', 'suspended'),
  'invalid_transition',
  'suspended -> suspended e invalido'
);

-- organization_admin reativa o vinculo suspenso do hospital da propria org.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000904', true);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000906', 'active'),
  'updated',
  'organization_admin reativa vinculo suspended do hospital da propria organizacao'
);

reset role;
select is(
  (select status from public.hospital_memberships where id = '40000000-0000-4000-8000-000000000906'),
  'active',
  'o vinculo alvo voltou a active'
);
select is(
  (select count(*) from public.administrative_audit_events where event_type = 'hospital_membership_reactivated'
     and actor_profile_id = '00000000-0000-4000-8000-000000000904'
     and previous_status = 'suspended' and new_status = 'active'),
  1::bigint,
  'reativacao gera evento proprio com ator e estados corretos na mesma transacao'
);
set local role authenticated;

-- active -> active e invalido.
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000906', 'active'),
  'invalid_transition',
  'active -> active e invalido'
);

-- pending e intocavel nas duas direcoes.
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000907', 'suspended'),
  'invalid_transition',
  'pending nao pode ser suspenso'
);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000907', 'active'),
  'invalid_transition',
  'pending nao pode ser ativado por esta RPC'
);

-- revoked permanece terminal.
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000908', 'active'),
  'invalid_transition',
  'revoked nao pode ser reativado (terminal)'
);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000908', 'suspended'),
  'invalid_transition',
  'revoked nao pode ser suspenso'
);

-- Estado solicitado fora do dominio.
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000906', 'revoked'),
  'invalid_transition',
  'revogacao nao existe nesta etapa'
);

-- Auto-suspensao bloqueada (admin 902 contra o proprio vinculo).
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000902', true);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000902', 'suspended'),
  'self_suspension_forbidden',
  'o ator nao suspende o proprio vinculo'
);

-- Com dois administradores ativos, um pode ser suspenso.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000904', true);
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000909', 'suspended'),
  'updated',
  'com dois administradores ativos, um pode ser suspenso'
);

-- Agora 902 e o ultimo admin ativo (mesmo tendo multiplos papeis): protegido.
select is(
  public.change_hospital_membership_status('20000000-0000-4000-8000-000000000901', '00000000000000000000000000000902', 'suspended'),
  'last_admin_forbidden',
  'o ultimo administrador ativo (com multiplos papeis) nao pode ser suspenso'
);

reset role;
select is(
  (select count(*) from public.administrative_audit_events),
  3::bigint,
  'somente sucessos geram auditoria (3 eventos: 2 suspensoes e 1 reativacao)'
);
set local role authenticated;

-- === Metadados de acao em get_hospital_team ==================================

-- Auditor: leitura sem metadados de gestao.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000903', true);
select is(
  (select bool_and(management_ref is null and can_suspend = false and can_reactivate = false)
   from public.get_hospital_team('20000000-0000-4000-8000-000000000901')),
  true,
  'auditor recebe management_ref nula e indicadores falsos'
);

-- Admin: refs opacas validas e indicadores coerentes com o estado final:
-- 901 member active (pode suspender), 902 ultimo admin/self (nao), 903 auditor
-- active (pode), 906 active (pode), 907 pending (nao), 909 suspended (reativar).
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000902', true);
select is(
  (select bool_and(management_ref ~ '^[0-9a-f]{32}$')
   from public.get_hospital_team('20000000-0000-4000-8000-000000000901')),
  true,
  'administrador recebe referencias opacas de 32 hex (nunca UUID)'
);
select is(
  (select can_suspend from public.get_hospital_team('20000000-0000-4000-8000-000000000901')
   where display_name = 'Alvo Ativo 04C2'),
  true,
  'membro active alheio pode ser suspenso (can_suspend true)'
);
select is(
  (select can_suspend from public.get_hospital_team('20000000-0000-4000-8000-000000000901')
   where display_name = 'Admin Um 04C2'),
  false,
  'o proprio ator / ultimo admin nao recebe can_suspend'
);
select is(
  (select can_reactivate from public.get_hospital_team('20000000-0000-4000-8000-000000000901')
   where display_name = 'Admin Dois 04C2'),
  true,
  'vinculo suspended recebe can_reactivate'
);
select results_eq(
  $$ select can_suspend, can_reactivate
     from public.get_hospital_team('20000000-0000-4000-8000-000000000901')
     where display_name = 'Alvo Pendente 04C2' $$,
  $$ values (false, false) $$,
  'vinculo pending nao recebe nenhuma acao'
);
select is(
  (select can_reactivate from public.get_hospital_team('20000000-0000-4000-8000-000000000901')
   where display_name = 'Alvo Ativo 04C2'),
  false,
  'vinculo active nao recebe can_reactivate'
);

select * from finish();

rollback;
