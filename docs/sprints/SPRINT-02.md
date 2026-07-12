# SPRINT-02.md

## Sprint 02 - Fundacao local do banco de dados e das migracoes

## Objetivo

Implementar a fundacao local do banco PostgreSQL por meio do Supabase local, preparando arquivos versionaveis, migracao baseline, seed vazio, teste SQL preparatorio, scripts npm, geracao de tipos TypeScript e documentacao operacional.

## Justificativa

A Sprint 03 tratara autenticacao, contexto institucional, isolamento e permissoes. Esses recursos dependem de uma base de banco local reproduzivel, versionada e validavel antes da implementacao de usuarios, hospitais, perfis ou regras de acesso.

A mudanca da Sprint 02 nao reduz a Visao Funcional Completa. O design system permanece como trilha transversal do produto.

## Dependencias

- Sprint 00 concluida.
- Sprint 01 concluida.
- Branch `sprint/02-banco-local-migracoes`.
- Docker Desktop ou runtime Docker compativel validado.
- Supabase CLI instalada como dependencia de desenvolvimento local do projeto.

## Pre-requisitos

- Node.js 24 LTS.
- npm 11.
- Docker Desktop 29.6.1 instalado e operacional para validacao local.
- Docker Compose 5.2.0.
- Supabase CLI 2.109.1 em versao estavel e exata.
- Working tree limpa antes da implementacao.

## Estado das ferramentas

- Docker Desktop 29.6.1 foi utilizado na validacao local.
- Docker Compose 5.2.0 foi utilizado na validacao local.
- Supabase CLI 2.109.1 foi instalada em `devDependencies`.
- Supabase local foi iniciado, validado e posteriormente encerrado.

## Decisao sobre Supabase CLI

- A CLI `supabase` foi instalada em `devDependencies`.
- A versao instalada e `2.109.1`.
- A versao esta exata, sem `^` ou `~`.
- Nao sera instalada versao beta, canary, preview ou experimental.
- Scripts npm utilizarao o binario local.
- Comandos manuais poderao usar `npm exec supabase --`.
- Nao sera exigida instalacao global da CLI.
- Nao executar `supabase login`.
- Nao executar `supabase link`.
- Nao acessar projeto Supabase remoto.
- Nao copiar chaves locais geradas para arquivos versionados.
- A versao exata foi consultada via npm antes da instalacao.

## Uso exclusivo local

O Supabase sera usado somente em ambiente local nesta sprint. Nao havera projeto Supabase remoto, homologacao publica, producao, link remoto ou credenciais reais versionadas.

## Baseline minima

A baseline inicial devera ser propositalmente minima.

Ela podera conter:

- comentarios;
- convencoes;
- configuracao da infraestrutura;
- migracao tecnicamente valida sem tabelas de dominio;
- seed vazio com explicacao;
- testes que confirmem ausencia de objetos indevidos.

Ela nao devera conter:

- tabela artificial de demonstracao;
- tabela clinica;
- tabela institucional;
- tabela de usuario;
- schema clinico;
- extensao sem uso;
- RLS decorativa.

## Migracoes

As migracoes deverao ser SQL versionadas, revisaveis e reproduziveis. A Sprint 02 devera validar que migracoes podem ser aplicadas e que o reset reconstroi o estado limpo sem depender de ajustes manuais.

Migração baseline criada:

- `supabase/migrations/20260711234346_baseline_local_database.sql`.

A baseline contem apenas comentarios SQL explicativos, objetivo, convencoes e declaracao de que nenhuma tabela de dominio e criada nesta sprint.

## Seed

O seed devera ser vazio ou estritamente ficticio, somente se necessario para validar a fundacao tecnica. Nenhum dado real, identificavel, de paciente, profissional, hospital ou terceiro podera ser usado.

Foi criado `supabase/seed.sql` apenas com comentario explicativo. Nenhum registro foi inserido.

## Testes SQL

Os testes SQL deverao ser tecnicos e limitados a fundacao. Eles poderao confirmar que a baseline esta valida, que nao existem tabelas clinicas, objetos institucionais antecipados, schemas indevidos ou extensoes sem uso.

Foi criado `supabase/tests/000-baseline.test.sql` com pgTAP para verificar ausencia de tabelas de dominio no schema `public`, ausencia de schemas clinicos ou institucionais criados pelo projeto e ausencia de tabelas de demonstracao.

O teste foi executado contra o banco local com 1 arquivo SQL e 3 testes pgTAP aprovados.

## Geracao de tipos

A Sprint 02 devera prever geracao local de tipos TypeScript a partir do banco local, salvando o resultado em arquivo versionado somente quando a geracao estiver validada e coerente com a baseline.

Os tipos TypeScript foram gerados automaticamente pela Supabase CLI em `src/types/database.types.ts`.

O arquivo representa a baseline local real, sem tabelas de dominio, sem credenciais e sem dados.

## Scripts npm de banco

Scripts npm adicionados:

