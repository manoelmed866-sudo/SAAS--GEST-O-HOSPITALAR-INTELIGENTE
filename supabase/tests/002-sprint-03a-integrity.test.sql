begin;

select plan(14);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000101', 'authenticated', 'authenticated', 'user-a@example.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000102', 'authenticated', 'authenticated', 'user-b@example.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000103', 'authenticated', 'authenticated', 'user-c@example.test', 'not-real', now(), now(), now());

insert into public.profiles (id, display_name, status)
values
  ('00000000-0000-4000-8000-000000000101', 'Usuario Ficticio A', 'active'),
  ('00000000-0000-4000-8000-000000000102', 'Usuario Ficticio B', 'active');

insert into public.organizations (id, code, display_name, status, created_by)
values
  ('10000000-0000-4000-8000-000000000001', 'org-a', 'Instituicao Ficticia A', 'active', '00000000-0000-4000-8000-000000000101'),
  ('10000000-0000-4000-8000-000000000002', 'org-b', 'Instituicao Ficticia B', 'active', '00000000-0000-4000-8000-000000000102');

insert into public.hospitals (id, organization_id, code, display_name, status, created_by)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'hospital-a', 'Hospital Ficticio A', 'active', '00000000-0000-4000-8000-000000000101'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'hospital-b', 'Hospital Ficticio B', 'active', '00000000-0000-4000-8000-000000000102');

insert into public.organization_memberships (id, organization_id, user_id, status, created_by)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'active', '00000000-0000-4000-8000-000000000101'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', 'active', '00000000-0000-4000-8000-000000000102');

insert into public.hospital_memberships (id, organization_id, hospital_id, organization_membership_id, status, created_by)
values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'active', '00000000-0000-4000-8000-000000000101');

select throws_ok(
  $sql$
    insert into public.hospitals (organization_id, code, display_name)
    values ('10000000-0000-4000-8000-999999999999', 'hospital-invalido', 'Hospital Invalido')
  $sql$,
  '23503',
  null,
  'hospital nao referencia organization inexistente'
);

select throws_ok(
  $sql$
    insert into public.hospital_memberships (organization_id, hospital_id, organization_membership_id)
    values ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002')
  $sql$,
  '23503',
  null,
  'hospital_membership nao combina hospital e organization_membership de organizations diferentes'
);

select throws_ok(
  format(
    'insert into public.organization_membership_roles (organization_membership_id, role_id) values (%L, %s)',
    '30000000-0000-4000-8000-000000000001',
    (select id from public.roles where scope = 'platform' and code = 'platform_admin')
  ),
  '23503',
  null,
  'papel platform nao pode ser atribuido em organization membership'
);

select throws_ok(
  format(
    'insert into public.hospital_membership_roles (hospital_membership_id, role_id) values (%L, %s)',
    '40000000-0000-4000-8000-000000000001',
    (select id from public.roles where scope = 'organization' and code = 'organization_admin')
  ),
  '23503',
  null,
  'papel organization nao pode ser atribuido em hospital membership'
);

select throws_ok(
  $sql$
    insert into public.organization_memberships (organization_id, user_id)
    values ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101')
  $sql$,
  '23505',
  null,
  'duplicidade de organization membership e bloqueada'
);

insert into public.organization_membership_roles (organization_membership_id, role_id)
values (
  '30000000-0000-4000-8000-000000000001',
  (select id from public.roles where scope = 'organization' and code = 'member')
);

select throws_ok(
  format(
    'insert into public.organization_membership_roles (organization_membership_id, role_id) values (%L, %s)',
    '30000000-0000-4000-8000-000000000001',
    (select id from public.roles where scope = 'organization' and code = 'member')
  ),
  '23505',
  null,
  'duplicidade de papel no mesmo organization membership e bloqueada'
);

insert into public.hospital_membership_roles (hospital_membership_id, role_id)
values (
  '40000000-0000-4000-8000-000000000001',
  (select id from public.roles where scope = 'hospital' and code = 'member')
);

select throws_ok(
  format(
    'insert into public.hospital_membership_roles (hospital_membership_id, role_id) values (%L, %s)',
    '40000000-0000-4000-8000-000000000001',
    (select id from public.roles where scope = 'hospital' and code = 'member')
  ),
  '23505',
  null,
  'duplicidade de papel no mesmo hospital membership e bloqueada'
);

select throws_ok(
  $sql$
    insert into public.profiles (id, display_name, status)
    values ('00000000-0000-4000-8000-000000000103', 'Status Invalido', 'blocked')
  $sql$,
  '23514',
  null,
  'estado invalido de profile e bloqueado'
);

select throws_ok(
  $sql$
    insert into public.organizations (code, display_name, status)
    values ('Org Invalida', 'Organizacao Invalida', 'active')
  $sql$,
  '23514',
  null,
  'code de organization fora do formato canonico e bloqueado'
);

select throws_ok(
  $sql$
    delete from public.organizations
    where id = '10000000-0000-4000-8000-000000000001'
  $sql$,
  '23503',
  null,
  'exclusao fisica de organization com dependencias e bloqueada'
);

select is(
  (select count(*)::integer from public.platform_role_assignments),
  0,
  'nenhum platform_admin ou usuario inicial foi criado pela migracao'
);

select is(
  (
    select count(*)::integer
    from public.role_permissions rp
    join public.roles r on r.id = rp.role_id
    join public.permissions p on p.id = rp.permission_id
    where r.scope <> p.scope or rp.scope <> r.scope
  ),
  0,
  'role_permissions preserva integridade de scope'
);

select is(
  (
    select count(*)::integer
    from public.roles
    where code in ('medico', 'enfermeiro', 'farmaceutico')
  ),
  0,
  'nenhum papel clinico foi inserido'
);

select ok(
  exists (
    select 1
    from public.hospital_memberships hm
    join public.organization_memberships om on om.id = hm.organization_membership_id
    join public.hospitals h on h.id = hm.hospital_id
    where hm.organization_id = om.organization_id
      and hm.organization_id = h.organization_id
  ),
  'hospital_membership valido preserva a mesma organization em toda a cadeia'
);

select * from finish();

rollback;
