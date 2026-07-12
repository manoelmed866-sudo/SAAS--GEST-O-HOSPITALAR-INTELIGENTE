-- Sprint 03D3 - Validacao do contexto institucional ativo sob RLS real
--
-- Responsabilidade:
-- Comprovar, sob RLS como authenticated, que a consulta usada por
-- validateActiveContext (src/lib/auth/context.ts) so devolve um hospital quando
-- o usuario possui autorizacao institucional valida e ativa. A consulta
-- reproduzida e exatamente:
--
--   select id, organization_id
--   from public.hospitals
--   where id = <hospital_id>
--     and organization_id = <organization_id>
--     and status = 'active';
--
-- Estrategia anti-contaminacao:
-- Cada cenario que depende de status suspenso/revogado usa ENTIDADE PROPRIA,
-- ja inserida no estado final desejado. Nao ha mutacao de status no meio do
-- teste, portanto nenhum cenario altera o estado observado por outro.
--
-- Limites:
-- - Nenhuma tabela clinica, dado real, papel clinico ou senha real.
-- - Nenhum service role; toda validacao roda como authenticated.
-- - UUIDs deterministicos reservados a este teste (faixa ...600+).
-- - Transacional com rollback: nada persiste no banco local.

begin;

select plan(11);

-- Identidades ficticias -------------------------------------------------------
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000601', 'authenticated', 'authenticated', 'hosp-member-03d3@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000602', 'authenticated', 'authenticated', 'org-admin-03d3@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000603', 'authenticated', 'authenticated', 'susp-hosp-03d3@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000604', 'authenticated', 'authenticated', 'susp-org-03d3@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000605', 'authenticated', 'authenticated', 'revoked-hm-03d3@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000606', 'authenticated', 'authenticated', 'revoked-role-03d3@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000607', 'authenticated', 'authenticated', 'no-bond-03d3@pgtap.test', 'not-real', now(), now(), now());

insert into public.profiles (id, display_name, status)
values
  ('00000000-0000-4000-8000-000000000601', 'Hosp Member 03D3 Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000602', 'Org Admin 03D3 Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000603', 'Susp Hosp 03D3 Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000604', 'Susp Org 03D3 Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000605', 'Revoked HM 03D3 Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000606', 'Revoked Role 03D3 Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000607', 'No Bond 03D3 Ficticio', 'active');

-- Instituicoes ficticias ------------------------------------------------------
insert into public.organizations (id, code, display_name, status)
values
  ('10000000-0000-4000-8000-000000000601', 'org-03d3-a', 'Instituicao 03D3 A', 'active'),
  ('10000000-0000-4000-8000-000000000602', 'org-03d3-b', 'Instituicao 03D3 B', 'active'),
  ('10000000-0000-4000-8000-000000000603', 'org-03d3-c', 'Instituicao 03D3 C', 'suspended');

insert into public.hospitals (id, organization_id, code, display_name, status)
values
  ('20000000-0000-4000-8000-000000000601', '10000000-0000-4000-8000-000000000601', 'hospital-03d3-a1', 'Hospital 03D3 A1', 'active'),
  ('20000000-0000-4000-8000-000000000602', '10000000-0000-4000-8000-000000000601', 'hospital-03d3-susp', 'Hospital 03D3 Suspenso', 'suspended'),
  ('20000000-0000-4000-8000-000000000603', '10000000-0000-4000-8000-000000000603', 'hospital-03d3-c', 'Hospital 03D3 C', 'active'),
  ('20000000-0000-4000-8000-000000000604', '10000000-0000-4000-8000-000000000601', 'hospital-03d3-revm', 'Hospital 03D3 Vinculo Revogado', 'active'),
  ('20000000-0000-4000-8000-000000000605', '10000000-0000-4000-8000-000000000601', 'hospital-03d3-revr', 'Hospital 03D3 Papel Revogado', 'active'),
  ('20000000-0000-4000-8000-000000000606', '10000000-0000-4000-8000-000000000602', 'hospital-03d3-b', 'Hospital 03D3 B', 'active');

-- Vinculos organizacionais ----------------------------------------------------
insert into public.organization_memberships (id, organization_id, user_id, status)
values
  ('30000000-0000-4000-8000-000000000601', '10000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000601', 'active'),
  ('30000000-0000-4000-8000-000000000602', '10000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000602', 'active'),
  ('30000000-0000-4000-8000-000000000603', '10000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000603', 'active'),
  ('30000000-0000-4000-8000-000000000604', '10000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000604', 'active'),
  ('30000000-0000-4000-8000-000000000605', '10000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000605', 'active'),
  ('30000000-0000-4000-8000-000000000606', '10000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000606', 'active');

-- Apenas o org_admin possui papel organizacional ativo (com hospitals.read).
insert into public.organization_membership_roles (organization_membership_id, role_id, status)
values
  ('30000000-0000-4000-8000-000000000602', (select id from public.roles where scope = 'organization' and code = 'organization_admin'), 'active');

