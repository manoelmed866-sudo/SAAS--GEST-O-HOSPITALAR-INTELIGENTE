-- Sprint 04C.1 - Listagem da equipe do hospital sob validacao interna explicita
--
-- Responsabilidade:
-- Comprovar que public.get_hospital_team(uuid) e SECURITY DEFINER com
-- search_path vazio, EXECUTE restrito a authenticated, autorizacao explicita
-- por hospital_memberships.read (papel hospitalar OU organizacional, ativo e
-- nao revogado), fail-closed em todos os caminhos e retorno minimo
-- (display_name, membership_status, role_labels) sem UUID, e-mail ou codigo
-- cru. Nenhum bypass para platform_admin.
--
-- Estrategia anti-contaminacao:
-- Cada cenario usa entidades proprias ja inseridas no estado final desejado.
-- UUIDs deterministicos reservados a este teste (faixa ...800+).
-- Transacional com rollback: nada persiste no banco local.

begin;

select plan(24);

-- Identidades ficticias -------------------------------------------------------
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000801', 'authenticated', 'authenticated', 'member-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000802', 'authenticated', 'authenticated', 'hosp-admin-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000803', 'authenticated', 'authenticated', 'hosp-auditor-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000804', 'authenticated', 'authenticated', 'org-admin-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000805', 'authenticated', 'authenticated', 'platform-admin-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000806', 'authenticated', 'authenticated', 'no-bond-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000807', 'authenticated', 'authenticated', 'inactive-profile-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000808', 'authenticated', 'authenticated', 'susp-hm-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000809', 'authenticated', 'authenticated', 'pending-hm-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000810', 'authenticated', 'authenticated', 'revoked-hm-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000811', 'authenticated', 'authenticated', 'susp-om-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000812', 'authenticated', 'authenticated', 'revoked-role-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000813', 'authenticated', 'authenticated', 'member-a2-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000814', 'authenticated', 'authenticated', 'member-b1-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000815', 'authenticated', 'authenticated', 'admin-c1-04c@pgtap.test', 'not-real', now(), now(), now()),
  ('00000000-0000-4000-8000-000000000816', 'authenticated', 'authenticated', 'admin-a3-04c@pgtap.test', 'not-real', now(), now(), now());

insert into public.profiles (id, display_name, status)
values
  ('00000000-0000-4000-8000-000000000801', 'Membro Alfa 04C', 'active'),
  ('00000000-0000-4000-8000-000000000802', 'Admin Alfa 04C', 'active'),
  ('00000000-0000-4000-8000-000000000803', 'Auditor Alfa 04C', 'active'),
  ('00000000-0000-4000-8000-000000000804', 'Org Admin 04C', 'active'),
  ('00000000-0000-4000-8000-000000000805', 'Platform Admin 04C', 'active'),
  ('00000000-0000-4000-8000-000000000806', 'Sem Vinculo 04C', 'active'),
  ('00000000-0000-4000-8000-000000000807', 'Perfil Inativo 04C', 'suspended'),
  ('00000000-0000-4000-8000-000000000808', 'Suspenso Alfa 04C', 'active'),
  ('00000000-0000-4000-8000-000000000809', 'Pendente Alfa 04C', 'active'),
  ('00000000-0000-4000-8000-000000000810', 'Revogado Alfa 04C', 'active'),
  ('00000000-0000-4000-8000-000000000811', 'Om Suspensa Alfa 04C', 'active'),
  ('00000000-0000-4000-8000-000000000812', 'Sem Papel Alfa 04C', 'active'),
  ('00000000-0000-4000-8000-000000000813', 'Membro A2 04C', 'active'),
  ('00000000-0000-4000-8000-000000000814', 'Membro B1 04C', 'active'),
  ('00000000-0000-4000-8000-000000000815', 'Admin C1 04C', 'active'),
  ('00000000-0000-4000-8000-000000000816', 'Admin A3 04C', 'active');

-- Instituicoes ficticias ------------------------------------------------------
insert into public.organizations (id, code, display_name, status)
values
  ('10000000-0000-4000-8000-000000000801', 'org-04c-a', 'Instituicao 04C A', 'active'),
  ('10000000-0000-4000-8000-000000000802', 'org-04c-b', 'Instituicao 04C B', 'active'),
  ('10000000-0000-4000-8000-000000000803', 'org-04c-c', 'Instituicao 04C C', 'suspended');

