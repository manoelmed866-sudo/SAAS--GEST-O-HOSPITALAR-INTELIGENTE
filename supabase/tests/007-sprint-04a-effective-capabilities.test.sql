-- Sprint 04A - Capacidades efetivas do hospital ativo sob RLS real
--
-- Responsabilidade:
-- Comprovar, como authenticated e sob RLS, que
-- public.get_effective_hospital_capabilities(uuid) combina os tres escopos
-- (plataforma, organizacao e hospital) por uniao monotonica, sempre retornando
-- exatamente uma linha com cinco booleanos, sem vazar entre hospitais e sem
-- conceder capacidades por papel/vinculo revogado, suspenso ou inativo.
--
-- Estrategia anti-contaminacao:
-- Cada cenario usa entidades proprias ja inseridas no estado final desejado.
-- Nenhum status e mutado no meio do teste.
--
-- Limites:
-- - Nenhuma tabela clinica, dado real, papel clinico ou senha real.
-- - Nenhum service role; toda avaliacao roda como authenticated.
-- - UUIDs deterministicos reservados a este teste (faixa ...700+).
-- - Transacional com rollback: nada persiste no banco local.

begin;

select plan(21);

-- Identidades ficticias -------------------------------------------------------
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000701', 'authenticated', 'authenticated', 'hosp-member-04a@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000702', 'authenticated', 'authenticated', 'hosp-admin-04a@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000703', 'authenticated', 'authenticated', 'hosp-auditor-04a@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000704', 'authenticated', 'authenticated', 'org-admin-04a@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000705', 'authenticated', 'authenticated', 'platform-admin-04a@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000706', 'authenticated', 'authenticated', 'revoked-role-04a@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000707', 'authenticated', 'authenticated', 'revoked-plat-04a@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000708', 'authenticated', 'authenticated', 'susp-membership-04a@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000709', 'authenticated', 'authenticated', 'dual-04a@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000710', 'authenticated', 'authenticated', 'no-bond-04a@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000712', 'authenticated', 'authenticated', 'inactive-hosp-04a@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000713', 'authenticated', 'authenticated', 'inactive-org-04a@pgtap.test', 'not-real', now(), now(), now());

insert into public.profiles (id, display_name, status)
values
  ('00000000-0000-4000-8000-000000000701', 'Hosp Member 04A Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000702', 'Hosp Admin 04A Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000703', 'Hosp Auditor 04A Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000704', 'Org Admin 04A Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000705', 'Platform Admin 04A Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000706', 'Revoked Role 04A Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000707', 'Revoked Plat 04A Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000708', 'Susp Membership 04A Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000709', 'Dual 04A Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000710', 'No Bond 04A Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000712', 'Inactive Hosp 04A Ficticio', 'active'),
  ('00000000-0000-4000-8000-000000000713', 'Inactive Org 04A Ficticio', 'active');

-- Instituicoes ficticias ------------------------------------------------------
insert into public.organizations (id, code, display_name, status)
values
  ('10000000-0000-4000-8000-000000000701', 'org-04a-a', 'Instituicao 04A A', 'active'),
  ('10000000-0000-4000-8000-000000000702', 'org-04a-b', 'Instituicao 04A B', 'active'),
  ('10000000-0000-4000-8000-000000000703', 'org-04a-c', 'Instituicao 04A C', 'suspended');

insert into public.hospitals (id, organization_id, code, display_name, status)
values
  ('20000000-0000-4000-8000-000000000701', '10000000-0000-4000-8000-000000000701', 'hospital-04a-a1', 'Hospital 04A A1', 'active'),
  ('20000000-0000-4000-8000-000000000702', '10000000-0000-4000-8000-000000000701', 'hospital-04a-a2', 'Hospital 04A A2', 'active'),
  ('20000000-0000-4000-8000-000000000703', '10000000-0000-4000-8000-000000000701', 'hospital-04a-asusp', 'Hospital 04A A Suspenso', 'suspended'),
  ('20000000-0000-4000-8000-000000000704', '10000000-0000-4000-8000-000000000702', 'hospital-04a-b1', 'Hospital 04A B1', 'active'),
  ('20000000-0000-4000-8000-000000000705', '10000000-0000-4000-8000-000000000703', 'hospital-04a-c1', 'Hospital 04A C1', 'active');

