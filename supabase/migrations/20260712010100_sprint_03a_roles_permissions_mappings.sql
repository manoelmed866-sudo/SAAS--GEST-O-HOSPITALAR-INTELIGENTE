-- Sprint 03A - Papeis, permissoes e mapeamentos estruturais
--
-- Responsabilidade:
-- Criar papeis relacionais, permissoes relacionais, associacoes e atribuicoes de papel.
--
-- Dependencias:
-- - 20260712010000_sprint_03a_identity_institutional_model.sql.
--
-- Limites:
-- - Apenas dados estruturais da aplicacao sao inseridos.
-- - Nenhum usuario, organization, hospital, convite, papel clinico ou dado real.

create table public.roles (
  id bigint generated always as identity primary key,
  scope text not null,
  code text not null,
  display_name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  constraint roles_scope_check check (scope in ('platform', 'organization', 'hospital')),
  constraint roles_code_not_blank check (length(btrim(code)) > 0),
  constraint roles_display_name_not_blank check (length(btrim(display_name)) > 0),
  constraint roles_scope_code_unique unique (scope, code),
  constraint roles_id_scope_unique unique (id, scope)
);

create table public.permissions (
  id bigint generated always as identity primary key,
  scope text not null,
  code text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint permissions_scope_check check (scope in ('platform', 'organization', 'hospital')),
  constraint permissions_code_not_blank check (length(btrim(code)) > 0),
  constraint permissions_scope_code_unique unique (scope, code),
  constraint permissions_id_scope_unique unique (id, scope)
);

create table public.role_permissions (
  role_id bigint not null,
  permission_id bigint not null,
  scope text not null,
  created_at timestamptz not null default now(),
  constraint role_permissions_scope_check check (scope in ('platform', 'organization', 'hospital')),
  constraint role_permissions_primary_key primary key (role_id, permission_id),
  constraint role_permissions_role_scope_fk
    foreign key (role_id, scope)
    references public.roles(id, scope)
    on delete restrict,
  constraint role_permissions_permission_scope_fk
    foreign key (permission_id, scope)
    references public.permissions(id, scope)
    on delete restrict
);

create table public.platform_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  role_id bigint not null,
  role_scope text not null default 'platform',
  status text not null default 'active',
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint platform_role_assignments_role_scope_check check (role_scope = 'platform'),
  constraint platform_role_assignments_status_check check (status in ('active', 'revoked')),
  constraint platform_role_assignments_role_scope_fk
    foreign key (role_id, role_scope)
    references public.roles(id, scope)
    on delete restrict,
  constraint platform_role_assignments_user_role_unique unique (user_id, role_id)
);

create table public.organization_membership_roles (
  id uuid primary key default gen_random_uuid(),
  organization_membership_id uuid not null references public.organization_memberships(id) on delete restrict,
  role_id bigint not null,
  role_scope text not null default 'organization',
  status text not null default 'active',
  granted_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint organization_membership_roles_role_scope_check check (role_scope = 'organization'),
  constraint organization_membership_roles_status_check check (status in ('active', 'revoked')),
  constraint organization_membership_roles_role_scope_fk
    foreign key (role_id, role_scope)
    references public.roles(id, scope)
    on delete restrict,
  constraint organization_membership_roles_membership_role_unique unique (organization_membership_id, role_id)
);

create table public.hospital_membership_roles (
  id uuid primary key default gen_random_uuid(),
  hospital_membership_id uuid not null references public.hospital_memberships(id) on delete restrict,
  role_id bigint not null,
  role_scope text not null default 'hospital',
  status text not null default 'active',
  granted_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint hospital_membership_roles_role_scope_check check (role_scope = 'hospital'),
  constraint hospital_membership_roles_status_check check (status in ('active', 'revoked')),
  constraint hospital_membership_roles_role_scope_fk
    foreign key (role_id, role_scope)
    references public.roles(id, scope)
    on delete restrict,
  constraint hospital_membership_roles_membership_role_unique unique (hospital_membership_id, role_id)
);

create trigger platform_role_assignments_set_updated_at
before update on public.platform_role_assignments
for each row execute function app_private.set_updated_at();

create trigger organization_membership_roles_set_updated_at
before update on public.organization_membership_roles
for each row execute function app_private.set_updated_at();

create trigger hospital_membership_roles_set_updated_at
before update on public.hospital_membership_roles
for each row execute function app_private.set_updated_at();

insert into public.roles (scope, code, display_name, description)
values
  ('platform', 'platform_admin', 'Administrador da plataforma', 'Administra a plataforma sem acesso clinico automatico.'),
  ('organization', 'organization_admin', 'Administrador institucional', 'Administra a propria institution/organization.'),
  ('organization', 'auditor', 'Auditor institucional', 'Consulta registros institucionais permitidos em modo somente leitura.'),
  ('organization', 'member', 'Membro institucional', 'Vinculo institucional basico sem poderes administrativos.'),
  ('hospital', 'hospital_admin', 'Administrador hospitalar', 'Administra o hospital vinculado sem acesso clinico automatico.'),
  ('hospital', 'auditor', 'Auditor hospitalar', 'Consulta registros hospitalares permitidos em modo somente leitura.'),
  ('hospital', 'member', 'Membro hospitalar', 'Vinculo hospitalar basico sem poderes administrativos.');

