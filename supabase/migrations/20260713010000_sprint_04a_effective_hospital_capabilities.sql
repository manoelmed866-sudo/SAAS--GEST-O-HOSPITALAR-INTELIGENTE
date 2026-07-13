-- Sprint 04A - Capacidades efetivas do hospital ativo (contrato SQL)
--
-- Responsabilidade:
-- Expor, para um hospital alvo, as capacidades semanticas efetivas do usuario
-- atual, combinando os tres escopos de autorizacao (plataforma, organizacao e
-- hospital) por uniao monotonica. A funcao devolve exatamente cinco booleanos e
-- sempre uma unica linha; nunca devolve papeis, codigos de permissao, UUIDs
-- adicionais ou dados de outro hospital.
--
-- Estrategia de seguranca (primeira tentativa, SECURITY INVOKER):
-- - SECURITY INVOKER explicito: a funcao roda sob o usuario chamador e o RLS da
--   Sprint 03A permanece aplicavel a cada tabela lida.
-- - O escopo HOSPITAL nao le public.organizations. O gate "organizacao ativa"
--   para o caso hospital-only e garantido de forma transitiva pela propria
--   visibilidade do hospital sob RLS: a policy de public.hospitals delega a
--   app_private.current_user_has_hospital_permission, que ja exige organizacao
--   ativa, hospital ativo, vinculo e papel ativos. Assim, um usuario hospital-only
--   (sem organization.read) nao precisa ler organizations para ser avaliado.
-- - Os escopos PLATAFORMA e ORGANIZACAO leem public.organizations com
--   status = 'active' (esses papeis ja possuem leitura de organizations sob RLS),
--   tornando o gate de organizacao ativa explicito para eles.
--
-- Limites:
-- - Nenhuma capacidade e concedida por inferencia do nome do papel.
-- - platform_admin NAO recebe todas as capacidades automaticamente: apenas as
--   derivadas de permissoes de escopo plataforma explicitamente atribuidas.
-- - Nenhuma alteracao de RLS, grants de tabela, roles ou permissions semeadas.

create or replace function public.get_effective_hospital_capabilities(
  target_hospital_id uuid
)
returns table (
  can_read_hospital boolean,
  can_read_memberships boolean,
  can_manage_memberships boolean,
  can_read_audit boolean,
  can_switch_context boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with
  -- Hospital alvo ativo e visivel sob RLS. Para papeis nao-plataforma, a
  -- visibilidade ja implica organizacao proprietaria ativa (gate transitivo).
  target as (
    select h.id as hospital_id, h.organization_id
    from public.hospitals h
    where h.id = target_hospital_id
      and h.status = 'active'
  ),
  -- Escopo PLATAFORMA: exige organizacao proprietaria ativa e visivel.
  platform_perms as (
    select perm.code
    from target t
    join public.organizations o
      on o.id = t.organization_id
     and o.status = 'active'
    join public.platform_role_assignments pra
      on pra.user_id = auth.uid()
     and pra.status = 'active'
     and pra.revoked_at is null
    join public.roles r
      on r.id = pra.role_id
     and r.scope = pra.role_scope
     and r.scope = 'platform'
    join public.role_permissions rp
      on rp.role_id = r.id
     and rp.scope = r.scope
    join public.permissions perm
      on perm.id = rp.permission_id
     and perm.scope = rp.scope
  ),
  -- Escopo ORGANIZACAO: papel organizacional na organizacao proprietaria do
  -- hospital alvo. Aplica-se a qualquer hospital ativo daquela organizacao.
  organization_perms as (
    select perm.code
    from target t
    join public.organizations o
      on o.id = t.organization_id
     and o.status = 'active'
    join public.organization_memberships om
      on om.organization_id = o.id
     and om.user_id = auth.uid()
     and om.status = 'active'
    join public.organization_membership_roles omr
      on omr.organization_membership_id = om.id
     and omr.status = 'active'
     and omr.revoked_at is null
    join public.roles r
      on r.id = omr.role_id
     and r.scope = omr.role_scope
     and r.scope = 'organization'
    join public.role_permissions rp
      on rp.role_id = r.id
     and rp.scope = r.scope
    join public.permissions perm
      on perm.id = rp.permission_id
     and perm.scope = rp.scope
  ),
  -- Escopo HOSPITAL: papel hospitalar no hospital alvo. Nao le organizations.
  hospital_perms as (
    select perm.code
    from target t
    join public.hospital_memberships hm
      on hm.hospital_id = t.hospital_id
     and hm.organization_id = t.organization_id
     and hm.status = 'active'
    join public.organization_memberships om
      on om.id = hm.organization_membership_id
     and om.user_id = auth.uid()
     and om.status = 'active'
    join public.hospital_membership_roles hmr
      on hmr.hospital_membership_id = hm.id
     and hmr.status = 'active'
     and hmr.revoked_at is null
    join public.roles r
      on r.id = hmr.role_id
     and r.scope = hmr.role_scope
     and r.scope = 'hospital'
    join public.role_permissions rp
      on rp.role_id = r.id
     and rp.scope = r.scope
    join public.permissions perm
      on perm.id = rp.permission_id
     and perm.scope = rp.scope
  ),
  -- Uniao monotonica dos tres escopos, preservando o escopo de cada permissao
  -- para desambiguar codigos que existem em mais de um escopo.
  effective as (
    select 'platform'::text as scope, code from platform_perms
    union all
    select 'organization'::text as scope, code from organization_perms
    union all
    select 'hospital'::text as scope, code from hospital_perms
  )
  select
    coalesce(bool_or(
      (scope in ('platform', 'organization') and code = 'hospitals.read')
      or (scope = 'hospital' and code = 'hospital.read')
    ), false) as can_read_hospital,
    coalesce(bool_or(
      scope in ('organization', 'hospital') and code = 'hospital_memberships.read'
    ), false) as can_read_memberships,
    coalesce(bool_or(
      scope in ('organization', 'hospital') and code = 'hospital_memberships.manage'
    ), false) as can_manage_memberships,
    coalesce(bool_or(
      scope in ('organization', 'hospital') and code = 'audit.read'
    ), false) as can_read_audit,
    coalesce(bool_or(
      scope in ('organization', 'hospital') and code = 'context.switch'
    ), false) as can_switch_context
  from effective;
$$;

-- Grants explicitos: nenhum acesso para public/anon; apenas authenticated executa.
revoke execute on function public.get_effective_hospital_capabilities(uuid) from public;
revoke execute on function public.get_effective_hospital_capabilities(uuid) from anon;
grant execute on function public.get_effective_hospital_capabilities(uuid) to authenticated;