-- Vinculos organizacionais ----------------------------------------------------
insert into public.organization_memberships (id, organization_id, user_id, status)
values
  ('30000000-0000-4000-8000-000000000701', '10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000701', 'active'),
  ('30000000-0000-4000-8000-000000000702', '10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000702', 'active'),
  ('30000000-0000-4000-8000-000000000703', '10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000703', 'active'),
  ('30000000-0000-4000-8000-000000000704', '10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000704', 'active'),
  ('30000000-0000-4000-8000-000000000706', '10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000706', 'active'),
  ('30000000-0000-4000-8000-000000000708', '10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000708', 'active'),
  ('30000000-0000-4000-8000-000000000709', '10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000709', 'active'),
  ('30000000-0000-4000-8000-000000000712', '10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000712', 'active'),
  ('30000000-0000-4000-8000-000000000713', '10000000-0000-4000-8000-000000000703', '00000000-0000-4000-8000-000000000713', 'active');

-- Papeis organizacionais: org_admin (0704) e o usuario dual (0709).
insert into public.organization_membership_roles (organization_membership_id, role_id, status)
values
  ('30000000-0000-4000-8000-000000000704', (select id from public.roles where scope = 'organization' and code = 'organization_admin'), 'active'),
  ('30000000-0000-4000-8000-000000000709', (select id from public.roles where scope = 'organization' and code = 'organization_admin'), 'active');

-- Atribuicoes de plataforma: ativo (0705) e revogado (0707).
insert into public.platform_role_assignments (user_id, role_id, status, revoked_at)
values
  ('00000000-0000-4000-8000-000000000705', (select id from public.roles where scope = 'platform' and code = 'platform_admin'), 'active', null),
  ('00000000-0000-4000-8000-000000000707', (select id from public.roles where scope = 'platform' and code = 'platform_admin'), 'revoked', now());

-- Vinculos hospitalares -------------------------------------------------------
insert into public.hospital_memberships (id, organization_id, hospital_id, organization_membership_id, status)
values
  ('40000000-0000-4000-8000-000000000701', '10000000-0000-4000-8000-000000000701', '20000000-0000-4000-8000-000000000701', '30000000-0000-4000-8000-000000000701', 'active'),
  ('40000000-0000-4000-8000-000000000702', '10000000-0000-4000-8000-000000000701', '20000000-0000-4000-8000-000000000701', '30000000-0000-4000-8000-000000000702', 'active'),
  ('40000000-0000-4000-8000-000000000703', '10000000-0000-4000-8000-000000000701', '20000000-0000-4000-8000-000000000701', '30000000-0000-4000-8000-000000000703', 'active'),
  ('40000000-0000-4000-8000-000000000706', '10000000-0000-4000-8000-000000000701', '20000000-0000-4000-8000-000000000702', '30000000-0000-4000-8000-000000000706', 'active'),
  ('40000000-0000-4000-8000-000000000708', '10000000-0000-4000-8000-000000000701', '20000000-0000-4000-8000-000000000701', '30000000-0000-4000-8000-000000000708', 'suspended'),
  ('40000000-0000-4000-8000-000000000709', '10000000-0000-4000-8000-000000000701', '20000000-0000-4000-8000-000000000701', '30000000-0000-4000-8000-000000000709', 'active'),
  ('40000000-0000-4000-8000-000000000712', '10000000-0000-4000-8000-000000000701', '20000000-0000-4000-8000-000000000703', '30000000-0000-4000-8000-000000000712', 'active'),
  ('40000000-0000-4000-8000-000000000713', '10000000-0000-4000-8000-000000000703', '20000000-0000-4000-8000-000000000705', '30000000-0000-4000-8000-000000000713', 'active');

-- Papeis hospitalares. Cenario revogado (0706) mantem vinculo ativo e papel
-- revogado; suspensa (0708) mantem papel ativo e vinculo suspenso.
insert into public.hospital_membership_roles (hospital_membership_id, role_id, status, revoked_at)
values
  ('40000000-0000-4000-8000-000000000701', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000702', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active', null),
  ('40000000-0000-4000-8000-000000000703', (select id from public.roles where scope = 'hospital' and code = 'auditor'), 'active', null),
  ('40000000-0000-4000-8000-000000000706', (select id from public.roles where scope = 'hospital' and code = 'member'), 'revoked', now()),
  ('40000000-0000-4000-8000-000000000708', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000709', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000712', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000713', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null);

-- === Assercoes estruturais (como owner, antes de trocar para authenticated) ===

select has_function(
  'public',
  'get_effective_hospital_capabilities',
  ARRAY['uuid'],
  'a funcao existe com a assinatura (uuid) esperada'
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
  'a funcao e SECURITY INVOKER (prosecdef = false)'
);

select function_privs_are(
  'public',
  'get_effective_hospital_capabilities',
  ARRAY['uuid'],
  'anon',
  ARRAY[]::text[],
  'anon nao possui EXECUTE na funcao'
);

select function_privs_are(
  'public',
  'get_effective_hospital_capabilities',
  ARRAY['uuid'],
  'authenticated',
  ARRAY['EXECUTE'],
  'authenticated possui EXECUTE na funcao'
);

-- === A partir daqui, tudo roda estritamente como authenticated ===============
set local role authenticated;

-- Cenario: usuario hospital-only member -> apenas leitura de hospital e troca.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000701') $$,
  $$ values (true, false, false, false, true) $$,
  'hospital member: can_read_hospital e can_switch_context apenas'
);

