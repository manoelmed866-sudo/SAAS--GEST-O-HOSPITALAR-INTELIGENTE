begin;

select plan(30);

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'profiles',
        'organizations',
        'hospitals',
        'roles',
        'permissions',
        'role_permissions',
        'platform_role_assignments',
        'organization_memberships',
        'organization_membership_roles',
        'hospital_memberships',
        'hospital_membership_roles'
      )
  ),
  11,
  'Sprint 03A cria somente as 11 tabelas publicas autorizadas'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and (
        (table_name = 'profiles' and column_name in ('id', 'display_name', 'status', 'created_at', 'updated_at'))
        or (table_name = 'organizations' and column_name in ('id', 'code', 'display_name', 'legal_name', 'status', 'created_by'))
        or (table_name = 'hospitals' and column_name in ('id', 'organization_id', 'code', 'display_name', 'status', 'created_by'))
        or (table_name = 'roles' and column_name in ('id', 'scope', 'code', 'display_name', 'is_system'))
        or (table_name = 'permissions' and column_name in ('id', 'scope', 'code'))
        or (table_name = 'role_permissions' and column_name in ('role_id', 'permission_id', 'scope'))
        or (table_name = 'platform_role_assignments' and column_name in ('id', 'user_id', 'role_id', 'role_scope', 'status', 'granted_by', 'revoked_at'))
        or (table_name = 'organization_memberships' and column_name in ('id', 'organization_id', 'user_id', 'status', 'created_by'))
        or (table_name = 'organization_membership_roles' and column_name in ('id', 'organization_membership_id', 'role_id', 'role_scope', 'status', 'granted_by', 'revoked_at'))
        or (table_name = 'hospital_memberships' and column_name in ('id', 'organization_id', 'hospital_id', 'organization_membership_id', 'status', 'created_by'))
        or (table_name = 'hospital_membership_roles' and column_name in ('id', 'hospital_membership_id', 'role_id', 'role_scope', 'status', 'granted_by', 'revoked_at'))
      )
  ),
  60,
  'colunas essenciais da Sprint 03A existem'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_constraints
    where table_schema = 'public'
      and constraint_type = 'PRIMARY KEY'
      and table_name in (
        'profiles',
        'organizations',
        'hospitals',
        'roles',
        'permissions',
        'role_permissions',
        'platform_role_assignments',
        'organization_memberships',
        'organization_membership_roles',
        'hospital_memberships',
        'hospital_membership_roles'
      )
  ),
  11,
  'todas as tabelas da Sprint 03A possuem primary key'
);

select ok(
  (
    select count(*) >= 15
    from information_schema.table_constraints
    where table_schema = 'public'
      and constraint_type = 'FOREIGN KEY'
      and table_name in (
        'profiles',
        'organizations',
        'hospitals',
        'role_permissions',
        'platform_role_assignments',
        'organization_memberships',
        'organization_membership_roles',
        'hospital_memberships',
        'hospital_membership_roles'
      )
  ),
  'foreign keys principais foram criadas'
);

select ok(
  (
    select count(*) >= 9
    from information_schema.table_constraints
    where table_schema = 'public'
      and constraint_type = 'UNIQUE'
      and table_name in (
        'organizations',
        'hospitals',
        'roles',
        'permissions',
        'platform_role_assignments',
        'organization_memberships',
        'organization_membership_roles',
        'hospital_memberships',
        'hospital_membership_roles'
      )
  ),
  'unique constraints essenciais foram criadas'
);

select ok(
  (
    select count(*) >= 14
    from information_schema.table_constraints
    where table_schema = 'public'
      and constraint_type = 'CHECK'
  ),
  'check constraints para estados, scopes e formatos foram criadas'
);

select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'profiles',
        'organizations',
        'hospitals',
        'roles',
        'permissions',
        'role_permissions',
        'platform_role_assignments',
        'organization_memberships',
        'organization_membership_roles',
        'hospital_memberships',
        'hospital_membership_roles'
      )
      and c.relrowsecurity
  ),
  11,
  'RLS esta habilitada nas 11 tabelas publicas da Sprint 03A'
);

select is(
  (
    select count(*)::integer
    from information_schema.routines
    where specific_schema = 'app_private'
      and routine_name in (
        'set_updated_at',
        'current_profile_is_active',
        'current_user_is_platform_admin',
        'current_user_has_organization_permission',
        'current_user_has_hospital_permission',
        'current_user_can_view_profile'
      )
  ),
  6,
  'funcoes privadas esperadas existem'
);

select is(
  (
    select count(*)::integer
    from public.roles
    where code in (
      'medico',
      'enfermeiro',
      'farmaceutico',
      'profissional_assistencial',
      'gestor_clinico',
      'operador_estoque'
    )
  ),
  0,
  'nenhum papel clinico ou operacional futuro foi criado'
);

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'patients',
        'episodes',
        'clinical_records',
        'protocols',
        'exams',
        'medications',
        'supplies',
        'inventory',
        'departments',
        'sectors',
        'billing',
        'subscriptions'
      )
  ),
  0,
  'nenhuma tabela clinica, operacional ou comercial fora de escopo foi criada (estrutura hospitalar passou a ser escopo legitimo na Sprint 05)'
);

select is((select count(*)::integer from public.roles where scope = 'platform'), 1, 'um papel platform foi criado');
select is((select count(*)::integer from public.roles where scope = 'organization'), 3, 'tres papeis organization foram criados');
select is((select count(*)::integer from public.roles where scope = 'hospital'), 3, 'tres papeis hospital foram criados');
select is((select count(*)::integer from public.permissions where scope = 'platform'), 7, 'sete permissoes platform foram criadas');
select is((select count(*)::integer from public.permissions where scope = 'organization'), 10, 'dez permissoes organization existem (oito da Sprint 03A e duas de estrutura da Sprint 05)');
select is((select count(*)::integer from public.permissions where scope = 'hospital'), 7, 'sete permissoes hospital existem (cinco da Sprint 03A e duas de estrutura da Sprint 05)');

select is(
  (
    select count(*)::integer
    from public.role_permissions rp
    join public.roles r on r.id = rp.role_id
    join public.permissions p on p.id = rp.permission_id
    where r.scope <> p.scope or rp.scope <> r.scope
  ),
  0,
  'role_permissions nao mistura scopes'
);

select ok(to_regclass('public.profiles') is not null, 'profiles existe');
select ok(to_regclass('public.organizations') is not null, 'organizations existe');
select ok(to_regclass('public.hospitals') is not null, 'hospitals existe');
select ok(to_regclass('public.roles') is not null, 'roles existe');
select ok(to_regclass('public.permissions') is not null, 'permissions existe');
select ok(to_regclass('public.role_permissions') is not null, 'role_permissions existe');
select ok(to_regclass('public.platform_role_assignments') is not null, 'platform_role_assignments existe');
select ok(to_regclass('public.organization_memberships') is not null, 'organization_memberships existe');
select ok(to_regclass('public.organization_membership_roles') is not null, 'organization_membership_roles existe');
select ok(to_regclass('public.hospital_memberships') is not null, 'hospital_memberships existe');
select ok(to_regclass('public.hospital_membership_roles') is not null, 'hospital_membership_roles existe');

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'app_private'
  ),
  0,
  'app_private nao possui tabelas nesta fase'
);

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('invitations', 'active_contexts', 'audit_logs')
  ),
  0,
  'convites, contexto ativo e audit logs nao foram criados na Sprint 03A'
);

select * from finish();

rollback;
