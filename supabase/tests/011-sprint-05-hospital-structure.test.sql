-- Sprint 05 - Cadastro institucional hospitalar sob RLS real
--
-- Responsabilidade:
-- Comprovar, como authenticated e sob RLS, que as quatro tabelas de estrutura
-- (hospital_units, hospital_sectors, hospital_beds, hospital_resources) sao
-- fail-closed: leitura somente com hospital_structure.read, mutacao somente
-- com hospital_structure.manage, isolamento entre hospitais e organizacoes,
-- invariantes de hierarquia (pai ativo, mesmo hospital), grants minimos sem
-- DELETE e capacidades efetivas estendidas com os dois novos booleanos.
--
-- Estrategia anti-contaminacao:
-- Cada cenario usa entidades proprias ja inseridas no estado final desejado.
-- UUIDs deterministicos reservados a este teste (faixa ...800+).
--
-- Limites:
-- - Nenhuma tabela clinica, dado real, papel clinico ou senha real.
-- - Nenhum service role; toda avaliacao comportamental roda como authenticated.
-- - Transacional com rollback: nada persiste no banco local.

begin;

select plan(76);

-- Identidades ficticias -------------------------------------------------------
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000801', 'authenticated', 'authenticated', 'member-05@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000802', 'authenticated', 'authenticated', 'hosp-admin-05@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000803', 'authenticated', 'authenticated', 'hosp-auditor-05@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000804', 'authenticated', 'authenticated', 'org-admin-05@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000806', 'authenticated', 'authenticated', 'hosp-admin2-05@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000807', 'authenticated', 'authenticated', 'org-b-admin-05@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000808', 'authenticated', 'authenticated', 'platform-05@pgtap.test', 'not-real', now(), now(), now());

insert into public.profiles (id, display_name, status)
values
  ('00000000-0000-4000-8000-000000000801', 'Member 05 Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000802', 'Hosp Admin 05 Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000803', 'Hosp Auditor 05 Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000804', 'Org Admin 05 Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000806', 'Hosp Admin2 05 Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000807', 'Org B Admin 05 Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000808', 'Platform 05 Ficticio', 'active');

insert into public.organizations (id, code, display_name, status)
values
  ('10000000-0000-4000-8000-000000000801', 'org-05-a', 'Instituicao 05 A', 'active'),
  ('10000000-0000-4000-8000-000000000802', 'org-05-b', 'Instituicao 05 B', 'active');

insert into public.hospitals (id, organization_id, code, display_name, status)
values
  ('20000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', 'hospital-05-a1', 'Hospital 05 A1', 'active'),
  ('20000000-0000-4000-8000-000000000802', '10000000-0000-4000-8000-000000000801', 'hospital-05-a2', 'Hospital 05 A2', 'active'),
  ('20000000-0000-4000-8000-000000000803', '10000000-0000-4000-8000-000000000801', 'hospital-05-a3', 'Hospital 05 A3 Inativo', 'inactive'),
  ('20000000-0000-4000-8000-000000000804', '10000000-0000-4000-8000-000000000802', 'hospital-05-b1', 'Hospital 05 B1', 'active');

