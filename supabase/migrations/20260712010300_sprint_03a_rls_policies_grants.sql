-- Sprint 03A - RLS, politicas e grants minimos
--
-- Responsabilidade:
-- Habilitar RLS nas 11 tabelas publicas da Sprint 03A, criar politicas por
-- operacao e configurar grants explicitos.
--
-- Dependencias:
-- - Modelo institucional da Sprint 03A.
-- - Funcoes privadas de autorizacao em app_private.
--
-- Limites:
-- - Nenhuma politica para anon.
-- - Nenhum DELETE concedido.
-- - Nenhum acesso clinico, dado real ou tabela clinica.

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.hospitals enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.platform_role_assignments enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_membership_roles enable row level security;
alter table public.hospital_memberships enable row level security;
alter table public.hospital_membership_roles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.organizations from public, anon, authenticated;
revoke all on table public.hospitals from public, anon, authenticated;
revoke all on table public.roles from public, anon, authenticated;
revoke all on table public.permissions from public, anon, authenticated;
revoke all on table public.role_permissions from public, anon, authenticated;
revoke all on table public.platform_role_assignments from public, anon, authenticated;
revoke all on table public.organization_memberships from public, anon, authenticated;
revoke all on table public.organization_membership_roles from public, anon, authenticated;
revoke all on table public.hospital_memberships from public, anon, authenticated;
revoke all on table public.hospital_membership_roles from public, anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

grant select on table public.organizations to authenticated;
grant insert (code, display_name, legal_name, status, created_by) on table public.organizations to authenticated;
grant update (display_name, legal_name, status) on table public.organizations to authenticated;

grant select on table public.hospitals to authenticated;
grant insert (organization_id, code, display_name, status, created_by) on table public.hospitals to authenticated;
grant update (display_name, status) on table public.hospitals to authenticated;

grant select on table public.roles to authenticated;
grant select on table public.permissions to authenticated;
grant select on table public.role_permissions to authenticated;

grant select on table public.platform_role_assignments to authenticated;

grant select on table public.organization_memberships to authenticated;
grant insert (organization_id, user_id, status, created_by) on table public.organization_memberships to authenticated;
grant update (status) on table public.organization_memberships to authenticated;

grant select on table public.organization_membership_roles to authenticated;
grant insert (organization_membership_id, role_id, status, granted_by) on table public.organization_membership_roles to authenticated;
grant update (status, revoked_at) on table public.organization_membership_roles to authenticated;

grant select on table public.hospital_memberships to authenticated;
grant insert (organization_id, hospital_id, organization_membership_id, status, created_by) on table public.hospital_memberships to authenticated;
grant update (status) on table public.hospital_memberships to authenticated;

grant select on table public.hospital_membership_roles to authenticated;
grant insert (hospital_membership_id, role_id, status, granted_by) on table public.hospital_membership_roles to authenticated;
grant update (status, revoked_at) on table public.hospital_membership_roles to authenticated;

create policy profiles_select_visible
on public.profiles
for select
to authenticated
using (app_private.current_user_can_view_profile(id));

create policy profiles_update_own_display_name
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  and app_private.current_profile_is_active()
)
with check (
  id = auth.uid()
  and app_private.current_profile_is_active()
);

create policy organizations_select_allowed
on public.organizations
for select
to authenticated
using (
  app_private.current_user_is_platform_admin()
  or app_private.current_user_has_organization_permission(id, 'organization.read')
);

create policy organizations_insert_platform_admin
on public.organizations
for insert
to authenticated
with check (app_private.current_user_is_platform_admin());

create policy organizations_update_platform_admin
on public.organizations
for update
to authenticated
using (app_private.current_user_is_platform_admin())
with check (app_private.current_user_is_platform_admin());

create policy hospitals_select_allowed
on public.hospitals
for select
to authenticated
using (
  app_private.current_user_is_platform_admin()
  or app_private.current_user_has_organization_permission(organization_id, 'hospitals.read')
  or app_private.current_user_has_hospital_permission(id, 'hospital.read')
);

create policy hospitals_insert_platform_admin
on public.hospitals
for insert
to authenticated
with check (app_private.current_user_is_platform_admin());

create policy hospitals_update_platform_admin
on public.hospitals
for update
to authenticated
using (app_private.current_user_is_platform_admin())
with check (app_private.current_user_is_platform_admin());

create policy roles_select_active_profile
on public.roles
for select
to authenticated
using (app_private.current_profile_is_active());

create policy permissions_select_active_profile
on public.permissions
for select
to authenticated
using (app_private.current_profile_is_active());

create policy role_permissions_select_active_profile
on public.role_permissions
for select
to authenticated
using (app_private.current_profile_is_active());

create policy platform_role_assignments_select_allowed
on public.platform_role_assignments
for select
to authenticated
using (
  user_id = auth.uid()
  or app_private.current_user_is_platform_admin()
);

create policy organization_memberships_select_allowed
on public.organization_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or app_private.current_user_is_platform_admin()
  or app_private.current_user_has_organization_permission(organization_id, 'organization_memberships.read')
);