- `db:start`;
- `db:stop`;
- `db:status`;
- `db:migrate`;
- `db:reset`;
- `db:lint`;
- `db:test`;
- `db:types`.

Os scripts nao deverao depender de caminhos absolutos do computador.

Os scripts de ciclo local foram executados durante a validacao tecnica: start, status, migrate, reset, lint, test, types e stop.

## Arquivos criados nesta etapa

- `supabase/config.toml`;
- `supabase/.gitignore`;
- `supabase/migrations/20260711234346_baseline_local_database.sql`;
- `supabase/seed.sql`;
- `supabase/tests/000-baseline.test.sql`.
- `src/types/database.types.ts`.

## Validacoes locais executadas

- Start local aprovado.
- Status local aprovado sem registrar chaves na documentacao.
- Migracao baseline aplicada localmente.
- Reset local aprovado.
- Seed vazio executado sem inserir registros.
- Lint SQL aprovado.
- 1 arquivo SQL e 3 testes pgTAP aprovados.
- Tipos TypeScript gerados.
- `src/types/database.types.ts` gerado pela Supabase CLI.
- Typecheck aprovado apos a geracao dos tipos.
- Supabase local encerrado apos as validacoes.
- Containers locais do projeto parados apos encerramento.
- `docker ps` validado sem conteineres em execucao.
- Lint da aplicacao aprovado.
- Typecheck aprovado.
- 6 arquivos e 14 testes da aplicacao aprovados.
- Build aprovado.
- Check aprovado.

## Encerramento

- Estado alterado para Concluida apos validacao tecnica.
- Todas as validacoes da sprint foram aprovadas.
- Os conteineres e servicos locais do Supabase foram encerrados apos a validacao.
- A aplicacao Next.js ainda nao esta funcionalmente conectada ao banco.
- Autenticacao, instituicoes, isolamento institucional e RLS de dominio pertencem a Sprint 03.
- Nenhum dado real foi utilizado.
- Nenhum projeto Supabase remoto foi vinculado.

## Comandos remotos nao executados

- `supabase login`;
- `supabase link`;
- comandos com projeto remoto;
- comandos com credenciais externas.

## Seguranca

- Nenhum dado real.
- Nenhum dado identificavel.
- Nenhum segredo versionado.
- Banco local separado de producao.
- Nenhum acesso a projeto remoto.
- Nenhuma credencial hospitalar.
- Preparacao para RLS futura sem criar RLS decorativa.
- Preparacao para isolamento institucional futuro sem antecipar tabelas de hospitais ou usuarios.
- Nao declarar adequacao completa a LGPD apenas por usar banco local.
- Durante a execucao, servicos locais do Supabase podem ficar acessiveis em portas locais da maquina. O uso e restrito a desenvolvimento local controlado.
- E proibido usar dados reais.

## Itens fora do escopo

- Autenticacao.
- Usuarios.
- Login.
- Perfis.
- Permissoes.
- RLS definitiva.
- Isolamento multi-hospital definitivo.
- Organizacoes.
- Hospitais.
- Unidades.
- Setores.
- Profissionais.
- Pacientes.
- Episodios.
- Evolucoes.
- Diagnosticos.
- Protocolos funcionais.
- Exames.
- Medicamentos.
- Insumos.
- Estoque.
- Leitos.
- Indicadores.
- APIs clinicas.
- Telas.
- Formularios.
- Dados reais.
- Integracao com sistemas externos.
- Banco remoto.
- Ambiente de homologacao.
- Ambiente de producao.

## Criterios de conclusao

- Supabase local inicia.
- Supabase local encerra.
- PostgreSQL responde.
- Status e consultavel.
- Migracoes sao aplicadas.
- Reset reconstroi o banco a partir de estado limpo.
- Testes SQL passam.
- Tipos TypeScript sao gerados.
- Scripts npm funcionam.
- Nenhuma tabela clinica existe.
- Nenhum dado real existe.
- Nenhum segredo esta versionado.
- `npm run lint` passa.
- `npm run typecheck` passa.
- `npm run test` passa.
- `npm run build` passa.
- `npm run check` passa.
- Documentacao corresponde ao estado real.
- Git mostra somente mudancas da Sprint 02.

## Riscos no Windows

- Docker Desktop pode estar ausente ou fora do PATH.
- O servico Docker pode nao estar em execucao.
- Portas locais do Supabase podem conflitar com outros servicos.
- O caminho do projeto contem espacos e exige cuidado em comandos manuais.
- O uso de PowerShell pode exigir `npm.cmd`.
- O aviso externo de Git sobre `C:\Users\neto\.config\git\ignore` permanece fora do repositorio.
- O download de dependencias pode depender de cache npm com permissao adequada.

## Estado atual

Concluida.

O ciclo local do banco foi executado e encerrado. Nao ha tabelas de dominio, nao ha seed com dados, nao ha dados reais, nao ha vinculo remoto e nao ha integracao da aplicacao com o banco nesta sprint.

Permanece documentada em `KNOWN_ISSUES.md` a vulnerabilidade moderada ja conhecida do PostCSS via Next.js.
