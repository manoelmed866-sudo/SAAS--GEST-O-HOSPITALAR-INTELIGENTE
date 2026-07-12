# CHANGELOG.md

## Changelog

Todas as mudancas relevantes do projeto devem ser registradas aqui.

## 2026-07-11

### Planejamento - Sprint 03

- Aberto o planejamento tecnico da Sprint 03 na branch `sprint/03-autenticacao-instituicoes-permissoes`.
- Registrado modelo recomendado para autenticacao, organizacoes, hospitais, perfis, vinculos institucionais, vinculos hospitalares, papeis, permissoes, contexto ativo e RLS.
- Registrada recomendacao de bloquear cadastro publico inicial e priorizar usuarios previamente cadastrados ou convidados.
- Registrado faseamento 03A, 03B, 03C e 03D, sem implementar codigo funcional.
- Confirmado que nenhuma dependencia, migracao, API, tela, usuario, dado ficticio, Docker ou Supabase foi criado nesta etapa.

### Decisoes aprovadas - Sprint 03

- Adotado `organization` como nome tecnico canonico e Instituicao como termo principal de interface e documentacao voltada ao usuario.
- Aprovado cadastro publico bloqueado na primeira implementacao, com entrada por convite institucional ou provisionamento administrativo.
- Aprovado convite institucional obrigatorio para usuarios comuns, com uso unico, expiracao, revogacao e auditoria.
- Aprovada confirmacao de e-mail no fluxo de convite, testada localmente com Mailpit.
- Aprovados os papeis minimos `platform_admin`, `organization_admin`, `hospital_admin`, `auditor` e `member`.
- Registrados limites de criacao e gestao de hospitals, separando plataforma, organization e hospital.
- Registrado auditor inicial como papel somente leitura, sem acesso clinico automatico.
- Registrado que, naquela etapa de decisoes, a Sprint 03A ainda nao havia sido iniciada.

### Implementacao escrita - Sprint 03A

- Criadas migracoes versionadas para modelo institucional, profiles, organizations, hospitals, memberships, papeis relacionais, permissoes relacionais e mapeamentos.
- Criado schema privado `app_private` com funcao tecnica de `updated_at` e funcoes booleanas de autorizacao para RLS.
- Escritas politicas RLS, grants minimos e revogacoes para as 11 tabelas publicas da Sprint 03A.
- Criados testes pgTAP de estrutura, integridade e RLS com dados ficticios transacionais e rollback.
- Confirmado que Sprint 03B, Sprint 03C e Sprint 03D nao foram iniciadas.

### Encerramento tecnico - Sprint 03A

- Concluida a Sprint 03A com modelo institucional, vinculos, papeis, permissoes, schema privado `app_private`, funcoes de autorizacao, RLS e grants minimos.
- Confirmadas 11 tabelas publicas, 4 migracoes da Sprint 03A, RLS nas 11 tabelas, ausencia de grants `DELETE`, ausencia de politicas para `anon`, ausencia de `platform_admin` semeado e ausencia de trigger em `auth.users`.
- Aprovados `db:reset`, `db:lint` e `db:test`, com 4 arquivos SQL e 70 verificacoes pgTAP.
- Regenerado `src/types/database.types.ts` pela Supabase CLI.
- Aprovados lint, typecheck, 6 arquivos de testes da aplicacao, 14 testes da aplicacao, build e check completo.
- Registradas correcoes nos testes pgTAP: baseline da Sprint 02, assinatura de `throws_ok`, CTE modificadora e fixture do `hospital_admin`.
- Confirmado que nenhuma migracao foi alterada apos a primeira validacao local.
- Confirmado que Supabase local foi encerrado e que nao havia conteineres em execucao apos a validacao.
- Confirmado que nenhum dado clinico, dado real, usuario real, credencial versionada ou projeto Supabase remoto foi criado.
- Mantido o acompanhamento da vulnerabilidade moderada transitiva de PostCSS em `KNOWN_ISSUES.md`, sem executar correcao forcada.
- Mantidas Sprint 03B, Sprint 03C e Sprint 03D como nao iniciadas.

