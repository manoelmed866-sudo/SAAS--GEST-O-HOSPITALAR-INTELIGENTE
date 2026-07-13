# SPRINT_STATUS.md

## Status das sprints

Este arquivo acompanha o estado macro do plano de desenvolvimento.

As sprints constroem progressivamente a Visao Funcional Completa. A Primeira Versao Operacional sera um recorte integrado e validavel, nao o limite final do produto.

| Etapa | Nome | Status |
| --- | --- | --- |
| Sprint 00 | Documentacao permanente | Concluída |
| Sprint 01 | Fundacao visual e tecnica inicial | Concluída |
| Sprint 02 | Fundacao local do banco e migracoes | Concluída |
| Sprint 03 | Autenticacao, contexto institucional e extensao visual autenticada | Concluída |
| Sprint 04 | Administracao, governanca e design system autenticado inicial | Em andamento |
| Sprint 05 | Cadastro institucional hospitalar | Pendente |
| Sprint 06 | Rede de referencia e comunicacao institucional | Pendente |
| Sprint 07 | Episodios assistenciais | Pendente |
| Sprint 08 | Mapa do hospital | Pendente |
| Sprint 09 | Eventos do Episodio | Pendente |
| Sprint 10 | Formularios dinamicos | Pendente |
| Sprint 11 | Protocolos institucionais | Pendente |
| Sprint 12 | Versionamento de protocolos | Pendente |
| Sprint 13 | Execucao de protocolos e historico longitudinal | Pendente |
| Sprint 14 | Gestao clinica e linha do tempo sem automacao decisoria | Pendente |
| Sprint 15 | Exames, diagnostico e evolucoes assistenciais | Pendente |
| Sprint 16 | Medicamentos, insumos e recursos | Pendente |
| Sprint 17 | Operacao hospitalar | Pendente |
| Sprint 18 | Indicadores | Pendente |
| Sprint 19 | Alertas | Pendente |
| Sprint 20 | Auditoria, logs e seguranca ampliada | Pendente |
| Sprint 21 | Testes integrados e hardening | Pendente |
| Sprint 22 | Auditoria interna da versao candidata | Pendente |
| Auditoria Claude | Revisao externa de arquitetura, seguranca e escopo | Pendente |

## Regra de atualizacao

- A Sprint 00 permanece concluida apos validacao documental de Manoel Neto.
- Nenhuma sprint deve ser marcada como concluida sem validacao.
- Nenhuma sprint futura deve ser iniciada sem autorizacao explicita.

## Observacao sobre o modulo Inicio

O modulo Inicio sera a central de comando e apresentacao resumida da plataforma. Ele sera implementado progressivamente durante as sprints dos demais modulos e consolidado na Sprint 20, quando indicadores e alertas estiverem disponiveis.

## Observacao sobre historico, evolucoes e acesso

Historico longitudinal, linha do tempo, evolucoes assistenciais, complementacao, retificacao, matriz de acesso e areas de trabalho por perfil foram documentados na Sprint 00 para implementacao futura. A Sprint 01 foi concluida sem implementar modulos clinicos.

## Observacao sobre Sprint 01

- Todas as validacoes funcionais da fundacao tecnica passaram: lint, typecheck, testes, build, check, pagina inicial HTTP 200 e rota inexistente HTTP 404.
- A Sprint 01 foi concluida com 6 arquivos de teste e 14 testes aprovados.
- Ha ressalva de seguranca transitiva documentada em `KNOWN_ISSUES.md`: CVE-2026-41305 / GHSA-qx2v-qp2m-jg93 em PostCSS abaixo de 8.5.10, via dependencia privada/transitiva do Next.js 16.2.10.
- A Sprint 02 foi realinhada posteriormente para fundacao local do banco e migracoes.

## Observacao sobre Sprint 02

