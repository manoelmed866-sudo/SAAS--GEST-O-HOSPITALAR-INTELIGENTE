-- Sprint 03C - Regressao de acesso hospitalar (usuario hospital-only)
--
-- Responsabilidade:
-- Garantir, sob RLS real como authenticated, que um usuario hospital-only
-- (perfil ativo, vinculo de organizacao ativo, vinculo hospitalar ativo, papel
-- hospital/member ativo e SEM nenhum organization_membership_role) consegue ser
-- reconhecido pela consulta hospitalar usada pela aplicacao em
-- src/lib/auth/access.ts (getPortalAccess -> hasHospitalAccess).
--
-- Contexto do defeito corrigido:
-- A consulta original embutia organizations!inner. A tabela public.organizations
-- so libera SELECT para papeis de escopo organizacao (organization.read), entao
-- um usuario hospital-only tinha a linha de organizations bloqueada pelo RLS e,
-- por ser join interno, o vinculo hospitalar inteiro sumia -> acesso negado.
--
-- Limites:
-- - Nenhuma tabela clinica, dado real ou papel clinico.
-- - Nao valida a plataforma nem o gate organizacional (cobertos em 003).

begin;

select plan(3);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000000003c1', 'authenticated', 'authenticated', 'hosp-only-03c@pgtap.test', 'not-real', now(), now(), now());

insert into public.profiles (id, display_name, status)
values
  ('00000000-0000-4000-8000-0000000003c1', 'Hospital Only Ficticio', 'active');

insert into public.organizations (id, code, display_name, status)
values
  ('10000000-0000-4000-8000-0000000003c1', 'org-03c-hosp', 'Instituicao 03C Hospital', 'active');

insert into public.hospitals (id, organization_id, code, display_name, status)
values
  ('20000000-0000-4000-8000-0000000003c1', '10000000-0000-4000-8000-0000000003c1', 'hospital-03c', 'Hospital 03C', 'active');

-- Vinculo organizacional ativo, porem SEM organization_membership_role.
insert into public.organization_memberships (id, organization_id, user_id, status)
values
  ('30000000-0000-4000-8000-0000000003c1', '10000000-0000-4000-8000-0000000003c1', '00000000-0000-4000-8000-0000000003c1', 'active');

insert into public.hospital_memberships (id, organization_id, hospital_id, organization_membership_id, status)
values
  ('40000000-0000-4000-8000-0000000003c1', '10000000-0000-4000-8000-0000000003c1', '20000000-0000-4000-8000-0000000003c1', '30000000-0000-4000-8000-0000000003c1', 'active');

insert into public.hospital_membership_roles (hospital_membership_id, role_id, status)
values
  ('40000000-0000-4000-8000-0000000003c1', (select id from public.roles where scope = 'hospital' and code = 'member'), 'active');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000003c1', true);

-- Equivalente SQL da consulta da aplicacao (hasHospitalAccess): mesmos joins
-- internos e filtros, sem tocar em public.organizations. Cada tabela abaixo
-- passa pelo RLS individualmente, replicando o comportamento dos embeds !inner
-- do PostgREST.
select is(
  (
    select count(*)::integer
    from public.hospital_memberships hm
    join public.hospitals h
      on h.id = hm.hospital_id
     and h.status = 'active'
    join public.organization_memberships om
      on om.id = hm.organization_membership_id
     and om.user_id = auth.uid()
     and om.status = 'active'
    join public.hospital_membership_roles hmr
      on hmr.hospital_membership_id = hm.id
     and hmr.status = 'active'
     and hmr.role_scope = 'hospital'
    join public.roles r
      on r.id = hmr.role_id
     and r.scope = 'hospital'
    where hm.status = 'active'
  ),
  1,
  'usuario hospital-only e reconhecido pela consulta hospitalar da aplicacao'
);

-- Regressao explicita: se a consulta voltasse a embutir organizations!inner, o
-- RLS de organizations bloquearia a linha e o resultado cairia para 0.
select is(
  (
    select count(*)::integer
    from public.hospital_memberships hm
    join public.hospitals h
      on h.id = hm.hospital_id
     and h.status = 'active'
    join public.organization_memberships om
      on om.id = hm.organization_membership_id
     and om.user_id = auth.uid()
     and om.status = 'active'
    join public.organizations o
      on o.id = om.organization_id
     and o.status = 'active'
    join public.hospital_membership_roles hmr
      on hmr.hospital_membership_id = hm.id
     and hmr.status = 'active'
     and hmr.role_scope = 'hospital'
    join public.roles r
      on r.id = hmr.role_id
     and r.scope = 'hospital'
    where hm.status = 'active'
  ),
  0,
  'embed de organizations bloquearia o usuario hospital-only (defeito corrigido)'
);

-- Organizacao suspensa deve continuar bloqueando o acesso hospitalar, mesmo sem
-- o embed de organizations: o RLS de hospitals depende de
-- current_user_has_hospital_permission, que exige organizacao ativa.
reset role;
update public.organizations
set status = 'suspended'
where id = '10000000-0000-4000-8000-0000000003c1';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000003c1', true);

select is(
  (
    select count(*)::integer
    from public.hospital_memberships hm
    join public.hospitals h
      on h.id = hm.hospital_id
     and h.status = 'active'
    join public.organization_memberships om
      on om.id = hm.organization_membership_id
     and om.user_id = auth.uid()
     and om.status = 'active'
    join public.hospital_membership_roles hmr
      on hmr.hospital_membership_id = hm.id
     and hmr.status = 'active'
     and hmr.role_scope = 'hospital'
    join public.roles r
      on r.id = hmr.role_id
     and r.scope = 'hospital'
    where hm.status = 'active'
  ),
  0,
  'organizacao suspensa continua bloqueando o acesso hospitalar'
);

select * from finish();

rollback;
