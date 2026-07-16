-- Sprint 05 - Cadastro institucional hospitalar (estrutura fisica configuravel)
--
-- Responsabilidade:
-- 1. Criar as quatro tabelas de estrutura institucional do hospital:
--    hospital_units (unidades), hospital_sectors (setores), hospital_beds
--    (leitos) e hospital_resources (recursos institucionais). Toda linha
--    pertence a exatamente um hospital e a organizacao proprietaria, com FKs
--    compostas que impedem misturar tenants.
-- 2. Semear as novas permissoes semanticas hospital_structure.read e
--    hospital_structure.manage (escopos organization e hospital) e mapea-las
--    aos papeis existentes (organization_admin e hospital_admin gerenciam;
--    auditores leem; member nao acessa a administracao da estrutura).
-- 3. RLS fail-closed nas quatro tabelas: SELECT por hospital_structure.read,
--    INSERT/UPDATE por hospital_structure.manage; nenhum DELETE concedido
--    (desativacao logica por status); nenhuma policy para anon; nenhum bypass
--    de platform_admin.
-- 4. Invariantes de hierarquia no banco: setor pertence a unidade do MESMO
--    hospital (FK composta), leito pertence a setor do MESMO hospital (FK
--    composta) e triggers impedem criar filho sob pai inativo.
-- 5. Estender public.get_effective_hospital_capabilities com dois novos
--    booleanos semanticos (can_read_structure, can_manage_structure),
--    preservando SECURITY INVOKER e o contrato de sempre uma linha.
--
-- Limites:
-- - Nenhuma tabela clinica: unidades, setores, leitos e recursos sao
--   configuracao institucional; ocupacao de leito e uso de recurso pertencem
--   a sprints futuras (mapa do hospital e recursos assistenciais).
-- - Cadastro de recurso NAO significa recurso utilizado.
-- - Nenhuma alteracao nas tabelas, policies, grants ou RPCs das Sprints 03/04.
-- - Nenhum SECURITY DEFINER novo; nenhuma leitura de auth.users; nenhum dado
--   real inserido.

-- === 1. Tabelas de estrutura ==================================================

create table public.hospital_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  hospital_id uuid not null,
  code text not null,
  display_name text not null,
  status text not null default 'active',
  management_ref text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_units_hospital_organization_fk
    foreign key (hospital_id, organization_id)
    references public.hospitals(id, organization_id)
    on delete restrict,
  constraint hospital_units_hospital_code_unique unique (hospital_id, code),
  constraint hospital_units_id_hospital_unique unique (id, hospital_id),
  constraint hospital_units_management_ref_unique unique (management_ref),
  constraint hospital_units_management_ref_format check (management_ref ~ '^[0-9a-f]{32}$'),
  constraint hospital_units_code_format check (code = lower(code) and code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint hospital_units_code_length check (length(code) <= 60),
  constraint hospital_units_display_name_not_blank check (length(btrim(display_name)) > 0),
  constraint hospital_units_display_name_length check (length(display_name) <= 120),
  constraint hospital_units_status_check check (status in ('active', 'inactive'))
);

create table public.hospital_sectors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  hospital_id uuid not null,
  unit_id uuid not null,
  code text not null,
  display_name text not null,
  status text not null default 'active',
  management_ref text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_sectors_hospital_organization_fk
    foreign key (hospital_id, organization_id)
    references public.hospitals(id, organization_id)
    on delete restrict,
  constraint hospital_sectors_unit_hospital_fk
    foreign key (unit_id, hospital_id)
    references public.hospital_units(id, hospital_id)
    on delete restrict,
  constraint hospital_sectors_hospital_code_unique unique (hospital_id, code),
  constraint hospital_sectors_id_hospital_unique unique (id, hospital_id),
  constraint hospital_sectors_management_ref_unique unique (management_ref),
  constraint hospital_sectors_management_ref_format check (management_ref ~ '^[0-9a-f]{32}$'),
  constraint hospital_sectors_code_format check (code = lower(code) and code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint hospital_sectors_code_length check (length(code) <= 60),
  constraint hospital_sectors_display_name_not_blank check (length(btrim(display_name)) > 0),
  constraint hospital_sectors_display_name_length check (length(display_name) <= 120),
  constraint hospital_sectors_status_check check (status in ('active', 'inactive'))
);