insert into public.organization_memberships (id, organization_id, user_id, status)
values
  ('30000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'active'),
  ('30000000-0000-4000-8000-000000000802', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000802', 'active'),
  ('30000000-0000-4000-8000-000000000803', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000803', 'active'),
  ('30000000-0000-4000-8000-000000000804', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000804', 'active'),
  ('30000000-0000-4000-8000-000000000806', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000806', 'active'),
  ('30000000-0000-4000-8000-000000000807', '10000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000807', 'active');

insert into public.organization_membership_roles (organization_membership_id, role_id, status)
values
  ('30000000-0000-4000-8000-000000000804', (select id from public.roles where scope = 'organization' and code = 'organization_admin'), 'active'),
  ('30000000-0000-4000-8000-000000000807', (select id from public.roles where scope = 'organization' and code = 'organization_admin'), 'active');

insert into public.platform_role_assignments (user_id, role_id, status)
values
  ('00000000-0000-4000-8000-000000000808', (select id from public.roles where scope = 'platform' and code = 'platform_admin'), 'active');

insert into public.hospital_memberships (id, organization_id, hospital_id, organization_membership_id, status)
values
  ('40000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '30000000-0000-4000-8000-000000000801', 'active'),
  ('40000000-0000-4000-8000-000000000802', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '30000000-0000-4000-8000-000000000802', 'active'),
  ('40000000-0000-4000-8000-000000000803', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '30000000-0000-4000-8000-000000000803', 'active'),
  ('40000000-0000-4000-8000-000000000806', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000802', '30000000-0000-4000-8000-000000000806', 'active');

insert into public.hospital_membership_roles (hospital_membership_id, role_id, status)
values
  ('40000000-0000-4000-8000-000000000801', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active'),
  ('40000000-0000-4000-8000-000000000802', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active'),
  ('40000000-0000-4000-8000-000000000803', (select id from public.roles where scope = 'hospital' and code = 'auditor'), 'active'),
  ('40000000-0000-4000-8000-000000000806', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active');

-- Estrutura ficticia (inserida como owner, estado final desejado) -------------
insert into public.hospital_units (id, organization_id, hospital_id, code, display_name, status, management_ref)
values
  ('50000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', 'unidade-a1-ativa', 'Unidade A1 Ativa', 'active', 'aaaa0000aaaa0000aaaa0000aaaa0801'),
  ('50000000-0000-4000-8000-000000000802', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', 'unidade-a1-inativa', 'Unidade A1 Inativa', 'inactive', 'aaaa0000aaaa0000aaaa0000aaaa0802'),
  ('50000000-0000-4000-8000-000000000803', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000802', 'unidade-a2-ativa', 'Unidade A2 Ativa', 'active', 'aaaa0000aaaa0000aaaa0000aaaa0803'),
  ('50000000-0000-4000-8000-000000000804', '10000000-0000-4000-8000-000000000802', '20000000-0000-4000-8000-000000000804', 'unidade-b1-ativa', 'Unidade B1 Ativa', 'active', 'aaaa0000aaaa0000aaaa0000aaaa0804');

insert into public.hospital_sectors (id, organization_id, hospital_id, unit_id, code, display_name, status, management_ref)
values
  ('60000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '50000000-0000-4000-8000-000000000801', 'setor-a1-ativo', 'Setor A1 Ativo', 'active', 'bbbb0000bbbb0000bbbb0000bbbb0801'),
  ('60000000-0000-4000-8000-000000000802', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '50000000-0000-4000-8000-000000000801', 'setor-a1-inativo', 'Setor A1 Inativo', 'inactive', 'bbbb0000bbbb0000bbbb0000bbbb0802');

insert into public.hospital_beds (id, organization_id, hospital_id, sector_id, code, display_name, status, management_ref)
values
  ('70000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '60000000-0000-4000-8000-000000000801', 'leito-a1-01', 'Leito A1 01', 'active', 'cccc0000cccc0000cccc0000cccc0801');

insert into public.hospital_resources (id, organization_id, hospital_id, code, display_name, description, status, management_ref)
values
  ('80000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', 'recurso-a1', 'Recurso A1', 'Recurso ficticio de teste', 'active', 'dddd0000dddd0000dddd0000dddd0801');

-- === Assercoes estruturais (como owner) =======================================

select has_table('public', 'hospital_units', 'hospital_units existe');
select has_table('public', 'hospital_sectors', 'hospital_sectors existe');
select has_table('public', 'hospital_beds', 'hospital_beds existe');
select has_table('public', 'hospital_resources', 'hospital_resources existe');

select ok((select relrowsecurity from pg_class where relname = 'hospital_units' and relnamespace = 'public'::regnamespace), 'RLS habilitado em hospital_units');
select ok((select relrowsecurity from pg_class where relname = 'hospital_sectors' and relnamespace = 'public'::regnamespace), 'RLS habilitado em hospital_sectors');
select ok((select relrowsecurity from pg_class where relname = 'hospital_beds' and relnamespace = 'public'::regnamespace), 'RLS habilitado em hospital_beds');
select ok((select relrowsecurity from pg_class where relname = 'hospital_resources' and relnamespace = 'public'::regnamespace), 'RLS habilitado em hospital_resources');

-- No nivel de TABELA, authenticated possui somente SELECT; INSERT e UPDATE
-- existem apenas como grants de COLUNAS especificas (grants minimos).
select table_privs_are('public', 'hospital_units', 'authenticated', ARRAY['SELECT'], 'authenticated possui somente SELECT de tabela em hospital_units');
select table_privs_are('public', 'hospital_sectors', 'authenticated', ARRAY['SELECT'], 'authenticated possui somente SELECT de tabela em hospital_sectors');
select table_privs_are('public', 'hospital_beds', 'authenticated', ARRAY['SELECT'], 'authenticated possui somente SELECT de tabela em hospital_beds');
select table_privs_are('public', 'hospital_resources', 'authenticated', ARRAY['SELECT'], 'authenticated possui somente SELECT de tabela em hospital_resources');

select ok(not has_table_privilege('authenticated', 'public.hospital_units', 'DELETE'), 'authenticated nao possui DELETE em hospital_units');
select ok(not has_table_privilege('authenticated', 'public.hospital_sectors', 'DELETE'), 'authenticated nao possui DELETE em hospital_sectors');
select ok(not has_table_privilege('authenticated', 'public.hospital_beds', 'DELETE'), 'authenticated nao possui DELETE em hospital_beds');
select ok(not has_table_privilege('authenticated', 'public.hospital_resources', 'DELETE'), 'authenticated nao possui DELETE em hospital_resources');

select ok(has_column_privilege('authenticated', 'public.hospital_units', 'code', 'INSERT'), 'INSERT de coluna concedido para code em hospital_units');
select ok(not has_column_privilege('authenticated', 'public.hospital_units', 'status', 'INSERT'), 'INSERT de coluna NEGADO para status em hospital_units');
select ok(has_column_privilege('authenticated', 'public.hospital_units', 'status', 'UPDATE'), 'UPDATE de coluna concedido para status em hospital_units');
select ok(not has_column_privilege('authenticated', 'public.hospital_units', 'display_name', 'UPDATE'), 'UPDATE de coluna NEGADO para display_name em hospital_units');
select ok(not has_column_privilege('authenticated', 'public.hospital_units', 'management_ref', 'INSERT'), 'INSERT de coluna NEGADO para management_ref em hospital_units');

select table_privs_are('public', 'hospital_units', 'anon', ARRAY[]::text[], 'anon sem nenhum privilegio em hospital_units');
select table_privs_are('public', 'hospital_sectors', 'anon', ARRAY[]::text[], 'anon sem nenhum privilegio em hospital_sectors');
select table_privs_are('public', 'hospital_beds', 'anon', ARRAY[]::text[], 'anon sem nenhum privilegio em hospital_beds');
select table_privs_are('public', 'hospital_resources', 'anon', ARRAY[]::text[], 'anon sem nenhum privilegio em hospital_resources');

select ok(exists (select 1 from pg_constraint where conname = 'hospital_units_hospital_organization_fk'), 'FK composta unidade -> hospital/organizacao existe');
select ok(exists (select 1 from pg_constraint where conname = 'hospital_sectors_unit_hospital_fk'), 'FK composta setor -> unidade do MESMO hospital existe');
select ok(exists (select 1 from pg_constraint where conname = 'hospital_beds_sector_hospital_fk'), 'FK composta leito -> setor do MESMO hospital existe');
select ok(exists (select 1 from pg_constraint where conname = 'hospital_resources_hospital_organization_fk'), 'FK composta recurso -> hospital/organizacao existe');

select ok(exists (select 1 from pg_constraint where conname = 'hospital_units_hospital_code_unique'), 'codigo de unidade unico por hospital');
select is(
  (select count(*)::integer from pg_trigger where tgname in ('hospital_sectors_enforce_active_unit', 'hospital_beds_enforce_active_sector')),
  2,
  'triggers de pai ativo existem em setores e leitos'
);
select is(
  (select count(*)::integer from pg_trigger where tgname in ('hospital_units_set_updated_at', 'hospital_sectors_set_updated_at', 'hospital_beds_set_updated_at', 'hospital_resources_set_updated_at')),
  4,
  'triggers de updated_at existem nas quatro tabelas'
);

select is(
  (select count(*)::integer from public.permissions where code in ('hospital_structure.read', 'hospital_structure.manage')),
  4,
  'exatamente quatro permissoes de estrutura semeadas (dois escopos)'
);

select is(
  (
    select count(*)::integer
    from public.role_permissions rp
    join public.permissions p on p.id = rp.permission_id
    where p.code in ('hospital_structure.read', 'hospital_structure.manage')
  ),
  6,
  'exatamente seis mapeamentos papel-permissao de estrutura'
);

select is(
  (
    select count(*)::integer
    from public.role_permissions rp
    join public.permissions p on p.id = rp.permission_id
    join public.roles r on r.id = rp.role_id
    where p.code like 'hospital_structure.%'
      and r.code = 'member'
  ),
  0,
  'member nao recebe nenhuma permissao de estrutura'
);

select is(
  (
    select count(*)::integer from (
      select management_ref from public.hospital_units
      union all select management_ref from public.hospital_sectors
      union all select management_ref from public.hospital_beds
      union all select management_ref from public.hospital_resources
    ) refs
    where refs.management_ref !~ '^[0-9a-f]{32}$'
  ),
  0,
  'todas as referencias opacas seguem o formato de 32 hex'
);

select is(
  (
    select p.prosecdef
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'get_effective_hospital_capabilities'
  ),
  false,
  'a funcao de capacidades permanece SECURITY INVOKER'
);

select is(
  (
    select array_length(p.proallargtypes, 1)
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'get_effective_hospital_capabilities'
  ),
  8,
  'a funcao de capacidades devolve sete colunas alem do argumento'
);

select function_privs_are('public', 'get_effective_hospital_capabilities', ARRAY['uuid'], 'anon', ARRAY[]::text[], 'anon nao executa a funcao de capacidades');
select function_privs_are('public', 'get_effective_hospital_capabilities', ARRAY['uuid'], 'authenticated', ARRAY['EXECUTE'], 'authenticated executa a funcao de capacidades');

-- === A partir daqui, tudo roda estritamente como authenticated ===============
set local role authenticated;

-- Cenario: hospital member -> sem leitura de estrutura e sem capacidades novas.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000801', true);
select is(
  (select count(*)::integer from public.hospital_units),
  0,
  'member nao enxerga nenhuma unidade'
);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context, can_read_structure, can_manage_structure
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000801') $$,
  $$ values (true, false, false, false, true, false, false) $$,
  'member: capacidades anteriores preservadas e estrutura negada'
);

-- Cenario: auditor hospitalar -> leitura sim, mutacao nao.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000803', true);
select is(
  (select count(*)::integer from public.hospital_units),
  2,
  'auditor enxerga as unidades do proprio hospital (ativa e inativa)'
);
select is(
  (select count(*)::integer from public.hospital_beds),
  1,
  'auditor enxerga os leitos do proprio hospital'
);
select results_eq(
  $$ select can_read_structure, can_manage_structure
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000801') $$,
  $$ values (true, false) $$,
  'auditor: can_read_structure sem can_manage_structure'
);
select throws_ok(
  $$ insert into public.hospital_units (organization_id, hospital_id, code, display_name)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', 'unidade-auditor', 'Unidade Auditor') $$,
  '42501',
  null,
  'auditor nao cria unidade (RLS nega insert)'
);
update public.hospital_units
   set status = 'inactive'
 where management_ref = 'aaaa0000aaaa0000aaaa0000aaaa0801';
select is(
  (select status from public.hospital_units where management_ref = 'aaaa0000aaaa0000aaaa0000aaaa0801'),
  'active',
  'auditor nao altera status (zero linhas sob RLS)'
);

-- Cenario: hospital_admin -> gestao completa no proprio hospital.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000802', true);
select results_eq(
  $$ select can_read_structure, can_manage_structure
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000801') $$,
  $$ values (true, true) $$,
  'hospital_admin: leitura e gestao de estrutura'
);
select lives_ok(
  $$ insert into public.hospital_units (organization_id, hospital_id, code, display_name)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', 'unidade-admin', 'Unidade Admin') $$,
  'hospital_admin cria unidade no proprio hospital'
);
select is(
  (select count(*)::integer from public.hospital_units where hospital_id = '20000000-0000-4000-8000-000000000801'),
  3,
  'a unidade criada aparece na listagem do hospital'
);
select ok(
  (select management_ref ~ '^[0-9a-f]{32}$' from public.hospital_units where code = 'unidade-admin'),
  'a referencia opaca da nova unidade e gerada no formato de 32 hex'
);
select throws_ok(
  $$ insert into public.hospital_units (organization_id, hospital_id, code, display_name)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', 'unidade-a1-ativa', 'Duplicada') $$,
  '23505',
  null,
  'codigo duplicado no mesmo hospital e rejeitado'
);
select throws_ok(
  $$ insert into public.hospital_units (organization_id, hospital_id, code, display_name, status)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', 'unidade-status', 'Unidade Status', 'inactive') $$,
  '42501',
  null,
  'insert com coluna status explicita e negado (grant de colunas minimo)'
);
select throws_ok(
  $$ insert into public.hospital_units (organization_id, hospital_id, code, display_name)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', 'Unidade-Maiuscula', 'Unidade Maiuscula') $$,
  '23514',
  null,
  'codigo fora do formato slug e rejeitado pelo check'
);
select lives_ok(
  $$ insert into public.hospital_sectors (organization_id, hospital_id, unit_id, code, display_name)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '50000000-0000-4000-8000-000000000801', 'setor-admin', 'Setor Admin') $$,
  'hospital_admin cria setor sob unidade ativa'
);
select throws_ok(
  $$ insert into public.hospital_sectors (organization_id, hospital_id, unit_id, code, display_name)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '50000000-0000-4000-8000-000000000802', 'setor-inativo-pai', 'Setor Pai Inativo') $$,
  '23514',
  null,
  'setor sob unidade INATIVA e rejeitado pelo invariante'
);
select throws_ok(
  $$ insert into public.hospital_sectors (organization_id, hospital_id, unit_id, code, display_name)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '50000000-0000-4000-8000-000000000803', 'setor-outro-hospital', 'Setor Outro Hospital') $$,
  '23514',
  null,
  'setor apontando unidade de OUTRO hospital e rejeitado'
);
select lives_ok(
  $$ insert into public.hospital_beds (organization_id, hospital_id, sector_id, code, display_name)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '60000000-0000-4000-8000-000000000801', 'leito-admin-01', 'Leito Admin 01') $$,
  'hospital_admin cria leito sob setor ativo'
);
select throws_ok(
  $$ insert into public.hospital_beds (organization_id, hospital_id, sector_id, code, display_name)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '60000000-0000-4000-8000-000000000802', 'leito-inativo-pai', 'Leito Pai Inativo') $$,
  '23514',
  null,
  'leito sob setor INATIVO e rejeitado pelo invariante'
);
select lives_ok(
  $$ insert into public.hospital_resources (organization_id, hospital_id, code, display_name, description)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', 'recurso-admin', 'Recurso Admin', 'Recurso ficticio criado pelo admin') $$,
  'hospital_admin cria recurso institucional'
);
update public.hospital_units
   set status = 'inactive'
 where management_ref = 'aaaa0000aaaa0000aaaa0000aaaa0801';
select is(
  (select status from public.hospital_units where management_ref = 'aaaa0000aaaa0000aaaa0000aaaa0801'),
  'inactive',
  'hospital_admin desativa unidade do proprio hospital'
);
-- Tentativa contra unidade de OUTRO hospital: zero linhas sob RLS; a
-- integridade e verificada adiante pelo admin de A2.
update public.hospital_units
   set status = 'inactive'
 where management_ref = 'aaaa0000aaaa0000aaaa0000aaaa0803';
select throws_ok(
  $$ insert into public.hospital_units (organization_id, hospital_id, code, display_name)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000802', 'unidade-intrusa', 'Unidade Intrusa') $$,
  '42501',
  null,
  'hospital_admin NAO cria unidade em hospital onde nao gerencia'
);
select is(
  (select count(*)::integer from public.hospital_units where hospital_id = '20000000-0000-4000-8000-000000000802'),
  0,
  'hospital_admin de A1 nao enxerga unidades de A2'
);

-- Cenario: hospital_admin de A2 -> isolamento reciproco.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000806', true);
select is(
  (select count(*)::integer from public.hospital_units where hospital_id = '20000000-0000-4000-8000-000000000801'),
  0,
  'hospital_admin de A2 nao enxerga unidades de A1'
);
select is(
  (select count(*)::integer from public.hospital_units where hospital_id = '20000000-0000-4000-8000-000000000802'),
  1,
  'hospital_admin de A2 enxerga apenas a unidade de A2'
);
select is(
  (select status from public.hospital_units where management_ref = 'aaaa0000aaaa0000aaaa0000aaaa0803'),
  'active',
  'a unidade de A2 permaneceu intacta apos a tentativa do admin de A1'
);

-- Cenario: organization_admin da organizacao A -> escopo organizacional.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000804', true);
select results_eq(
  $$ select can_read_structure, can_manage_structure
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000801') $$,
  $$ values (true, true) $$,
  'organization_admin: estrutura legivel e gerenciavel via escopo organizacional'
);
select is(
  (select count(*)::integer from public.hospital_units where hospital_id in ('20000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000802')),
  4,
  'organization_admin enxerga as unidades de todos os hospitais da organizacao'
);
select is(
  (select count(*)::integer from public.hospital_units where hospital_id = '20000000-0000-4000-8000-000000000804'),
  0,
  'organization_admin NAO enxerga unidades de outra organizacao'
);
select lives_ok(
  $$ insert into public.hospital_units (organization_id, hospital_id, code, display_name)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', 'unidade-org-admin', 'Unidade Org Admin') $$,
  'organization_admin cria unidade em hospital da propria organizacao'
);
select throws_ok(
  $$ insert into public.hospital_units (organization_id, hospital_id, code, display_name)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000803', 'unidade-hosp-inativo', 'Unidade Hospital Inativo') $$,
  '42501',
  null,
  'estrutura NAO pode ser criada em hospital inativo'
);

-- Cenario: organization_admin da organizacao B -> isolamento entre tenants.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000807', true);
select is(
  (
    (select count(*) from public.hospital_units where organization_id = '10000000-0000-4000-8000-000000000801')
    + (select count(*) from public.hospital_sectors where organization_id = '10000000-0000-4000-8000-000000000801')
    + (select count(*) from public.hospital_beds where organization_id = '10000000-0000-4000-8000-000000000801')
    + (select count(*) from public.hospital_resources where organization_id = '10000000-0000-4000-8000-000000000801')
  )::integer,
  0,
  'organizacao B nao enxerga NENHUMA linha de estrutura da organizacao A'
);
select throws_ok(
  $$ insert into public.hospital_units (organization_id, hospital_id, code, display_name)
     values ('10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', 'unidade-cross-tenant', 'Unidade Cross Tenant') $$,
  '42501',
  null,
  'organizacao B nao cria estrutura em hospital da organizacao A'
);

-- Cenario: platform_admin -> nenhum bypass de estrutura.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000808', true);
select is(
  (select count(*)::integer from public.hospital_units),
  0,
  'platform_admin nao enxerga estrutura (sem bypass)'
);
select results_eq(
  $$ select can_read_structure, can_manage_structure
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000801') $$,
  $$ values (false, false) $$,
  'platform_admin: capacidades de estrutura negadas'
);

-- Cenario: as consultas executam como authenticated.
select is(
  (select current_user)::text,
  'authenticated',
  'as consultas de estrutura executam como authenticated'
);

select * from finish();

rollback;