insert into public.permissions (scope, code, description)
values
  ('platform', 'organizations.read', 'Visualizar organizations.'),
  ('platform', 'organizations.create', 'Criar organizations.'),
  ('platform', 'organizations.update', 'Atualizar organizations.'),
  ('platform', 'hospitals.read', 'Visualizar hospitals.'),
  ('platform', 'hospitals.create', 'Criar hospitals.'),
  ('platform', 'hospitals.update', 'Atualizar hospitals.'),
  ('platform', 'platform_assignments.read', 'Visualizar atribuicoes de papeis da plataforma.'),
  ('organization', 'organization.read', 'Visualizar a propria organization.'),
  ('organization', 'hospitals.read', 'Visualizar hospitals da propria organization.'),
  ('organization', 'organization_memberships.read', 'Visualizar vinculos institucionais da propria organization.'),
  ('organization', 'organization_memberships.manage', 'Gerenciar vinculos institucionais da propria organization.'),
  ('organization', 'hospital_memberships.read', 'Visualizar vinculos hospitalares da propria organization.'),
  ('organization', 'hospital_memberships.manage', 'Gerenciar vinculos hospitalares da propria organization.'),
  ('organization', 'audit.read', 'Visualizar auditoria futura da propria organization.'),
  ('organization', 'context.switch', 'Trocar contexto dentro da propria organization.'),
  ('hospital', 'hospital.read', 'Visualizar o proprio hospital.'),
  ('hospital', 'hospital_memberships.read', 'Visualizar vinculos do proprio hospital.'),
  ('hospital', 'hospital_memberships.manage', 'Gerenciar vinculos do proprio hospital.'),
  ('hospital', 'audit.read', 'Visualizar auditoria futura do proprio hospital.'),
  ('hospital', 'context.switch', 'Trocar contexto dentro do proprio hospital.');

insert into public.role_permissions (role_id, permission_id, scope)
select r.id, p.id, p.scope
from public.roles r
join public.permissions p on p.scope = 'platform'
where r.scope = 'platform'
  and r.code = 'platform_admin';

insert into public.role_permissions (role_id, permission_id, scope)
select r.id, p.id, mapping.scope
from (
  values
    ('organization', 'organization_admin', 'organization.read'),
    ('organization', 'organization_admin', 'hospitals.read'),
    ('organization', 'organization_admin', 'organization_memberships.read'),
    ('organization', 'organization_admin', 'organization_memberships.manage'),
    ('organization', 'organization_admin', 'hospital_memberships.read'),
    ('organization', 'organization_admin', 'hospital_memberships.manage'),
    ('organization', 'organization_admin', 'context.switch'),
    ('organization', 'auditor', 'organization.read'),
    ('organization', 'auditor', 'hospitals.read'),
    ('organization', 'auditor', 'organization_memberships.read'),
    ('organization', 'auditor', 'hospital_memberships.read'),
    ('organization', 'auditor', 'audit.read'),
    ('organization', 'auditor', 'context.switch'),
    ('organization', 'member', 'organization.read'),
    ('organization', 'member', 'hospitals.read'),
    ('organization', 'member', 'context.switch'),
    ('hospital', 'hospital_admin', 'hospital.read'),
    ('hospital', 'hospital_admin', 'hospital_memberships.read'),
    ('hospital', 'hospital_admin', 'hospital_memberships.manage'),
    ('hospital', 'hospital_admin', 'context.switch'),
    ('hospital', 'auditor', 'hospital.read'),
    ('hospital', 'auditor', 'hospital_memberships.read'),
    ('hospital', 'auditor', 'audit.read'),
    ('hospital', 'auditor', 'context.switch'),
    ('hospital', 'member', 'hospital.read'),
    ('hospital', 'member', 'context.switch')
) as mapping(scope, role_code, permission_code)
join public.roles r
  on r.scope = mapping.scope
  and r.code = mapping.role_code
join public.permissions p
  on p.scope = mapping.scope
  and p.code = mapping.permission_code;

create index role_permissions_permission_id_idx on public.role_permissions(permission_id);
create index platform_role_assignments_user_status_idx on public.platform_role_assignments(user_id, status);
create index platform_role_assignments_role_status_idx on public.platform_role_assignments(role_id, status);
create index platform_role_assignments_granted_by_idx on public.platform_role_assignments(granted_by);
create index organization_membership_roles_membership_status_idx on public.organization_membership_roles(organization_membership_id, status);
create index organization_membership_roles_role_status_idx on public.organization_membership_roles(role_id, status);
create index organization_membership_roles_granted_by_idx on public.organization_membership_roles(granted_by);
create index hospital_membership_roles_membership_status_idx on public.hospital_membership_roles(hospital_membership_id, status);
create index hospital_membership_roles_role_status_idx on public.hospital_membership_roles(role_id, status);
create index hospital_membership_roles_granted_by_idx on public.hospital_membership_roles(granted_by);