create table public.hospital_beds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  hospital_id uuid not null,
  sector_id uuid not null,
  code text not null,
  display_name text not null,
  status text not null default 'active',
  management_ref text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_beds_hospital_organization_fk
    foreign key (hospital_id, organization_id)
    references public.hospitals(id, organization_id)
    on delete restrict,
  constraint hospital_beds_sector_hospital_fk
    foreign key (sector_id, hospital_id)
    references public.hospital_sectors(id, hospital_id)
    on delete restrict,
  constraint hospital_beds_hospital_code_unique unique (hospital_id, code),
  constraint hospital_beds_management_ref_unique unique (management_ref),
  constraint hospital_beds_management_ref_format check (management_ref ~ '^[0-9a-f]{32}$'),
  constraint hospital_beds_code_format check (code = lower(code) and code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint hospital_beds_code_length check (length(code) <= 60),
  constraint hospital_beds_display_name_not_blank check (length(btrim(display_name)) > 0),
  constraint hospital_beds_display_name_length check (length(display_name) <= 120),
  constraint hospital_beds_status_check check (status in ('active', 'inactive'))
);

create table public.hospital_resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  hospital_id uuid not null,
  code text not null,
  display_name text not null,
  description text,
  status text not null default 'active',
  management_ref text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hospital_resources_hospital_organization_fk
    foreign key (hospital_id, organization_id)
    references public.hospitals(id, organization_id)
    on delete restrict,
  constraint hospital_resources_hospital_code_unique unique (hospital_id, code),
  constraint hospital_resources_management_ref_unique unique (management_ref),
  constraint hospital_resources_management_ref_format check (management_ref ~ '^[0-9a-f]{32}$'),
  constraint hospital_resources_code_format check (code = lower(code) and code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint hospital_resources_code_length check (length(code) <= 60),
  constraint hospital_resources_display_name_not_blank check (length(btrim(display_name)) > 0),
  constraint hospital_resources_display_name_length check (length(display_name) <= 120),
  constraint hospital_resources_description_length check (description is null or length(description) <= 500),
  constraint hospital_resources_status_check check (status in ('active', 'inactive'))
);

create trigger hospital_units_set_updated_at
before update on public.hospital_units
for each row execute function app_private.set_updated_at();

create trigger hospital_sectors_set_updated_at
before update on public.hospital_sectors
for each row execute function app_private.set_updated_at();

create trigger hospital_beds_set_updated_at
before update on public.hospital_beds
for each row execute function app_private.set_updated_at();

create trigger hospital_resources_set_updated_at
before update on public.hospital_resources
for each row execute function app_private.set_updated_at();

create index hospital_units_hospital_status_idx on public.hospital_units(hospital_id, status);
create index hospital_units_created_by_idx on public.hospital_units(created_by);
create index hospital_sectors_hospital_status_idx on public.hospital_sectors(hospital_id, status);
create index hospital_sectors_unit_idx on public.hospital_sectors(unit_id);
create index hospital_sectors_created_by_idx on public.hospital_sectors(created_by);
create index hospital_beds_hospital_status_idx on public.hospital_beds(hospital_id, status);
create index hospital_beds_sector_idx on public.hospital_beds(sector_id);
create index hospital_beds_created_by_idx on public.hospital_beds(created_by);
create index hospital_resources_hospital_status_idx on public.hospital_resources(hospital_id, status);
create index hospital_resources_created_by_idx on public.hospital_resources(created_by);

-- === 2. Invariantes de hierarquia (pai ativo na criacao) ======================
-- As FKs compostas ja garantem que pai e filho pertencem ao MESMO hospital.
-- Estes triggers (funcoes comuns, SEM SECURITY DEFINER: rodam sob o proprio
-- usuario e sob RLS) impedem criar setor sob unidade inativa e leito sob setor
-- inativo. Fail-closed: pai invisivel sob RLS equivale a pai inexistente.

