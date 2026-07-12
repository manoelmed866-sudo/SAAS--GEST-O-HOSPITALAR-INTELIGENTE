-- Sprint 03A - Funcoes privadas de autorizacao
--
-- Responsabilidade:
-- Criar funcoes booleanas minimas para reduzir recursao nas politicas RLS.
--
-- Dependencias:
-- - Modelo institucional da Sprint 03A.
-- - Papeis, permissoes e mapeamentos estruturais.
--
-- Limites:
-- - Nenhuma funcao retorna registros institucionais.
-- - Nenhuma funcao confia em claims customizadas como fonte unica.
-- - Nenhum dado real.

grant usage on schema app_private to authenticated;
revoke create on schema app_private from authenticated;

create or replace function app_private.current_profile_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
  );
$$;

create or replace function app_private.current_user_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.platform_role_assignments pra
      on pra.user_id = p.id
     and pra.status = 'active'
     and pra.revoked_at is null
    join public.roles r
      on r.id = pra.role_id
     and r.scope = pra.role_scope
     and r.scope = 'platform'
     and r.code = 'platform_admin'
    where p.id = auth.uid()
      and p.status = 'active'
  );
$$;

create or replace function app_private.current_user_has_organization_permission(
  target_organization_id uuid,
  permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.organization_memberships om
      on om.user_id = p.id
     and om.status = 'active'
    join public.organizations o
      on o.id = om.organization_id
     and o.status = 'active'
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
    where p.id = auth.uid()
      and p.status = 'active'
      and om.organization_id = target_organization_id
      and perm.code = permission_code
  );
$$;

create or replace function app_private.current_user_has_hospital_permission(
  target_hospital_id uuid,
  permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.organization_memberships om
      on om.user_id = p.id
     and om.status = 'active'
    join public.organizations o
      on o.id = om.organization_id
     and o.status = 'active'
    join public.hospital_memberships hm
      on hm.organization_membership_id = om.id
     and hm.organization_id = om.organization_id
     and hm.status = 'active'
    join public.hospitals h
      on h.id = hm.hospital_id
     and h.organization_id = hm.organization_id
     and h.status = 'active'
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
    where p.id = auth.uid()
      and p.status = 'active'
      and hm.hospital_id = target_hospital_id
      and perm.code = permission_code
  );
$$;

create or replace function app_private.current_user_can_view_profile(
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_user_id = auth.uid()
    or app_private.current_user_is_platform_admin()
    or exists (
      select 1
      from public.organization_memberships target_om
      where target_om.user_id = target_user_id
        and app_private.current_user_has_organization_permission(
          target_om.organization_id,
          'organization_memberships.read'
        )
    )
    or exists (
      select 1
      from public.organization_memberships target_om
      join public.hospital_memberships target_hm
        on target_hm.organization_membership_id = target_om.id
      where target_om.user_id = target_user_id
        and app_private.current_user_has_hospital_permission(
          target_hm.hospital_id,
          'hospital_memberships.read'
        )
    );
$$;

revoke all on function app_private.current_profile_is_active() from public;
revoke all on function app_private.current_profile_is_active() from anon;
grant execute on function app_private.current_profile_is_active() to authenticated;

revoke all on function app_private.current_user_is_platform_admin() from public;
revoke all on function app_private.current_user_is_platform_admin() from anon;
grant execute on function app_private.current_user_is_platform_admin() to authenticated;

revoke all on function app_private.current_user_has_organization_permission(uuid, text) from public;
revoke all on function app_private.current_user_has_organization_permission(uuid, text) from anon;
grant execute on function app_private.current_user_has_organization_permission(uuid, text) to authenticated;

revoke all on function app_private.current_user_has_hospital_permission(uuid, text) from public;
revoke all on function app_private.current_user_has_hospital_permission(uuid, text) from anon;
grant execute on function app_private.current_user_has_hospital_permission(uuid, text) to authenticated;

revoke all on function app_private.current_user_can_view_profile(uuid) from public;
revoke all on function app_private.current_user_can_view_profile(uuid) from anon;
grant execute on function app_private.current_user_can_view_profile(uuid) to authenticated;
