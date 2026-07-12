begin;

select plan(3);

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
  ),
  0,
  'baseline nao cria tabelas de dominio no schema public'
);

select is(
  (
    select count(*)::integer
    from information_schema.schemata
    where schema_name in (
      'clinical',
      'clinico',
      'institutional',
      'institucional',
      'hospitalar',
      'audit',
      'auditoria'
    )
  ),
  0,
  'baseline nao cria schemas clinicos ou institucionais do projeto'
);

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'demo',
        'example',
        'patients',
        'pacientes',
        'episodes',
        'episodios',
        'hospitals',
        'hospitais',
        'users',
        'usuarios'
      )
  ),
  0,
  'baseline nao cria tabelas de demonstracao, pacientes, episodios, hospitais ou usuarios'
);

select * from finish();

rollback;