-- Cenario: hospital_admin -> read/manage memberships, sem audit.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000702', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000701') $$,
  $$ values (true, true, true, false, true) $$,
  'hospital_admin: read/manage memberships, sem audit'
);

-- Cenario: auditor hospitalar -> audit.read, sem manage.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000703', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000701') $$,
  $$ values (true, true, false, true, true) $$,
  'auditor hospitalar: audit.read presente, manage ausente'
);

-- Cenario: organization_admin aplica-se a hospital da propria organizacao.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000704', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000701') $$,
  $$ values (true, true, true, false, true) $$,
  'organization_admin: capacidades aplicadas ao hospital da mesma organizacao'
);

-- Cenario: papel organizacional NAO se aplica a hospital de outra organizacao.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000704', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000704') $$,
  $$ values (false, false, false, false, false) $$,
  'organization_admin: nenhuma capacidade em hospital de outra organizacao'
);

-- Cenario: papel hospitalar NAO se aplica a outro hospital.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000702') $$,
  $$ values (false, false, false, false, false) $$,
  'hospital member: nenhuma capacidade em outro hospital sem vinculo'
);

-- Cenario: platform_admin -> apenas can_read_hospital (permissao platform hospitals.read).
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000705', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000701') $$,
  $$ values (true, false, false, false, false) $$,
  'platform_admin: apenas can_read_hospital derivada de hospitals.read platform'
);

-- Cenario: papel hospitalar revogado -> nenhuma capacidade.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000706', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000702') $$,
  $$ values (false, false, false, false, false) $$,
  'papel hospitalar revogado nao concede capacidade'
);

-- Cenario: atribuicao de plataforma revogada -> nenhuma capacidade.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000707', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000701') $$,
  $$ values (false, false, false, false, false) $$,
  'atribuicao de plataforma revogada nao concede capacidade'
);

-- Cenario: membership hospitalar suspensa -> nenhuma capacidade.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000708', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000701') $$,
  $$ values (false, false, false, false, false) $$,
  'membership hospitalar suspensa nao concede capacidade'
);

-- Cenario: hospital inativo -> nenhuma capacidade.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000712', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000703') $$,
  $$ values (false, false, false, false, false) $$,
  'hospital inativo nao produz capacidades'
);

-- Cenario: organizacao inativa (hospital-only) -> nenhuma capacidade.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000713', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000705') $$,
  $$ values (false, false, false, false, false) $$,
  'organizacao inativa nao produz capacidades'
);

-- Cenario: duplicidade entre escopos (org_admin + hospital member) nao altera resultado.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000709', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000701') $$,
  $$ values (true, true, true, false, true) $$,
  'duplicidade entre escopos nao altera o resultado (booleanos permanecem)'
);

-- Cenario: usuario sem vinculo -> todas false.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000710', true);
select results_eq(
  $$ select can_read_hospital, can_read_memberships, can_manage_memberships, can_read_audit, can_switch_context
     from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000701') $$,
  $$ values (false, false, false, false, false) $$,
  'usuario sem vinculo recebe todas as capacidades como false'
);

-- Cenario: resultado sempre com exatamente uma linha (usuario sem vinculo).
select is(
  (select count(*)::integer from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000701')),
  1,
  'usuario sem vinculo ainda recebe exatamente uma linha'
);

-- Cenario: resultado sempre com exatamente uma linha (usuario com vinculo ativo).
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);
select is(
  (select count(*)::integer from public.get_effective_hospital_capabilities('20000000-0000-4000-8000-000000000701')),
  1,
  'usuario com vinculo ativo recebe exatamente uma linha'
);

-- Cenario: as consultas de capacidade executam como authenticated.
select is(
  (select current_user)::text,
  'authenticated',
  'as consultas de capacidade executam como authenticated'
);

select * from finish();

rollback;