### Encerramento - Sprint 02

- Encerrada a Sprint 02 na branch `sprint/02-banco-local-migracoes`.
- Criada a fundacao local do Supabase para desenvolvimento e testes.
- Registrados migracao baseline, seed vazio, testes SQL e geracao de tipos TypeScript.
- Adicionados scripts npm de banco para start, stop, status, migrate, reset, lint, test e types.
- Confirmado que nenhum banco remoto foi vinculado.
- Confirmado que nenhuma entidade clinica ou institucional foi criada.
- Mantida documentada em `KNOWN_ISSUES.md` a vulnerabilidade transitiva moderada ja conhecida do PostCSS via Next.js 16.2.10.

### Realinhamento - Sprint 02

- Redefinida oficialmente a Sprint 02 como fundacao local do banco de dados e das migracoes.
- Posicionado o banco local antes da autenticacao, contexto institucional, isolamento e permissoes da Sprint 03.
- Preservado o design system como trilha transversal do produto, com evolucao por componentes realmente utilizados.
- Registrado que nenhuma implementacao de banco, Supabase, Docker, migracao, tabela ou seed foi realizada nesta correcao documental.
- Confirmado que nenhum escopo funcional foi removido da Visao Funcional Completa.

### Sprint 02 - Preparacao local parcial

- Instalada Supabase CLI 2.109.1 como dependencia de desenvolvimento local e versao exata.
- Inicializada configuracao local versionavel em `supabase/config.toml`.
- Criada migracao baseline apenas com comentarios SQL, sem tabelas de dominio.
- Criado seed vazio e teste SQL preparatorio para a baseline.
- Adicionados scripts npm de banco sem inclui-los no `check`.
- Registrado que Docker ainda nao foi validado, nenhum container foi iniciado, nenhuma migracao foi aplicada e nenhum banco foi validado.

### Sprint 02 - Refinamento tecnico final

- Registrado ciclo local completo do banco com start, status, migracao, reset, lint SQL, testes SQL, geracao de tipos e stop.
- Registrados 1 arquivo SQL e 3 testes pgTAP aprovados.
- Gerado `src/types/database.types.ts` pela Supabase CLI a partir da baseline local.
- Removida a dependencia redundante `vite-tsconfig-paths`, adotando resolucao nativa de caminhos do Vite.
- Corrigido o teste de `global-error` para validar `html`, `body` e `main` por markup estatico, sem alterar a implementacao do Next.js.
- Confirmada ausencia de tabelas de dominio, seed com dados, dados reais e vinculo remoto.

### Sprint 01 - Fundacao tecnica

- Encerrada a Sprint 01 na branch `sprint/01-fundacao-local`.
- Criada fundacao local da aplicacao com Next.js, React, TypeScript, Tailwind CSS, ESLint, Zod, Vitest, React Testing Library e jsdom.
- Criada estrutura `src/app` com layout institucional, pagina inicial, loading, erro global, erro de rota e pagina not-found.
- Criada validacao estrutural publica para `NEXT_PUBLIC_APP_NAME` e `NEXT_PUBLIC_APP_ENV`, sem segredos e sem `.env.local`.
- Criados testes automatizados para pagina inicial, cabecalho, loading, not-found, estado de erro e configuracao publica.
- Criados `README.md` e documentacao da Sprint 01.
- Validados build, check completo, pagina inicial HTTP 200 e rota inexistente HTTP 404.
- Registrada a correcao de acessibilidade para garantir um unico landmark `<main>` por pagina.
- Concluidas as validacoes tecnicas da Sprint 01.
- Identificada vulnerabilidade transitiva moderada CVE-2026-41305 / GHSA-qx2v-qp2m-jg93 em PostCSS abaixo de 8.5.10, via dependencia privada/transitiva do Next.js 16.2.10.
- Preservado Next.js 16.2.10; `npm audit fix --force` nao foi executado para evitar downgrade forçado para Next.js 9.3.3.
- Incluido acompanhamento do achado em `KNOWN_ISSUES.md`.

