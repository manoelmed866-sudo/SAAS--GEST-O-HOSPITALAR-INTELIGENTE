begin;

select plan(3);

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'patients',
        'episodes',
        'clinical_records',
        'diagnoses',
        'prescriptions',
        'exams',
        'medications',
        'supplies',
        'inventory',
        'demo',
        'example',
        'test_users'
      )
  ),
  0,
  'nenhuma tabela clinica ou demonstrativa proibida foi criada'
);

select is(
  (
    (select count(*) from public.profiles)
    + (select count(*) from public.organizations)
    + (select count(*) from public.hospitals)
    + (select count(*) from public.organization_memberships)
    + (select count(*) from public.hospital_memberships)
  )::integer,
  0,
  'migracoes e seed nao inserem usuarios de negocio nem dados institucionais'
);

select is(
  (select count(*)::integer from public.platform_role_assignments),
  0,
  'nenhuma atribuicao de platform_admin foi criada automaticamente'
);

select * from finish();

rollback;