create or replace function app_private.enforce_active_parent_unit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.hospital_units u
    where u.id = new.unit_id
      and u.hospital_id = new.hospital_id
      and u.status = 'active'
  ) then
    raise exception 'parent unit is not active'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create or replace function app_private.enforce_active_parent_sector()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.hospital_sectors s
    where s.id = new.sector_id
      and s.hospital_id = new.hospital_id
      and s.status = 'active'
  ) then
    raise exception 'parent sector is not active'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke all on function app_private.enforce_active_parent_unit() from public;
revoke all on function app_private.enforce_active_parent_unit() from anon;
revoke all on function app_private.enforce_active_parent_unit() from authenticated;
revoke all on function app_private.enforce_active_parent_sector() from public;
revoke all on function app_private.enforce_active_parent_sector() from anon;
revoke all on function app_private.enforce_active_parent_sector() from authenticated;

create trigger hospital_sectors_enforce_active_unit
before insert on public.hospital_sectors
for each row execute function app_private.enforce_active_parent_unit();

create trigger hospital_beds_enforce_active_sector
before insert on public.hospital_beds
for each row execute function app_private.enforce_active_parent_sector();

-- === 3. Permissoes semanticas e mapeamentos ===================================

insert into public.permissions (scope, code, description)
values
  ('organization', 'hospital_structure.read', 'Visualizar a estrutura institucional dos hospitals da propria organization.'),
  ('organization', 'hospital_structure.manage', 'Gerenciar a estrutura institucional dos hospitals da propria organization.'),
  ('hospital', 'hospital_structure.read', 'Visualizar a estrutura institucional do proprio hospital.'),
  ('hospital', 'hospital_structure.manage', 'Gerenciar a estrutura institucional do proprio hospital.');

insert into public.role_permissions (role_id, permission_id, scope)
select r.id, p.id, mapping.scope
from (
  values
    ('organization', 'organization_admin', 'hospital_structure.read'),
    ('organization', 'organization_admin', 'hospital_structure.manage'),
    ('organization', 'auditor', 'hospital_structure.read'),
    ('hospital', 'hospital_admin', 'hospital_structure.read'),
    ('hospital', 'hospital_admin', 'hospital_structure.manage'),
    ('hospital', 'auditor', 'hospital_structure.read')
) as mapping(scope, role_code, permission_code)
join public.roles r
  on r.scope = mapping.scope
  and r.code = mapping.role_code
join public.permissions p
  on p.scope = mapping.scope
  and p.code = mapping.permission_code;

-- === 4. RLS, grants minimos e policies fail-closed ============================

alter table public.hospital_units enable row level security;
alter table public.hospital_sectors enable row level security;
alter table public.hospital_beds enable row level security;
alter table public.hospital_resources enable row level security;

revoke all on table public.hospital_units from public, anon, authenticated;
revoke all on table public.hospital_sectors from public, anon, authenticated;
revoke all on table public.hospital_beds from public, anon, authenticated;
revoke all on table public.hospital_resources from public, anon, authenticated;

grant select on table public.hospital_units to authenticated;
grant insert (organization_id, hospital_id, code, display_name) on table public.hospital_units to authenticated;
grant update (status) on table public.hospital_units to authenticated;

grant select on table public.hospital_sectors to authenticated;
grant insert (organization_id, hospital_id, unit_id, code, display_name) on table public.hospital_sectors to authenticated;
grant update (status) on table public.hospital_sectors to authenticated;

grant select on table public.hospital_beds to authenticated;
grant insert (organization_id, hospital_id, sector_id, code, display_name) on table public.hospital_beds to authenticated;
grant update (status) on table public.hospital_beds to authenticated;

grant select on table public.hospital_resources to authenticated;
grant insert (organization_id, hospital_id, code, display_name, description) on table public.hospital_resources to authenticated;
grant update (status) on table public.hospital_resources to authenticated;