### Corrigido - Sprint 01

- Corrigida frase residual em `SPRINT_STATUS.md` que ainda indicava a Sprint 00 como nao concluida.
- Corrigida frase residual em `SPRINT_STATUS.md` que ainda indicava a Sprint 01 como nao iniciada.
- Corrigido aninhamento potencial de landmarks `<main>` em telas de erro e not-found, preservando um unico `main` por pagina.
- Fechado o achado medio da revisao tecnica sem alterar dependencias.

### Encerrado

- Encerrada documentalmente a Sprint 00.
- Consolidada a Visao Funcional Completa como posicionamento oficial do produto.
- Registrados historico longitudinal, linha do tempo, evolucoes assistenciais, protocolos, exames, recursos, areas por perfil, seguranca e plano de sprints.
- Aprovado o primeiro versionamento documental da plataforma.
- Confirmado que nenhuma funcionalidade, codigo-fonte, banco, migracao, API ou tela foi implementada nesta sprint.

### Corrigido

- Incluida hipotese diagnostica como conceito explicito no modelo documental.
- Incluido recurso sugerido como conceito proprio.
- Diferenciados recursos previstos, sugeridos, solicitados e utilizados.
- Incluida forma de chegada como conceito configuravel por hospital.
- Incluido canal de comunicacao como conceito configuravel e auditavel.
- Esclarecido o papel do modulo Inicio como central de comando progressiva.
- Registrados aprofundamentos futuros de seguranca.
- Incluido historico longitudinal do paciente como visao derivada.
- Incluida linha do tempo do episodio como conceito separado de evolucao assistencial.
- Incluidas evolucoes assistenciais, evolucao medica, evolucoes multiprofissionais, complementacao e retificacao.
- Registrada autorizacao por perfil, contexto e vinculo assistencial.
- Registrado que administrador nao recebe acesso clinico automatico.
- Refinada a Sprint 06 para rede de referencia, comunicacao institucional e relacionamentos externos.
- Refinada a Sprint 13 como responsavel pelo historico longitudinal funcional do paciente.
- Refinada a Sprint 16 para separar recurso previsto, sugerido, solicitado e utilizado.
- Adotado Evento do Episodio como termo canonico no modelo de dominio.
- Atualizado escopo para diferenciar evolucoes assistenciais essenciais de prontuario eletronico completo.
- Reposicionado o produto como Visao Funcional Completa.
- Substituido o uso de MVP como limite funcional por Primeira Versao Operacional.
- Registrado que as sprints sao fases de construcao e nao limites finais do produto.
- Diferenciados nucleo da plataforma, integracoes e sistemas externos.

### Adicionado

- Criada documentacao permanente da Sprint 00.
- Registrado escopo do produto.
- Registrada arquitetura conceitual.
- Registradas regras funcionais conhecidas.
- Registrados itens fora do escopo da primeira versao.
- Criado glossario inicial.
- Criado registro inicial de decisoes.
- Criado registro de pendencias e riscos conhecidos.
- Criado plano mestre da Sprint 00 ate a Sprint 22.
- Criado status inicial das sprints.
- Criado modelo conceitual de dominio sem SQL.
- Criados principios de seguranca.
- Criado conceito do motor de protocolos.
- Criado documento de historico do paciente e evolucoes.
- Criada matriz conceitual de acesso por perfil.
- Criado documento de areas de trabalho por perfil.

### Nao realizado

- Nenhum codigo-fonte foi criado.
- Nenhuma dependencia foi instalada.
- Nenhum banco de dados foi configurado.
- Nenhuma tela foi criada.
- Nenhuma API foi criada.
- Nenhum commit foi realizado.