create policy organization_memberships_insert_allowed
on public.organization_memberships
for insert
to authenticated
with check (
  app_private.current_user_is_platform_admin()
  or app_private.current_user_has_organization_permission(organization_id, 'organization_memberships.manage')
);

create policy organization_memberships_update_allowed
on public.organization_memberships
for update
to authenticated
using (
  app_private.current_user_is_platform_admin()
  or app_private.current_user_has_organization_permission(organization_id, 'organization_memberships.manage')
)
with check (
  app_private.current_user_is_platform_admin()
  or app_private.current_user_has_organization_permission(organization_id, 'organization_memberships.manage')
);

create policy organization_membership_roles_select_allowed
on public.organization_membership_roles
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships om
    where om.id = organization_membership_id
      and (
        om.user_id = auth.uid()
        or app_private.current_user_is_platform_admin()
        or app_private.current_user_has_organization_permission(om.organization_id, 'organization_memberships.read')
      )
  )
);

create policy organization_membership_roles_insert_allowed
on public.organization_membership_roles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.organization_memberships om
    where om.id = organization_membership_id
      and (
        app_private.current_user_is_platform_admin()
        or app_private.current_user_has_organization_permission(om.organization_id, 'organization_memberships.manage')
      )
  )
);

create policy organization_membership_roles_update_allowed
on public.organization_membership_roles
for update
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships om
    where om.id = organization_membership_id
      and (
        app_private.current_user_is_platform_admin()
        or app_private.current_user_has_organization_permission(om.organization_id, 'organization_memberships.manage')
      )
  )
)
with check (
  exists (
    select 1
    from public.organization_memberships om
    where om.id = organization_membership_id
      and (
        app_private.current_user_is_platform_admin()
        or app_private.current_user_has_organization_permission(om.organization_id, 'organization_memberships.manage')
      )
  )
);

create policy hospital_memberships_select_allowed
on public.hospital_memberships
for select
to authenticated
using (
  app_private.current_user_is_platform_admin()
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_memberships.read')
  or app_private.current_user_has_hospital_permission(hospital_id, 'hospital_memberships.read')
  or exists (
    select 1
    from public.organization_memberships om
    where om.id = organization_membership_id
      and om.user_id = auth.uid()
  )
);

create policy hospital_memberships_insert_allowed
on public.hospital_memberships
for insert
to authenticated
with check (
  app_private.current_user_is_platform_admin()
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_memberships.manage')
  or app_private.current_user_has_hospital_permission(hospital_id, 'hospital_memberships.manage')
);

create policy hospital_memberships_update_allowed
on public.hospital_memberships
for update
to authenticated
using (
  app_private.current_user_is_platform_admin()
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_memberships.manage')
  or app_private.current_user_has_hospital_permission(hospital_id, 'hospital_memberships.manage')
)
with check (
  app_private.current_user_is_platform_admin()
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_memberships.manage')
  or app_private.current_user_has_hospital_permission(hospital_id, 'hospital_memberships.manage')
);

create policy hospital_membership_roles_select_allowed
on public.hospital_membership_roles
for select
to authenticated
using (
  exists (
    select 1
    from public.hospital_memberships hm
    join public.organization_memberships om
      on om.id = hm.organization_membership_id
    where hm.id = hospital_membership_id
      and (
        om.user_id = auth.uid()
        or app_private.current_user_is_platform_admin()
        or app_private.current_user_has_organization_permission(hm.organization_id, 'hospital_memberships.read')
        or app_private.current_user_has_hospital_permission(hm.hospital_id, 'hospital_memberships.read')
      )
  )
);

create policy hospital_membership_roles_insert_allowed
on public.hospital_membership_roles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.hospital_memberships hm
    where hm.id = hospital_membership_id
      and (
        app_private.current_user_is_platform_admin()
        or app_private.current_user_has_organization_permission(hm.organization_id, 'hospital_memberships.manage')
        or app_private.current_user_has_hospital_permission(hm.hospital_id, 'hospital_memberships.manage')
      )
  )
);

create policy hospital_membership_roles_update_allowed
on public.hospital_membership_roles
for update
to authenticated
using (
  exists (
    select 1
    from public.hospital_memberships hm
    where hm.id = hospital_membership_id
      and (
        app_private.current_user_is_platform_admin()
        or app_private.current_user_has_organization_permission(hm.organization_id, 'hospital_memberships.manage')
        or app_private.current_user_has_hospital_permission(hm.hospital_id, 'hospital_memberships.manage')
      )
  )
)
with check (
  exists (
    select 1
    from public.hospital_memberships hm
    where hm.id = hospital_membership_id
      and (
        app_private.current_user_is_platform_admin()
        or app_private.current_user_has_organization_permission(hm.organization_id, 'hospital_memberships.manage')
        or app_private.current_user_has_hospital_permission(hm.hospital_id, 'hospital_memberships.manage')
      )
  )
);