-- Vinculos hospitalares -------------------------------------------------------
insert into public.hospital_memberships (id, organization_id, hospital_id, organization_membership_id, status)
values
  ('40000000-0000-4000-8000-000000000601', '10000000-0000-4000-8000-000000000601', '20000000-0000-4000-8000-000000000601', '30000000-0000-4000-8000-000000000601', 'active'),
  ('40000000-0000-4000-8000-000000000603', '10000000-0000-4000-8000-000000000601', '20000000-0000-4000-8000-000000000602', '30000000-0000-4000-8000-000000000603', 'active'),
  ('40000000-0000-4000-8000-000000000604', '10000000-0000-4000-8000-000000000603', '20000000-0000-4000-8000-000000000603', '30000000-0000-4000-8000-000000000604', 'active'),
  ('40000000-0000-4000-8000-000000000605', '10000000-0000-4000-8000-000000000601', '20000000-0000-4000-8000-000000000604', '30000000-0000-4000-8000-000000000605', 'revoked'),
  ('40000000-0000-4000-8000-000000000606', '10000000-0000-4000-8000-000000000601', '20000000-0000-4000-8000-000000000605', '30000000-0000-4000-8000-000000000606', 'active');

-- Papeis hospitalares. O cenario 6 mantem o papel ativo, mas o vinculo esta
-- revogado; o cenario 7 mantem o vinculo ativo, mas o papel esta revogado.
insert into public.hospital_membership_roles (hospital_membership_id, role_id, status, revoked_at)
values
  ('40000000-0000-4000-8000-000000000601', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000603', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000604', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000605', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000606', (select id from public.roles where scope = 'hospital' and code = 'member'), 'revoked', now());

-- A partir daqui, toda validacao roda estritamente como authenticated ---------
set local role authenticated;

-- Cenario 10: as consultas de validacao executam como authenticated.
select is(
  (select current_user)::text,
  'authenticated',
  'cenario 10: as consultas de validacao executam como authenticated'
);

-- Cenario 1: usuario hospitalar totalmente ativo -> exatamente 1 linha --------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000601', true);

select is(
  (
    select count(*)::integer
    from public.hospitals
    where id = '20000000-0000-4000-8000-000000000601'
      and organization_id = '10000000-0000-4000-8000-000000000601'
      and status = 'active'
  ),
  1,
  'cenario 1: usuario hospitalar ativo obtem exatamente 1 linha'
);

select is(
  (
    select organization_id
    from public.hospitals
    where id = '20000000-0000-4000-8000-000000000601'
      and organization_id = '10000000-0000-4000-8000-000000000601'
      and status = 'active'
  ),
  '10000000-0000-4000-8000-000000000601'::uuid,
  'cenario 1: a linha retornada traz o organization_id esperado'
);

-- Cenario 2: organization_admin de organizacao ativa -> 1 linha ---------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000602', true);

select is(
  (
    select count(*)::integer
    from public.hospitals
    where id = '20000000-0000-4000-8000-000000000601'
      and organization_id = '10000000-0000-4000-8000-000000000601'
      and status = 'active'
  ),
  1,
  'cenario 2: organization_admin obtem 1 linha do hospital da propria organizacao'
);

-- Cenario 3: hospital correto, mas organizationId de outra organizacao --------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000601', true);

select is(
  (
    select count(*)::integer
    from public.hospitals
    where id = '20000000-0000-4000-8000-000000000601'
      and organization_id = '10000000-0000-4000-8000-000000000602'
      and status = 'active'
  ),
  0,
  'cenario 3: hospital com organizationId de outra organizacao retorna 0 linhas'
);

-- Cenario 4: hospital suspenso -> 0 linhas ------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000603', true);

select is(
  (
    select count(*)::integer
    from public.hospitals
    where id = '20000000-0000-4000-8000-000000000602'
      and organization_id = '10000000-0000-4000-8000-000000000601'
      and status = 'active'
  ),
  0,
  'cenario 4: hospital suspenso retorna 0 linhas'
);

-- Cenario 5: organizacao suspensa -> 0 linhas ---------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000604', true);

select is(
  (
    select count(*)::integer
    from public.hospitals
    where id = '20000000-0000-4000-8000-000000000603'
      and organization_id = '10000000-0000-4000-8000-000000000603'
      and status = 'active'
  ),
  0,
  'cenario 5: hospital de organizacao suspensa retorna 0 linhas'
);

-- Cenario 6: vinculo hospitalar revogado -> 0 linhas --------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000605', true);

select is(
  (
    select count(*)::integer
    from public.hospitals
    where id = '20000000-0000-4000-8000-000000000604'
      and organization_id = '10000000-0000-4000-8000-000000000601'
      and status = 'active'
  ),
  0,
  'cenario 6: vinculo hospitalar revogado retorna 0 linhas'
);

-- Cenario 7 (CRITICO): papel hospitalar revogado, sem papel organizacional ----
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000606', true);

select is(
  (
    select count(*)::integer
    from public.hospitals
    where id = '20000000-0000-4000-8000-000000000605'
      and organization_id = '10000000-0000-4000-8000-000000000601'
      and status = 'active'
  ),
  0,
  'cenario 7: papel hospitalar revogado sem papel organizacional retorna 0 linhas'
);

-- Cenario 8: usuario autenticado sem vinculo institucional -> 0 linhas --------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000607', true);

select is(
  (
    select count(*)::integer
    from public.hospitals
    where id = '20000000-0000-4000-8000-000000000601'
      and organization_id = '10000000-0000-4000-8000-000000000601'
      and status = 'active'
  ),
  0,
  'cenario 8: usuario autenticado sem vinculo retorna 0 linhas'
);

-- Cenario 9: hospital de outro tenant, sem qualquer autorizacao -> 0 linhas ---
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000601', true);

select is(
  (
    select count(*)::integer
    from public.hospitals
    where id = '20000000-0000-4000-8000-000000000606'
      and organization_id = '10000000-0000-4000-8000-000000000602'
      and status = 'active'
  ),
  0,
  'cenario 9: hospital de outro tenant sem autorizacao retorna 0 linhas'
);

select * from finish();

rollback;