create policy hospital_units_select_allowed
on public.hospital_units
for select
to authenticated
using (
  app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.read')
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.read')
);

create policy hospital_units_insert_manage
on public.hospital_units
for insert
to authenticated
with check (
  (
    app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.manage')
    or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.manage')
  )
  and exists (
    select 1
    from public.hospitals h
    where h.id = hospital_id
      and h.organization_id = organization_id
      and h.status = 'active'
  )
);

create policy hospital_units_update_manage
on public.hospital_units
for update
to authenticated
using (
  app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.manage')
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.manage')
)
with check (
  app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.manage')
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.manage')
);

create policy hospital_sectors_select_allowed
on public.hospital_sectors
for select
to authenticated
using (
  app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.read')
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.read')
);

create policy hospital_sectors_insert_manage
on public.hospital_sectors
for insert
to authenticated
with check (
  (
    app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.manage')
    or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.manage')
  )
  and exists (
    select 1
    from public.hospitals h
    where h.id = hospital_id
      and h.organization_id = organization_id
      and h.status = 'active'
  )
);

create policy hospital_sectors_update_manage
on public.hospital_sectors
for update
to authenticated
using (
  app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.manage')
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.manage')
)
with check (
  app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.manage')
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.manage')
);

create policy hospital_beds_select_allowed
on public.hospital_beds
for select
to authenticated
using (
  app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.read')
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.read')
);

create policy hospital_beds_insert_manage
on public.hospital_beds
for insert
to authenticated
with check (
  (
    app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.manage')
    or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.manage')
  )
  and exists (
    select 1
    from public.hospitals h
    where h.id = hospital_id
      and h.organization_id = organization_id
      and h.status = 'active'
  )
);

create policy hospital_beds_update_manage
on public.hospital_beds
for update
to authenticated
using (
  app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.manage')
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.manage')
)
with check (
  app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.manage')
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.manage')
);

create policy hospital_resources_select_allowed
on public.hospital_resources
for select
to authenticated
using (
  app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.read')
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.read')
);

create policy hospital_resources_insert_manage
on public.hospital_resources
for insert
to authenticated
with check (
  (
    app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.manage')
    or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.manage')
  )
  and exists (
    select 1
    from public.hospitals h
    where h.id = hospital_id
      and h.organization_id = organization_id
      and h.status = 'active'
  )
);

create policy hospital_resources_update_manage
on public.hospital_resources
for update
to authenticated
using (
  app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.manage')
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.manage')
)
with check (
  app_private.current_user_has_hospital_permission(hospital_id, 'hospital_structure.manage')
  or app_private.current_user_has_organization_permission(organization_id, 'hospital_structure.manage')
);

-- === 5. Capacidades efetivas estendidas =======================================
-- A alteracao do tipo de retorno exige drop + recreate; a semantica dos cinco
-- booleanos da Sprint 04A (DEC-054) permanece identica. As duas novas
-- capacidades derivam exclusivamente de hospital_structure.read/manage nos
-- escopos organization e hospital.

drop function public.get_effective_hospital_capabilities(uuid);

create or replace function public.get_effective_hospital_capabilities(
  target_hospital_id uuid
)
returns table (
  can_read_hospital boolean,
  can_read_memberships boolean,
  can_manage_memberships boolean,
  can_read_audit boolean,
  can_switch_context boolean,
  can_read_structure boolean,
  can_manage_structure boolean
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
    ), false) as can_switch_context,
    coalesce(bool_or(
      scope in ('organization', 'hospital') and code = 'hospital_structure.read'
    ), false) as can_read_structure,
    coalesce(bool_or(
      scope in ('organization', 'hospital') and code = 'hospital_structure.manage'
    ), false) as can_manage_structure
  from effective;
$$;

revoke execute on function public.get_effective_hospital_capabilities(uuid) from public;
revoke execute on function public.get_effective_hospital_capabilities(uuid) from anon;
grant execute on function public.get_effective_hospital_capabilities(uuid) to authenticated;