- A Sprint 02 foi concluida apos validacao tecnica.
- A Sprint 02 estabeleceu a fundacao local do banco PostgreSQL por meio do Supabase local e migracoes reproduziveis.
- Docker Desktop 29.6.1 e Docker Compose 5.2.0 foram utilizados na validacao local.
- Supabase CLI 2.109.1 foi instalada como dependencia de desenvolvimento local em versao exata.
- Start e status local foram aprovados.
- A migracao baseline foi aplicada.
- O reset local foi aprovado.
- O lint SQL foi aprovado.
- 1 arquivo SQL e 3 testes pgTAP foram aprovados.
- `src/types/database.types.ts` foi gerado pela Supabase CLI.
- Lint, typecheck, 14 testes da aplicacao, build e check foram aprovados.
- Os servicos locais foram encerrados apos a validacao.
- Nenhuma tabela de dominio foi criada e nenhum dado real foi utilizado.
- O design system permanece como trilha transversal do produto, sem ser removido do planejamento.
- A Sprint 03 permanece sem implementacao funcional.

## Observacao sobre Sprint 03

- A Sprint 03 foi aberta em modo de planejamento tecnico e entrou em execucao pela Sprint 03A.
- O planejamento adota `organization` como nome tecnico canonico e Instituicao como termo principal de interface e documentacao voltada ao usuario.
- O planejamento aprova modelo institucional com organizations, hospitals, profiles, vinculos institucionais, vinculos hospitalares, papeis, permissoes, contexto ativo validado, convites institucionais, confirmacao de e-mail e RLS por padrao.
- Papeis minimos aprovados: `platform_admin`, `organization_admin`, `hospital_admin`, `auditor` e `member`.
- Cadastro publico fica bloqueado na primeira implementacao; usuarios comuns entram por convite institucional.
- Sprint 03A esta concluida: modelo institucional, memberships, papeis, permissoes, funcoes privadas, RLS, grants e testes pgTAP foram implementados.
- Sprint 03A criou 11 tabelas publicas, 4 migracoes, schema privado `app_private`, funcoes booleanas de autorizacao, papeis e permissoes relacionais, RLS nas 11 tabelas, grants minimos, sem `DELETE`, sem politicas para `anon`, sem `platform_admin` semeado e sem trigger em `auth.users`.
- Validacao local da Sprint 03A concluida: `db:reset`, `db:lint`, `db:test`, geracao de tipos, lint, typecheck, testes da aplicacao, build e check completo aprovados.
- Resultado validado da Sprint 03A: 4 arquivos SQL e 70 verificacoes pgTAP aprovadas; 6 arquivos de testes da aplicacao e 14 testes aprovados.
- `src/types/database.types.ts` foi regenerado pela Supabase CLI.
- Supabase local foi encerrado apos a validacao e `docker ps` foi validado sem conteineres em execucao.
- Nenhuma tabela clinica, dado real, dado clinico, usuario real, credencial versionada ou projeto Supabase remoto foi criado.
- Sprint 03B foi concluida e versionada: infraestrutura Supabase SSR, validacao publica de ambiente, clientes tipados, cookies e Proxy de renovacao de sessao.
- Sprint 03B nao implementou login, logout, protecao de rotas, redirecionamentos, convites, usuarios, contexto ativo, APIs de negocio, novas tabelas ou novas migracoes.
- Validacao tecnica da Sprint 03B: lint, typecheck, 11 arquivos de testes, 43 testes, build sem `.env.local` e check completo aprovados.
- Auditorias npm da Sprint 03B mantem apenas a vulnerabilidade moderada ja conhecida de PostCSS via Next.js, sem vulnerabilidade alta ou critica nova.
- Sprint 03C foi implementada e validada localmente: autenticacao por e-mail e senha, logout, rota protegida `/painel`, pagina de acesso negado, redirecionamento seguro e validacao de usuario com perfil/vinculo ativo.
- Sprint 03C nao implementa cadastro publico, convites, recuperacao de senha, confirmacao de e-mail funcional, MFA, contexto institucional ativo, selecao de instituicao, selecao de hospital, novas tabelas, migracoes, APIs de negocio ou modulos clinicos.
- Validacao da Sprint 03C confirmou bloqueio por profile inativo, bloqueio por vinculo invalido, acesso institucional valido e acesso hospitalar valido, todos validados por RLS no banco e no servidor.
- Defeito corrigido na Sprint 03C: a consulta hospitalar em `src/lib/auth/access.ts` embutia `organizations!inner`, cuja leitura e negada por RLS a usuario hospital-only sem papel organizacional, negando indevidamente acesso a `/painel`. A correcao removeu apenas esse embed e o filtro de status de organization associado, sem alterar RLS, migracoes ou ampliar permissoes; a exigencia de organization ativa permanece garantida transitivamente pela funcao de permissao hospitalar.
- Validacao manual end-to-end da Sprint 03C aprovada: usuario hospital-only autenticado chegou a `/painel` sem redirecionamento para `/acesso-negado` e sem tela de erro.
- Resultado validado da Sprint 03C: 76 testes unitarios e 73 verificacoes pgTAP aprovados, incluindo novo teste pgTAP de regressao de acesso hospitalar; lint, typecheck, build, `db:lint` e `db:test` aprovados.
- Vulnerabilidade moderada transitiva ja conhecida de PostCSS via Next.js permanece acompanhada em `KNOWN_ISSUES.md`; `npm audit fix --force` continua proibido por causar downgrade forcado do Next.js.
- Sprint 03D1 concluida como checkpoint independente: inventario server-side de organizations e hospitals autorizados em `src/lib/auth/context.ts`, com o RLS da Sprint 03A como filtro definitivo e Opcao A sem migration.
- Sprint 03D1 nao criou UI, seletor, persistencia de contexto, papeis ativos, migration, RLS, grant, papel ou permissao; usa apenas o cliente Supabase server-side autenticado, sem service role.
- O inventario retorna `{ status: "success", inventory }` ou `{ status: "error" }`, sem dados parciais em erro; usuario hospital-only pode ter `organizations` vazio e `hospitals` preenchido, e `hospitalCount` deriva de `hospitals.length`.
- Resultado validado da Sprint 03D1: 84 testes unitarios e 83 verificacoes pgTAP aprovados; lint, typecheck, build, `db:lint` e `db:test` aprovados, incluindo novo teste pgTAP de inventario de contexto.
- Sprint 03D3 concluida como checkpoint independente: mecanismo seguro de contexto institucional ativo baseado no cookie `ghi_active_context`, com payload minimo `organizationId`, `hospitalId` e `v: 1`, `httpOnly`, `SameSite=Lax`, `Secure` em producao, `path` `/painel` e duracao de 12 horas.
- O cookie e apenas um ponteiro e nunca a fonte de autorizacao: `validateActiveContext` e `resolveActiveContext` revalidam o contexto no servidor sob RLS, consultando `hospitals` com filtros de `id`, `organization_id` e `status = 'active'`, sem service role.
- Definidos quatro estados discriminados `active`, `absent`, `invalid` e `error`: erro tecnico nao apaga automaticamente o contexto, contexto invalido nao e tratado como erro tecnico, e nunca ha contexto parcial. O `logoutAction` limpa o cookie sempre, antes de qualquer redirect ou erro do `signOut`.
- Confirmado sob RLS que papel hospitalar revogado com vinculo ativo e sem papel organizacional retorna 0 linhas, sem exigir correcao em TypeScript, migration ou RLS.
- Resultado validado da Sprint 03D3: 117 testes unitarios e 94 verificacoes pgTAP aprovados; lint, typecheck, build, `db:lint` e `db:test` aprovados. Nenhuma migration criada e nenhuma ampliacao de RLS, grants, roles ou permissions; nenhuma UI ou seletor criado.
- Sprint 03D2 concluida como checkpoint independente: rota protegida `/painel/selecionar-contexto` (Server Component `force-dynamic`) com link de entrada "Selecionar hospital" no painel, seletor visual de contexto e Server Action co-localizada.
- O seletor usa Client Component com `useActionState` e radiogroup, sem selecao automatica mesmo com um unico hospital, exigindo confirmacao explicita; suporta usuario hospital-only com `organizations` vazio sem inventar nome de organizacao.
- A pagina consome `getAuthorizedContextInventory()` sob RLS e renderiza estados distintos de selecao, inventario vazio e falha tecnica; a Server Action valida `organizationId:hospitalId` com Zod, revalida por `validateActiveContext`, grava o cookie apenas quando `active` e redireciona fixo para `/painel`, ignorando `next` do navegador.
- Sprint 03D2 nao criou dashboard contextual nem exibe o hospital ativo no painel; isso fica para a Sprint 03D4, que tambem revisara o texto antigo do painel sobre ainda nao existir contexto ativo.
- Nenhuma migration, RLS, grant, role ou permission foi alterada; nenhum service role, `localStorage` ou `sessionStorage`; nenhuma autorizacao depende do inventario renderizado.
- Validacao manual end-to-end da Sprint 03D2 aprovada com fixture ficticio efemero (removido ao final): login real, rota protegida, dois hospitais autorizados visiveis, hospital de outro tenant oculto, hospital-only funcionando, selecao repetida entre dois hospitais, logout e novo login e troca de contexto aprovados.
- Resultado validado da Sprint 03D2: 157 testes unitarios e 94 verificacoes pgTAP aprovados; lint, typecheck, build, `db:lint` e `db:test` aprovados.
- Sprint 03D4 concluida como checkpoint independente: o painel `/painel` passou a exibir o contexto hospitalar ativo, resolvendo o contexto apos o gate de acesso na ordem `requirePortalAccess()` e depois `resolveActiveContext()`, e renderizando distintamente os quatro estados `active`, `absent`, `invalid` e `error`.
- O tipo `ActiveContext` foi enriquecido com `hospitalCode` e `hospitalDisplayName`; nome e codigo vem exclusivamente da linha de `hospitals` revalidada sob RLS, nunca do cookie. `validateActiveContext` continua com uma unica consulta a `hospitals` (`id, organization_id, code, display_name`), sem segunda consulta e sem join de autorizacao; o cookie `ghi_active_context` permanece minimo, sem persistir nome ou codigo.
- No painel: `active` exibe "Plantao ativo", nome e codigo do hospital e o link "Trocar hospital"; `absent`, `invalid` e `error` sao tratados inline, sem redirect automatico; `error` permanece distinto e nao apaga o cookie; logout permanece em todos os estados; nenhum UUID e exibido e nenhuma organizacao e exigida para usuario hospital-only. O texto antigo do painel sobre ainda nao existir contexto ativo foi corrigido.
- Validacao E2E real da Sprint 03D4 aprovada com fixture ficticio efemero (removido integralmente ao final): login aprovado; estado `absent` aprovado; Hospital Alfa E2E exibido como ativo com nome e codigo corretos; Hospital Gama E2E de outro tenant oculto; troca de Alfa para Beta aprovada, com Alfa deixando de permanecer ativo; logout aprovado; novo login retornou ao estado `absent`. Estados `invalid` e `error` foram validados por testes automatizados, nao forcados manualmente.
- Resultado validado da Sprint 03D4: 176 testes unitarios e 94 verificacoes pgTAP aprovados; lint, typecheck, build, `db:lint` e `db:test` aprovados. Nenhuma migration, RLS, grant, role, permission ou Proxy foi alterada; nenhum modulo clinico foi criado. Decisao registrada como DEC-052.
- Sprint 03D5 concluida como checkpoint de encerramento tecnico da Sprint 03, exclusivamente documental: nao introduziu codigo, teste, migration, capabilities, alteracao de RLS/grants/roles/permissions/cookie/Proxy/paginas. A 03D5 nao tinha escopo oficial previo; os criterios da Sprint 03D ja haviam sido cumpridos por 03D1 a 03D4. Decisao registrada como DEC-053.
- Sprint 03 CONCLUIDA. Subfases concluidas: 03A (modelo institucional e RLS), 03B (clientes Supabase SSR e sessao), 03C (login, logout, rotas protegidas e acesso negado), 03D1 (inventario autorizado), 03D2 (seletor visual de contexto), 03D3 (cookie minimo e revalidacao de contexto), 03D4 (painel contextual com hospital ativo) e 03D5 (checkpoint de encerramento tecnico).
- Resultado consolidado da Sprint 03 no encerramento: 176 testes unitarios e 94 verificacoes pgTAP aprovados; lint, typecheck, build e `db:lint` aprovados; validacoes E2E das etapas 03D2 e 03D4 aprovadas; nenhum segredo versionado; nenhuma pendencia de fixture.
- Pendencias transferidas para a Sprint 04: resolucao de capacidades efetivas com uniao dos escopos de plataforma, organizacao e hospital; capacidades semanticas; gestao de usuarios e vinculos; gestao de papeis e permissoes; convites; interfaces administrativas; workspaces por perfil; design system autenticado; gates de modulos por capacidade.
- Sprint 04 e a proxima etapa e ainda nao foi iniciada; nenhuma capacidade efetiva foi implementada na Sprint 03.

