begin;

select plan(23);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000201', 'authenticated', 'authenticated', 'platform-admin@example.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000202', 'authenticated', 'authenticated', 'org-admin@example.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000203', 'authenticated', 'authenticated', 'hospital-admin@example.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000204', 'authenticated', 'authenticated', 'auditor@example.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000205', 'authenticated', 'authenticated', 'member@example.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000206', 'authenticated', 'authenticated', 'outsider@example.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000207', 'authenticated', 'authenticated', 'suspended@example.test', 'not-real', now(), now(), now());

insert into public.profiles (id, display_name, status)
values
  ('00000000-0000-4000-8000-000000000201', 'Platform Admin Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000202', 'Organization Admin Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000203', 'Hospital Admin Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000204', 'Auditor Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000205', 'Member Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000206', 'Outsider Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000207', 'Suspended Ficticio', 'suspended');

insert into public.organizations (id, code, display_name, status)
values
  ('10000000-0000-4000-8000-000000000101', 'org-rls-a', 'Instituicao RLS A', 'active'),
  ('10000000-0000-4000-8000-000000000102', 'org-rls-b', 'Instituicao RLS B', 'active'),
  ('10000000-0000-4000-8000-000000000103', 'org-rls-suspended', 'Instituicao RLS Suspensa', 'suspended');

insert into public.hospitals (id, organization_id, code, display_name, status)
values
  ('20000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000101', 'hospital-rls-a', 'Hospital RLS A', 'active'),
  ('20000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000102', 'hospital-rls-b', 'Hospital RLS B', 'active'),
  ('20000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000101', 'hospital-rls-suspended', 'Hospital RLS Suspenso', 'suspended');

insert into public.platform_role_assignments (user_id, role_id, status)
values (
  '00000000-0000-4000-8000-000000000201',
  (select id from public.roles where scope = 'platform' and code = 'platform_admin'),
  'active'
);

insert into public.organization_memberships (id, organization_id, user_id, status)
values
  ('30000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000202', 'active'),
  ('30000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000203', 'active'),
  ('30000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000204', 'active'),
  ('30000000-0000-4000-8000-000000000104', '10000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000205', 'active'),
  ('30000000-0000-4000-8000-000000000105', '10000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000206', 'active'),
  ('30000000-0000-4000-8000-000000000106', '10000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000207', 'active');

insert into public.organization_membership_roles (organization_membership_id, role_id, status)
values
  ('30000000-0000-4000-8000-000000000101', (select id from public.roles where scope = 'organization' and code = 'organization_admin'), 'active'),
  ('30000000-0000-4000-8000-000000000103', (select id from public.roles where scope = 'organization' and code = 'auditor'), 'active'),
  ('30000000-0000-4000-8000-000000000104', (select id from public.roles where scope = 'organization' and code = 'member'), 'active'),
  ('30000000-0000-4000-8000-000000000105', (select id from public.roles where scope = 'organization' and code = 'member'), 'active'),
  ('30000000-0000-4000-8000-000000000106', (select id from public.roles where scope = 'organization' and code = 'member'), 'active');

insert into public.hospital_memberships (id, organization_id, hospital_id, organization_membership_id, status)
values
  ('40000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000101', '30000000-0000-4000-8000-000000000102', 'active'),
  ('40000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000101', '30000000-0000-4000-8000-000000000103', 'active'),
  ('40000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000101', '30000000-0000-4000-8000-000000000104', 'active'),
  ('40000000-0000-4000-8000-000000000104', '10000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000102', '30000000-0000-4000-8000-000000000105', 'active'),
  ('40000000-0000-4000-8000-000000000105', '10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000103', '30000000-0000-4000-8000-000000000104', 'active');