insert into public.hospitals (id, organization_id, code, display_name, status)
values
  ('20000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', 'hospital-04c-a1', 'Hospital 04C A1', 'active'),
  ('20000000-0000-4000-8000-000000000802', '10000000-0000-4000-8000-000000000801', 'hospital-04c-a2', 'Hospital 04C A2', 'active'),
  ('20000000-0000-4000-8000-000000000803', '10000000-0000-4000-8000-000000000801', 'hospital-04c-a3', 'Hospital 04C A3 Suspenso', 'suspended'),
  ('20000000-0000-4000-8000-000000000804', '10000000-0000-4000-8000-000000000802', 'hospital-04c-b1', 'Hospital 04C B1', 'active'),
  ('20000000-0000-4000-8000-000000000805', '10000000-0000-4000-8000-000000000803', 'hospital-04c-c1', 'Hospital 04C C1', 'active'),
  ('20000000-0000-4000-8000-000000000806', '10000000-0000-4000-8000-000000000801', 'hospital-04c-a4', 'Hospital 04C A4 Vazio', 'active');

-- Vinculos organizacionais ----------------------------------------------------
insert into public.organization_memberships (id, organization_id, user_id, status)
values
  ('30000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'active'),
  ('30000000-0000-4000-8000-000000000802', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000802', 'active'),
  ('30000000-0000-4000-8000-000000000803', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000803', 'active'),
  ('30000000-0000-4000-8000-000000000804', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000804', 'active'),
  ('30000000-0000-4000-8000-000000000807', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000807', 'active'),
  ('30000000-0000-4000-8000-000000000808', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000808', 'active'),
  ('30000000-0000-4000-8000-000000000809', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000809', 'active'),
  ('30000000-0000-4000-8000-000000000810', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000810', 'active'),
  ('30000000-0000-4000-8000-000000000811', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000811', 'suspended'),
  ('30000000-0000-4000-8000-000000000812', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000812', 'active'),
  ('30000000-0000-4000-8000-000000000813', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000813', 'active'),
  ('30000000-0000-4000-8000-000000000814', '10000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000814', 'active'),
  ('30000000-0000-4000-8000-000000000815', '10000000-0000-4000-8000-000000000803', '00000000-0000-4000-8000-000000000815', 'active'),
  ('30000000-0000-4000-8000-000000000816', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000816', 'active');

-- Papeis organizacionais: org_admin (0804) e papel org 'member' para 0801,
-- provando que papel de organizacao nao vira rotulo hospitalar.
insert into public.organization_membership_roles (organization_membership_id, role_id, status)
values
  ('30000000-0000-4000-8000-000000000804', (select id from public.roles where scope = 'organization' and code = 'organization_admin'), 'active'),
  ('30000000-0000-4000-8000-000000000801', (select id from public.roles where scope = 'organization' and code = 'member'), 'active');

-- Atribuicao de plataforma: platform_admin ativo (0805), sem permissao
-- explicita de memberships.
insert into public.platform_role_assignments (user_id, role_id, status)
values
  ('00000000-0000-4000-8000-000000000805', (select id from public.roles where scope = 'platform' and code = 'platform_admin'), 'active');

-- Vinculos hospitalares -------------------------------------------------------
insert into public.hospital_memberships (id, organization_id, hospital_id, organization_membership_id, status)
values
  ('40000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '30000000-0000-4000-8000-000000000801', 'active'),
  ('40000000-0000-4000-8000-000000000802', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '30000000-0000-4000-8000-000000000802', 'active'),
  ('40000000-0000-4000-8000-000000000803', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '30000000-0000-4000-8000-000000000803', 'active'),
  ('40000000-0000-4000-8000-000000000807', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '30000000-0000-4000-8000-000000000807', 'active'),
  ('40000000-0000-4000-8000-000000000808', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '30000000-0000-4000-8000-000000000808', 'suspended'),
  ('40000000-0000-4000-8000-000000000809', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '30000000-0000-4000-8000-000000000809', 'pending'),
  ('40000000-0000-4000-8000-000000000810', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '30000000-0000-4000-8000-000000000810', 'revoked'),
  ('40000000-0000-4000-8000-000000000811', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '30000000-0000-4000-8000-000000000811', 'active'),
  ('40000000-0000-4000-8000-000000000812', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000801', '30000000-0000-4000-8000-000000000812', 'active'),
  ('40000000-0000-4000-8000-000000000813', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000802', '30000000-0000-4000-8000-000000000813', 'active'),
  ('40000000-0000-4000-8000-000000000814', '10000000-0000-4000-8000-000000000802', '20000000-0000-4000-8000-000000000804', '30000000-0000-4000-8000-000000000814', 'active'),
  ('40000000-0000-4000-8000-000000000815', '10000000-0000-4000-8000-000000000803', '20000000-0000-4000-8000-000000000805', '30000000-0000-4000-8000-000000000815', 'active'),
  ('40000000-0000-4000-8000-000000000816', '10000000-0000-4000-8000-000000000801', '20000000-0000-4000-8000-000000000803', '30000000-0000-4000-8000-000000000816', 'active');

-- Papeis hospitalares. 0802 possui DOIS papeis (duplicidade nao duplica a
-- pessoa); 0812 possui papel REVOGADO (aparece com rotulos vazios).
insert into public.hospital_membership_roles (hospital_membership_id, role_id, status, revoked_at)
values
  ('40000000-0000-4000-8000-000000000801', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000802', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active', null),
  ('40000000-0000-4000-8000-000000000802', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000803', (select id from public.roles where scope = 'hospital' and code = 'auditor'), 'active', null),
  ('40000000-0000-4000-8000-000000000807', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active', null),
  ('40000000-0000-4000-8000-000000000808', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000809', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000810', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000811', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000812', (select id from public.roles where scope = 'hospital' and code = 'member'), 'revoked', now()),
  ('40000000-0000-4000-8000-000000000813', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000814', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active', null),
  ('40000000-0000-4000-8000-000000000815', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active', null),
  ('40000000-0000-4000-8000-000000000816', (select id from public.roles where scope = 'hospital' and code = 'hospital_admin'), 'active', null);

-- === Assercoes estruturais (como owner) =======================================

select has_function(
  'public',
  'get_hospital_team',
  ARRAY['uuid'],
  'a funcao existe com a assinatura (uuid) esperada'
);

select is(
  (
    select p.prosecdef
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_hospital_team'
  ),
  true,
  'a funcao e SECURITY DEFINER (prosecdef = true), com validacao interna explicita'
);

select is(
  (
    select p.provolatile
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_hospital_team'
  ),
  's',
  'a funcao e STABLE, somente leitura'
);

select is(
  (
    select array_to_string(p.proconfig, ',')
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_hospital_team'
  ),
  'search_path=""',
  'a funcao fixa search_path vazio'
);

select is(
  (
    select pg_catalog.pg_get_function_result(p.oid)
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_hospital_team'
  ),
  'TABLE(display_name text, membership_status text, role_labels text[], management_ref text, can_suspend boolean, can_reactivate boolean, assigned_roles jsonb)',
  'retorno minimo da 04C.1 estendido pela 04C.2/fechamento com metadados de acao e papeis administraveis; sem UUID e sem e-mail'
);

select function_privs_are(
  'public', 'get_hospital_team', ARRAY['uuid'], 'public', ARRAY[]::text[],
  'PUBLIC nao possui EXECUTE na funcao'
);

select function_privs_are(
  'public', 'get_hospital_team', ARRAY['uuid'], 'anon', ARRAY[]::text[],
  'anon nao possui EXECUTE na funcao'
);

select function_privs_are(
  'public', 'get_hospital_team', ARRAY['uuid'], 'authenticated', ARRAY['EXECUTE'],
  'authenticated possui EXECUTE na funcao'
);

-- === A partir daqui, tudo roda estritamente como authenticated ===============
set local role authenticated;

-- Cenario: member sem hospital_memberships.read -> zero linhas (fail-closed).
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000801', true);
select is(
  (select count(*) from public.get_hospital_team('20000000-0000-4000-8000-000000000801')),
  0::bigint,
  'member sem hospital_memberships.read nao recebe a lista'
);

-- Cenario: hospital_admin le a equipe completa, ordenada e com status/rotulos
-- corretos. Cobre: suspended aparece como suspended; pending aparece; revoked
-- nao aparece; om suspensa nao aparece; perfil inativo nao aparece; papel
-- revogado gera rotulos vazios; dois papeis nao duplicam a pessoa; papel de
-- organizacao nao vira rotulo hospitalar.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000802', true);
select results_eq(
  $$ select display_name, membership_status, role_labels
     from public.get_hospital_team('20000000-0000-4000-8000-000000000801') $$,
  $$ values
     ('Admin Alfa 04C', 'active', array['Administrador hospitalar', 'Membro hospitalar']::text[]),
     ('Auditor Alfa 04C', 'active', array['Auditor hospitalar']::text[]),
     ('Membro Alfa 04C', 'active', array['Membro hospitalar']::text[]),
     ('Pendente Alfa 04C', 'pending', array['Membro hospitalar']::text[]),
     ('Sem Papel Alfa 04C', 'active', array[]::text[]),
     ('Suspenso Alfa 04C', 'suspended', array['Membro hospitalar']::text[]) $$,
  'hospital_admin le a equipe completa, ordenada por display_name, com status e rotulos corretos'
);

-- Cenario: auditor hospitalar tambem le a equipe (somente leitura).
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000803', true);
select is(
  (select count(*) from public.get_hospital_team('20000000-0000-4000-8000-000000000801')),
  6::bigint,
  'auditor hospitalar le a equipe do proprio hospital'
);

-- Cenario: papel revogado nao aparece em role_labels (rotulos vazios).
select is(
  (select role_labels from public.get_hospital_team('20000000-0000-4000-8000-000000000801')
   where display_name = 'Sem Papel Alfa 04C'),
  array[]::text[],
  'papel hospitalar revogado nao gera rotulo'
);

-- Cenario: membro com dois papeis aparece uma unica vez.
select is(
  (select count(*) from public.get_hospital_team('20000000-0000-4000-8000-000000000801')
   where display_name = 'Admin Alfa 04C'),
  1::bigint,
  'duplicidade de papeis nao duplica a pessoa'
);

-- Cenario: rotulos usam roles.display_name, nunca role.code.
select is(
  (select bool_or(label in ('hospital_admin', 'member', 'auditor'))
   from public.get_hospital_team('20000000-0000-4000-8000-000000000801'),
        unnest(role_labels) as label),
  false,
  'role_labels contem apenas nomes amigaveis, nunca codigos crus'
);

-- Cenario: organization_admin le hospital da propria organizacao.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000804', true);
select is(
  (select count(*) from public.get_hospital_team('20000000-0000-4000-8000-000000000801')),
  6::bigint,
  'organization_admin le a equipe de hospital da propria organizacao'
);

-- Cenario: organization_admin tambem le outro hospital da mesma organizacao.
select results_eq(
  $$ select display_name, membership_status, role_labels
     from public.get_hospital_team('20000000-0000-4000-8000-000000000802') $$,
  $$ values ('Membro A2 04C', 'active', array['Membro hospitalar']::text[]) $$,
  'organization_admin le a equipe de outro hospital da mesma organizacao'
);

-- Cenario: lista vazia e valida (hospital ativo autorizado sem membros).
select is(
  (select count(*) from public.get_hospital_team('20000000-0000-4000-8000-000000000806')),
  0::bigint,
  'hospital autorizado sem membros retorna lista vazia sem erro'
);

-- Cenario: isolamento entre hospitais da mesma organizacao (papel hospitalar
-- nao alcanca outro hospital).
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000802', true);
select is(
  (select count(*) from public.get_hospital_team('20000000-0000-4000-8000-000000000802')),
  0::bigint,
  'hospital_admin de A1 nao le a equipe de A2'
);

-- Cenario: isolamento entre organizacoes.
select is(
  (select count(*) from public.get_hospital_team('20000000-0000-4000-8000-000000000804')),
  0::bigint,
  'hospital_admin de A1 nao le hospital de outra organizacao'
);

-- Cenario: platform_admin sem permissao explicita de memberships -> zero linhas.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000805', true);
select is(
  (select count(*) from public.get_hospital_team('20000000-0000-4000-8000-000000000801')),
  0::bigint,
  'platform_admin nao recebe a lista sem permissao explicita (sem bypass)'
);

-- Cenario: usuario sem vinculo -> zero linhas.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000806', true);
select is(
  (select count(*) from public.get_hospital_team('20000000-0000-4000-8000-000000000801')),
  0::bigint,
  'usuario sem vinculo nao recebe a lista'
);

-- Cenario: chamador com perfil inativo -> zero linhas, mesmo com papel admin.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000807', true);
select is(
  (select count(*) from public.get_hospital_team('20000000-0000-4000-8000-000000000801')),
  0::bigint,
  'chamador com perfil inativo nao recebe a lista'
);

-- Cenario: hospital inativo -> zero linhas, mesmo para admin daquele hospital.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000816', true);
select is(
  (select count(*) from public.get_hospital_team('20000000-0000-4000-8000-000000000803')),
  0::bigint,
  'hospital inativo nao retorna equipe'
);

-- Cenario: organizacao inativa -> zero linhas, mesmo com hospital ativo.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000815', true);
select is(
  (select count(*) from public.get_hospital_team('20000000-0000-4000-8000-000000000805')),
  0::bigint,
  'organizacao inativa nao retorna equipe'
);

select * from finish();

rollback;