## Observacao sobre Sprint 04

- Sprint 04 EM ANDAMENTO na branch `sprint/04-administracao-governanca` (criada a partir do merge da Sprint 03 na main).
- Sprint 04A CONCLUIDA: contrato SQL de capacidades efetivas do hospital ativo e consumidor server-side TypeScript.
  - Funcao `public.get_effective_hospital_capabilities(uuid)`, `SECURITY INVOKER`, une os tres escopos (plataforma, organizacao e hospital) por OR monotonica e devolve cinco booleanos semanticos: `canReadHospital`, `canReadMemberships`, `canManageMemberships`, `canReadAudit`, `canSwitchContext`.
  - Resolver `resolveActiveHospitalCapabilities()` sem argumentos; o hospital vem apenas do contexto ativo revalidado; validacao Zod estrita com array de tamanho 1; fail-closed em resposta malformada; nenhum codigo cru de permissao exposto. Tipos Supabase regenerados apenas para a nova funcao.
  - Capacidades efetivas disponiveis SOMENTE no servidor; nenhum painel ou interface consome as capacidades ainda; o cookie permanece minimo. Decisao registrada como DEC-054.
- Sprint 04B ainda nao iniciada. Proximas subfases sugeridas (nao iniciadas): 04B consumo das capacidades e gates server-side; 04C administracao de usuarios e vinculos; 04D gestao de papeis e permissoes; 04E design system autenticado e workspaces iniciais.
- Resultado validado da Sprint 04A: 227 testes unitarios e 115 verificacoes pgTAP aprovados; lint, typecheck, build e `db:lint` aprovados. Nenhuma policy, RLS ou grant de tabela foi alterado; nenhuma interface ou CRUD implementado; nenhum modulo clinico criado.

## Observacao sobre Sprint 06 e Sprint 13

A Sprint 06 trata rede de referencia, comunicacao institucional e relacionamentos externos. O historico longitudinal funcional do paciente fica reservado para a Sprint 13.

## Encerramento da Sprint 00

- Validacao documental realizada por Manoel Neto em 2026-07-11.
- Sprint 00 aprovada para encerramento documental.
- Primeiro commit autorizado na branch `sprint/00-documentacao`.
- Todas as demais sprints permanecem pendentes.
- A Sprint 01 foi iniciada posteriormente na branch `sprint/01-fundacao-local` e concluida apos validacao tecnica.
