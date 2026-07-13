-- Sprint 03A - Identidade e estrutura institucional
--
-- Responsabilidade:
-- Criar profiles, organizations, hospitals e memberships institucionais/hospitalares.
--
-- Dependencias:
-- - Baseline local da Sprint 02.
-- - Supabase Auth existente no schema auth.
--
-- Limites:
-- - Nenhum trigger em auth.users.
-- - Nenhum usuario, instituicao, hospital, convite, log ou dado clinico inserido.
-- - Nenhum dado real.

create schema if not exists app_private;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke create on schema app_private from authenticated;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function app_private.set_updated_at() from public;
revoke all on function app_private.set_updated_at() from anon;
revoke all on function app_private.set_updated_at() from authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_not_blank check (length(btrim(display_name)) > 0),
  constraint profiles_status_check check (
    status in ('pending', 'active', 'suspended', 'deactivated')
  )
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  display_name text not null,
  legal_name text,
  status text not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_code_unique unique (code),
  constraint organizations_code_format check (code = lower(code) and code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint organizations_display_name_not_blank check (length(btrim(display_name)) > 0),
  constraint organizations_status_check check (
    status in ('active', 'suspended', 'inactive')
  )
);

create table public.hospitals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  code text not null,
  display_name text not null,
  status text not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospitals_organization_code_unique unique (organization_id, code),
  constraint hospitals_id_organization_unique unique (id, organization_id),
  constraint hospitals_code_format check (code = lower(code) and code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint hospitals_display_name_not_blank check (length(btrim(display_name)) > 0),
  constraint hospitals_status_check check (
    status in ('active', 'suspended', 'inactive')
  )
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending',
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_memberships_organization_user_unique unique (organization_id, user_id),
  constraint organization_memberships_id_organization_unique unique (id, organization_id),
  constraint organization_memberships_status_check check (
    status in ('pending', 'active', 'suspended', 'revoked')
  )
);

create table public.hospital_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  hospital_id uuid not null,
  organization_membership_id uuid not null,
  status text not null default 'pending',
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_memberships_hospital_organization_fk
    foreign key (hospital_id, organization_id)
    references public.hospitals(id, organization_id)
    on delete restrict,
  constraint hospital_memberships_org_membership_organization_fk
    foreign key (organization_membership_id, organization_id)
    references public.organization_memberships(id, organization_id)
    on delete restrict,
  constraint hospital_memberships_hospital_org_membership_unique unique (hospital_id, organization_membership_id),
  constraint hospital_memberships_id_hospital_unique unique (id, hospital_id),
  constraint hospital_memberships_status_check check (
    status in ('pending', 'active', 'suspended', 'revoked')
  )
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function app_private.set_updated_at();

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function app_private.set_updated_at();

create trigger hospitals_set_updated_at
before update on public.hospitals
for each row execute function app_private.set_updated_at();

create trigger organization_memberships_set_updated_at
before update on public.organization_memberships
for each row execute function app_private.set_updated_at();

create trigger hospital_memberships_set_updated_at
before update on public.hospital_memberships
for each row execute function app_private.set_updated_at();

create index organizations_created_by_idx on public.organizations(created_by);
create index organizations_status_idx on public.organizations(status);
create index hospitals_created_by_idx on public.hospitals(created_by);
create index hospitals_organization_status_idx on public.hospitals(organization_id, status);
create index organization_memberships_user_status_idx on public.organization_memberships(user_id, status);
create index organization_memberships_created_by_idx on public.organization_memberships(created_by);
create index organization_memberships_organization_status_idx on public.organization_memberships(organization_id, status);
create index hospital_memberships_hospital_status_idx on public.hospital_memberships(hospital_id, status);
create index hospital_memberships_organization_status_idx on public.hospital_memberships(organization_id, status);
create index hospital_memberships_org_membership_status_idx on public.hospital_memberships(organization_membership_id, status);
create index hospital_memberships_created_by_idx on public.hospital_memberships(created_by);
