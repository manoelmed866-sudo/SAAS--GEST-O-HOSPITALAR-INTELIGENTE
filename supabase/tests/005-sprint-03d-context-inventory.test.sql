-- Sprint 03D1 - Inventario de contexto institucional
--
-- Responsabilidade:
-- Garantir, sob RLS real como authenticated, que o inventario usado pela
-- aplicacao em src/lib/auth/context.ts (getAuthorizedContextInventory) devolve
-- exclusivamente organizations e hospitals ativos e autorizados ao usuario
-- atual. As consultas abaixo replicam exatamente o que o app executa:
--   organizations: select ... where status = 'active'   (filtrado por RLS)
--   hospitals:     select ... where status = 'active'   (filtrado por RLS)
--
-- Limites:
-- - Nenhuma tabela clinica, dado real ou papel clinico.
-- - Nenhum service role; tudo roda como authenticated.
-- - Transacional com rollback: nada persiste no banco local.

begin;

select plan(10);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000501', 'authenticated', 'authenticated', 'inst-admin-03d@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000502', 'authenticated', 'authenticated', 'hosp-only-03d@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000503', 'authenticated', 'authenticated', 'multi-hosp-03d@pgtap.test', 'not-real', now(), now(), now());

insert into public.profiles (id, display_name, status)
values
  ('00000000-0000-4000-8000-000000000501', 'Inst Admin 03D Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000502', 'Hospital Only 03D Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000503', 'Multi Hospital 03D Ficticio', 'active');

insert into public.organizations (id, code, display_name, status)
values
  ('10000000-0000-4000-8000-000000000501', 'org-03d-a', 'Instituicao 03D A', 'active'),
  ('10000000-0000-4000-8000-000000000502', 'org-03d-b', 'Instituicao 03D B', 'active');

insert into public.hospitals (id, organization_id, code, display_name, status)
values
  ('20000000-0000-4000-8000-000000000501', '10000000-0000-4000-8000-000000000501', 'hospital-03d-1', 'Hospital 03D 1', 'active'),
  ('20000000-0000-4000-8000-000000000502', '10000000-0000-4000-8000-000000000501', 'hospital-03d-2', 'Hospital 03D 2', 'active'),
  ('20000000-0000-4000-8000-000000000503', '10000000-0000-4000-8000-000000000501', 'hospital-03d-3', 'Hospital 03D 3', 'active'),
  ('20000000-0000-4000-8000-000000000511', '10000000-0000-4000-8000-000000000502', 'hospital-03d-b', 'Hospital 03D B', 'active');

-- Vinculo organizacional do admin (com papel), e vinculos hospital-only e
-- multi-hospital (SEM papel organizacional).
insert into public.organization_memberships (id, organization_id, user_id, status)
values
  ('30000000-0000-4000-8000-000000000501', '10000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000501', 'active'),
  ('30000000-0000-4000-8000-000000000502', '10000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000502', 'active'),
  ('30000000-0000-4000-8000-000000000503', '10000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000503', 'active');

insert into public.organization_membership_roles (organization_membership_id, role_id, status)
values
  ('30000000-0000-4000-8000-000000000501', (select id from public.roles where scope = 'organization' and code = 'organization_admin'), 'active');

-- hospital-only (0502) tem vinculo com H1; multi-hospital (0503) tem vinculo com H1 e H2.
insert into public.hospital_memberships (id, organization_id, hospital_id, organization_membership_id, status)
values
  ('40000000-0000-4000-8000-000000000502', '10000000-0000-4000-8000-000000000501', '20000000-0000-4000-8000-000000000501', '30000000-0000-4000-8000-000000000502', 'active'),
  ('40000000-0000-4000-8000-000000000503', '10000000-0000-4000-8000-000000000501', '20000000-0000-4000-8000-000000000501', '30000000-0000-4000-8000-000000000503', 'active'),
  ('40000000-0000-4000-8000-000000000504', '10000000-0000-4000-8000-000000000501', '20000000-0000-4000-8000-000000000502', '30000000-0000-4000-8000-000000000503', 'active');

insert into public.hospital_membership_roles (hospital_membership_id, role_id, status)
values
  ('40000000-0000-4000-8000-000000000502', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active'),
  ('40000000-0000-4000-8000-000000000503', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active'),
  ('40000000-0000-4000-8000-000000000504', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active');

-- Usuario institucional (organization_admin) --------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000501', true);

select is(
  (select count(*)::integer from public.organizations where status = 'active'),
  1,
  'usuario institucional visualiza apenas a organizacao autorizada e ativa'
);

select is(
  (select count(*)::integer from public.hospitals where status = 'active'),
  3,
  'papel organizacional autorizado visualiza os hospitais ativos da organizacao'
);

-- Usuario hospital-only sem papel organizacional ----------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000502', true);

select is(
  (select count(*)::integer from public.organizations where status = 'active'),
  0,
  'usuario hospital-only nao le organizations'
);

select is(
  (select count(*)::integer from public.hospitals where status = 'active'),
  1,
  'usuario hospital-only le exatamente o hospital autorizado'
);

select is(
  (
    select count(*)::integer
    from public.hospitals
    where status = 'active'
      and organization_id = '10000000-0000-4000-8000-000000000502'
  ),
  0,
  'usuario hospital-only nao ve hospital de outro tenant'
);

-- Usuario com varios hospitais ----------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000503', true);

select is(
  (select count(*)::integer from public.hospitals where status = 'active'),
  2,
  'usuario com varios hospitais recebe somente os hospitais autorizados'
);

select is(
  (select count(*)::integer from public.organizations where status = 'active'),
  0,
  'usuario multi-hospital sem papel organizacional nao le organizations'
);

-- Hospital suspenso desaparece do inventario --------------------------------
reset role;
update public.hospitals
set status = 'suspended'
where id = '20000000-0000-4000-8000-000000000503';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000501', true);

select is(
  (select count(*)::integer from public.hospitals where status = 'active'),
  2,
  'hospital suspenso nao aparece no inventario'
);

-- Vinculo hospitalar revogado elimina o hospital ----------------------------
reset role;
update public.hospital_memberships
set status = 'revoked'
where id = '40000000-0000-4000-8000-000000000504';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000503', true);

select is(
  (select count(*)::integer from public.hospitals where status = 'active'),
  1,
  'vinculo hospitalar revogado elimina o hospital do inventario'
);

-- Organizacao suspensa elimina seus hospitais -------------------------------
reset role;
update public.organizations
set status = 'suspended'
where id = '10000000-0000-4000-8000-000000000501';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000502', true);

select is(
  (select count(*)::integer from public.hospitals where status = 'active'),
  0,
  'organizacao suspensa elimina seus hospitais do inventario'
);

select * from finish();

rollback;