insert into public.hospital_membership_roles (hospital_membership_id, role_id, status)
values
  ('40000000-0000-4000-8000-000000000101', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active'),
  ('40000000-0000-4000-8000-000000000102', (select id from public.roles where scope = 'hospital' and code = 'auditor'), 'active'),
  ('40000000-0000-4000-8000-000000000103', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active'),
  ('40000000-0000-4000-8000-000000000104', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active'),
  ('40000000-0000-4000-8000-000000000105', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active');

set local role anon;

select throws_ok(
  $sql$ select count(*) from public.organizations $sql$,
  '42501',
  null,
  'anon nao possui acesso a organizations'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000009999', true);

select is((select count(*)::integer from public.organizations), 0, 'authenticated sem profile nao acessa organizations');
select is((select count(*)::integer from public.roles), 0, 'authenticated sem profile active nao acessa papeis');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000205', true);

select is((select count(*)::integer from public.profiles where id = auth.uid()), 1, 'usuario visualiza o proprio profile');

select throws_ok(
  $sql$ update public.profiles set status = 'suspended' where id = auth.uid() $sql$,
  '42501',
  null,
  'usuario nao altera o proprio status'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000206', true);

select is((select count(*)::integer from public.organizations where code = 'org-rls-a'), 0, 'membro de outra organization nao ve organization alheia');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000202', true);

select is((select count(*)::integer from public.organizations), 1, 'organization_admin ve apenas a propria organization');
select is((select count(*)::integer from public.organization_memberships), 5, 'organization_admin lista apenas memberships da propria organization');

select throws_ok(
  $sql$
    insert into public.organization_memberships (organization_id, user_id)
    values ('10000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000205')
  $sql$,
  '42501',
  null,
  'organization_admin nao cria vinculo em outra organization'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000203', true);

select is((select count(*)::integer from public.hospitals), 1, 'hospital_admin ve apenas hospital autorizado');

select throws_ok(
  $sql$
    insert into public.hospital_memberships (organization_id, hospital_id, organization_membership_id)
    values ('10000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000102', '30000000-0000-4000-8000-000000000105')
  $sql$,
  '42501',
  null,
  'hospital_admin nao cria vinculo em outro hospital'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000204', true);

select is((select count(*)::integer from public.organizations), 1, 'auditor le dentro do proprio escopo');
select throws_ok(
  $sql$
    update public.organizations
    set code = 'tentativa-auditor'
    where id = '10000000-0000-4000-8000-000000000101'
  $sql$,
  '42501',
  null,
  'auditor nao escreve'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000205', true);

select throws_ok(
  $sql$
    insert into public.organization_memberships (organization_id, user_id)
    values ('10000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000206')
  $sql$,
  '42501',
  null,
  'member nao gerencia vinculos'
);

select throws_ok(
  $sql$
    insert into public.hospital_memberships (organization_id, hospital_id, organization_membership_id)
    values ('10000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000101', '30000000-0000-4000-8000-000000000105')
  $sql$,
  '42501',
  null,
  'falsificacao de organization_id e bloqueada'
);

select throws_ok(
  $sql$
    insert into public.hospital_memberships (organization_id, hospital_id, organization_membership_id)
    values ('10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000102', '30000000-0000-4000-8000-000000000104')
  $sql$,
  '42501',
  null,
  'falsificacao de hospital_id e bloqueada'
);

reset role;
update public.organization_memberships
set status = 'revoked'
where id = '30000000-0000-4000-8000-000000000104';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000205', true);

select is((select count(*)::integer from public.organizations), 0, 'vinculo revogado perde acesso');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000207', true);

select is((select count(*)::integer from public.organizations), 0, 'profile suspenso perde acesso');

reset role;
update public.organizations
set status = 'suspended'
where id = '10000000-0000-4000-8000-000000000101';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000202', true);

select is((select count(*)::integer from public.organizations), 0, 'organization suspensa bloqueia acesso');

reset role;
update public.organizations
set status = 'active'
where id = '10000000-0000-4000-8000-000000000101';
update public.hospitals
set status = 'suspended'
where id = '20000000-0000-4000-8000-000000000101';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000203', true);

select is((select count(*)::integer from public.hospitals), 0, 'hospital suspenso bloqueia acesso');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000201', true);

select is((select count(*)::integer from public.organizations), 3, 'platform_admin visualiza estrutura institucional');
select is((select count(*)::integer from public.hospitals), 3, 'platform_admin visualiza estrutura hospitalar');

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('patients', 'episodes', 'clinical_records', 'exams', 'medications')
  ),
  0,
  'platform_admin nao recebe acesso clinico porque nao existe tabela clinica'
);

select * from finish();

rollback;
