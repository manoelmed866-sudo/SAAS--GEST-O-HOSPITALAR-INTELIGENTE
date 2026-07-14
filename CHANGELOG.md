# CHANGELOG.md

## Changelog

Todas as mudancas relevantes do projeto devem ser registradas aqui.

## 2026-07-14

### Checkpoint - Sprint 04B - Gates server-side por capacidade

- Sprint 04B concluida na branch `sprint/04-administracao-governanca`: primeiro consumo visual das capacidades da 04A, com navegacao condicional e gate server-side, ainda sem CRUD.
- Criado o helper `evaluateHospitalCapability(capability)` em `src/lib/auth/capability-gate.ts`: argumento restrito a `HospitalCapability = keyof HospitalCapabilities`; chama `resolveActiveHospitalCapabilities()` exatamente uma vez e devolve resultado discriminado `allowed`/`denied` (com o mesmo `ActiveContext` revalidado) ou propaga `absent`/`invalid`/`error`. Sem Supabase direto, sem cookie, sem redirect/notFound, sem `service_role` e sem devolver o mapa completo de capacidades.
- Painel `/painel` passou a consumir `resolveActiveHospitalCapabilities()` como fonte unica de contexto e capacidades (nao chama mais `resolveActiveContext` diretamente), preservando os quatro estados, o nome/codigo do hospital e o logout. Link "Gerenciar equipe" (para `/painel/admin/equipe`) condicionado somente a `canManageMemberships`; quando falso, o link nao existe, sem botao desabilitado. "Trocar hospital" permanece incondicional no estado `active`.
- Criada a rota administrativa demonstrativa `/painel/admin/equipe` (Server Component `force-dynamic`): `requirePortalAccess()` e depois `evaluateHospitalCapability("canManageMemberships")`, com cinco estados (`allowed`, `denied`, `absent`, `invalid`, `error`), protegida no servidor contra acesso direto por URL. Ausencia de CRUD: nenhum formulario administrativo, Server Action de mutacao ou consulta direta a Supabase; somente o formulario de logout.
- Adicionados testes: `tests/unit/auth-capability-gate.test.ts` (20), `tests/unit/auth-admin-team-page.test.tsx` (6), `tests/unit/sprint-04b-static-security.test.ts` (36 estaticos) e atualizacao de `tests/unit/auth-pages.test.tsx`; `tests/unit/sprint-03d4-static-security.test.ts` atualizado minimamente para o novo consumo, preservando as demais garantias da 03D4.
- E2E assistido aprovado por fluxo HTTP real contra Next.js e Supabase locais, com sessoes isoladas por usuario e sem navegador grafico: `member` sem o link e negado por URL direta (estado `denied` generico); `hospital_admin` com o link e autorizado ("Gestao da equipe" com o hospital do contexto); logout validado nos dois contextos; nenhuma capacidade, papel, UUID ou permissao crua exposta; nenhuma capacidade no cookie.
- Fixtures temporarias do E2E integralmente removidas, com contagens finais de conferencia zeradas; nenhum arquivo temporario, credencial ou relatorio permaneceu no repositorio.
- Nenhuma mudanca em banco, migration, RPC, RLS, grants, cookie, contexto, access ou Proxy.
- Aprovados lint, typecheck, 292 testes unitarios, build, `db:lint` e 115 verificacoes pgTAP.
- Decisao registrada em `DECISIONS.md` como DEC-055.

## 2026-07-13

### Checkpoint - Sprint 04A - Capacidades efetivas do hospital ativo

- Sprint 04A concluida na branch `sprint/04-administracao-governanca`: contrato SQL de capacidades efetivas e consumidor server-side, sem interface e sem CRUD.
- Criada a funcao RPC `public.get_effective_hospital_capabilities(target_hospital_id uuid)`, `language sql`, `stable`, **SECURITY INVOKER**, `set search_path = ''`, que retorna exatamente cinco booleanos semanticos e sempre uma unica linha: `can_read_hospital`, `can_read_memberships`, `can_manage_memberships`, `can_read_audit`, `can_switch_context`.
- A resolucao une os tres escopos de autorizacao (plataforma, organizacao proprietaria do hospital e hospital alvo) por OR monotonica, sem negacao nem precedencia; a capacidade so nasce de permissao explicitamente atribuida e `platform_admin` nao recebe capacidades implicitas.
- Por ser SECURITY INVOKER, o RLS da Sprint 03A permanece aplicavel; nao foi usado `service_role`; `EXECUTE` revogado de PUBLIC e `anon` e concedido apenas a `authenticated`. Nenhuma policy, RLS ou grant de tabela foi alterado; nenhuma role ou permission semeada foi modificada.
- Criado o resolver server-side `resolveActiveHospitalCapabilities()` em `src/lib/auth/capabilities.ts`, sem argumentos: o hospital alvo vem exclusivamente do contexto ativo revalidado por `resolveActiveContext()`; envia a RPC somente `target_hospital_id` (nunca `organizationId`) e devolve o mesmo `ActiveContext`.
- A resposta da RPC e validada com Zod estrito (cinco booleanos, array de tamanho exatamente 1); retorno malformado falha fechado como `{ status: "error" }`, sem capacidade parcial; o TypeScript recebe apenas cinco booleanos semanticos, sem expor codigo cru de permissao, papel ou scope.
- Regenerado `src/types/database.types.ts` pelo comando oficial `npm run db:types`, adicionando somente a nova funcao ao bloco `Functions` (Args `target_hospital_id: string`, Returns array de cinco booleanos).
- Adicionados testes: `supabase/tests/007-sprint-04a-effective-capabilities.test.sql` (21 pgTAP sob RLS, cobrindo os tres escopos, revogacao, suspensao, inatividade e isolamento entre hospitais), `tests/unit/auth-capabilities.test.ts` (19 testes de orquestracao, mapeamento e fail-closed) e `tests/unit/sprint-04a-static-security.test.ts` (32 testes estaticos de arquitetura e seguranca).
- Nenhuma interface, painel ou CRUD foi implementado; o cookie permanece minimo; o consumo visual das capacidades foi adiado. SECURITY DEFINER nao foi adotado.
- Aprovados lint, typecheck, 227 testes unitarios, build, `db:lint` e 115 verificacoes pgTAP.
- Decisao registrada em `DECISIONS.md` como DEC-054.

### Encerramento tecnico - Sprint 03 - Checkpoint 03D5

- Sprint 03 concluida. Consolidados os checkpoints 03A (modelo institucional e RLS), 03B (clientes Supabase SSR e sessao), 03C (login, logout, rotas protegidas e acesso negado), 03D1 (inventario autorizado), 03D2 (seletor visual de contexto), 03D3 (cookie minimo e revalidacao de contexto), 03D4 (painel contextual com hospital ativo) e 03D5 (checkpoint de encerramento tecnico).
- A 03D5 nao introduziu codigo novo: e uma etapa exclusivamente documental. Nao criou `capabilities.ts`, testes, migration, nem alterou RLS, grants, roles, permissions, cookie, Proxy ou paginas. A 03D5 nao possuia escopo oficial previamente definido; os criterios da Sprint 03D ja haviam sido cumpridos por 03D1 a 03D4.
- Capacidades efetivas transferidas para a Sprint 04, onde serao resolvidas considerando a uniao dos tres escopos de autorizacao (plataforma, organizacao e hospital), sem persistir permissao ou capacidade em cookie, com o RLS como barreira final e sem confiar exclusivamente na interface.
- Branch `sprint/03-autenticacao-instituicoes-permissoes` pronta para integracao posterior: 7 commits a frente e 0 atras da `main`, que permanece ancestral (merge fast-forward possivel).
- Resultado consolidado no encerramento: 176 testes unitarios e 94 verificacoes pgTAP aprovados; lint, typecheck, build e `db:lint` aprovados; validacoes E2E das etapas 03D2 e 03D4 aprovadas; nenhum segredo versionado; nenhuma pendencia de fixture.
- Decisao registrada em `DECISIONS.md` como DEC-053.

### Checkpoint - Sprint 03D4 - Exibe contexto hospitalar ativo no painel

- Painel `/painel` passou a resolver o contexto institucional ativo apos o gate de acesso, na ordem obrigatoria `requirePortalAccess()` e depois `resolveActiveContext()`, sem consultar o Supabase diretamente, sem `createClient`, sem service role, sem ler cookies diretamente, sem redirecionar e sem exibir UUIDs.
- Enriquecido o tipo `ActiveContext` em `src/lib/auth/context.ts` com `hospitalCode` e `hospitalDisplayName`; nome e codigo do hospital vem exclusivamente da linha de `hospitals` revalidada sob RLS, nunca do cookie e nunca de fallback com IDs.
- `validateActiveContext` continua com uma unica consulta a `hospitals`, agora com `select("id, organization_id, code, display_name")` e os mesmos filtros `id`, `organization_id` e `status = 'active'` via `maybeSingle()`, sem segunda consulta e sem join de autorizacao; o RLS da Sprint 03A permanece a barreira definitiva.
- Painel renderiza distintamente os quatro estados: `active` exibe "Plantao ativo", nome e codigo do hospital e o link "Trocar hospital"; `absent` e tratado inline com "Selecione um hospital" e link "Selecionar hospital", sem redirect automatico; `invalid` e tratado inline orientando nova selecao; `error` permanece distinto, generico e nao apaga o cookie. Logout permanece disponivel em todos os estados.
- Corrigido o texto antigo do painel que ainda afirmava que a sprint nao criava contexto ativo de hospital; nenhuma organizacao e exigida ou exibida para usuario hospital-only e nenhum UUID e exibido.
- O cookie `ghi_active_context` continua minimo, com apenas `organizationId`, `hospitalId` e `v`; nome e codigo nunca sao persistidos no cookie.
- Adicionado teste de revisao estatica de seguranca `tests/unit/sprint-03d4-static-security.test.ts`, com escopo por funcao, protegendo: painel consumindo gate e contexto pelas funcoes corretas e sem Supabase/cookie/storage/fetch/redirect/UUID/texto antigo/dominio clinico; `validateActiveContext` com consulta unica a `hospitals`, campos esperados e mapeamento de nome/codigo apenas da linha do banco; payload do cookie restrito a `organizationId`, `hospitalId` e `v`; e a acao de selecao revalidando por `validateActiveContext` e redirecionando apenas para `/painel`.
- Ampliados os testes `tests/unit/auth-context-validate.test.ts` e `tests/unit/auth-pages.test.tsx` para cobrir o novo contrato de contexto e a renderizacao dos estados do painel.
- Validacao E2E real aprovada em ambiente local com fixture ficticio efemero, removido integralmente ao final: login aprovado; estado `absent` aprovado; Hospital Alfa E2E exibido como ativo com nome e codigo corretos; Hospital Gama E2E de outro tenant oculto; troca de Alfa para Beta aprovada, com Alfa deixando de permanecer ativo; logout aprovado; novo login retornou ao estado `absent`. Estados `invalid` e `error` foram validados por testes automatizados, nao forcados manualmente.
- Nenhuma migration, RLS, grant, role, permission ou Proxy foi alterada; nenhum modulo clinico, paciente, protocolo, medicamento, estoque ou dado assistencial foi criado; nenhum `createClient` direto foi adicionado ao painel e nenhuma segunda consulta foi adicionada a `validateActiveContext`.
- Aprovados lint, typecheck, 176 testes unitarios, build, `db:lint` e 94 verificacoes pgTAP.
- Decisao registrada em `DECISIONS.md` como DEC-052.

## 2026-07-12

### Checkpoint - Sprint 03D2 - Seletor visual de contexto institucional

- Criada a rota protegida `/painel/selecionar-contexto` (Server Component `force-dynamic`), dentro da area do painel, protegida pelo Proxy existente e com o cookie de contexto no `path` `/painel`.
- Adicionado ponto de entrada por link simples "Selecionar hospital" no painel, apontando para `/painel/selecionar-contexto`, sem alterar o comportamento do painel nem exibir o hospital ativo (isso fica para a Sprint 03D4).
- Criado o Client Component `context-selector-form.tsx` com `useActionState`, exibindo os hospitais autorizados em um radiogroup com `name="contextSelection"` e valor `organizationId:hospitalId`; nenhuma selecao automatica, mesmo com um unico hospital, exigindo confirmacao explicita por botao.
- Suporte a usuario hospital-only: o nome da organizacao so aparece quando presente no inventario; com `organizations` vazio o hospital continua selecionavel e nenhum nome ficticio e inventado; nenhum UUID e exibido como texto.
- A pagina consome `getAuthorizedContextInventory()` sob RLS, na ordem `requirePortalAccess()` e depois inventario, e renderiza estados distintos: selecao, inventario vazio ("Nenhum hospital disponivel") e falha tecnica ("Nao foi possivel carregar seus hospitais"), tratando inventario vazio como diferente de erro tecnico.
- Criada a Server Action co-localizada `selectActiveContextAction`, que valida `organizationId:hospitalId` com Zod strict, revalida obrigatoriamente por `validateActiveContext` sob RLS, grava o cookie somente quando o resultado e `active` (usando os IDs vindos do banco) e faz `redirect("/painel")` fixo, ignorando qualquer `next` do navegador. Estados `invalid` e `error` sao separados, com mensagens genericas e sem expor UUIDs ou detalhes internos do Supabase.
- Ajustes de acessibilidade e visual: `main`/`section`, um unico `h1` por estado, classes existentes reutilizadas e CSS minimo novo para o radiogroup (radio nativo visivel, label clicavel, foco perceptivel, checked perceptivel, disabled perceptivel e layout em coluna para telas estreitas).
- Nenhuma migration, RLS, grant, role ou permission foi criada ou alterada; nenhum service role, `localStorage` ou `sessionStorage`; nenhuma autorizacao depende do inventario renderizado, sempre revalidado no servidor.
- Validacao manual end-to-end aprovada em ambiente local com fixture ficticio efemero (removido ao final): login real, rota protegida, dois hospitais autorizados visiveis, hospital de outro tenant oculto, caso hospital-only funcionando, selecao repetida entre dois hospitais, logout e novo login, e troca de contexto aprovada.
- Aprovados lint, typecheck, 157 testes unitarios, build, `db:lint` e 94 verificacoes pgTAP.

### Checkpoint - Sprint 03D3 - Contexto institucional ativo seguro

- Criado o modulo `src/lib/auth/context-cookie.ts`, responsavel exclusivamente pelo ciclo de vida do cookie `ghi_active_context`, sem importar Supabase, sem consultar banco, sem `localStorage` ou `sessionStorage` e sem registrar o conteudo do cookie.
- Definido payload minimo persistido: apenas `organizationId`, `hospitalId` e `v: 1`; nenhum papel, permissao, nome institucional ou dado clinico. A versao `v` e acrescentada internamente pelo modulo, nunca pelo chamador.
- Configurado o cookie como `httpOnly`, `SameSite=Lax`, `Secure` apenas em producao (`NODE_ENV === "production"`), `path` `/painel` e `maxAge` de 12 horas (`60 * 60 * 12`), alinhado ao plantao de urgencia e emergencia.
- Adotada validacao Zod strict na leitura e tambem na escrita: UUID valido obrigatorio, `v` igual a 1, JSON invalido e campos extras rejeitados; escrita com selecao invalida lanca erro generico, sem expor IDs ou conteudo, e nao grava o cookie.
- Estendido `src/lib/auth/context.ts` com `validateActiveContext` e `resolveActiveContext`: o cookie e apenas um ponteiro e nunca a fonte de autorizacao; a validacao revalida no servidor sob RLS, consultando `hospitals` com `select("id, organization_id")` e filtros `id`, `organization_id` e `status = 'active'` via `maybeSingle()`, usando somente o cliente Supabase server-side autenticado, sem service role.
- Definidos os quatro estados discriminados `active`, `absent`, `invalid` e `error`, sem colapsar um no outro e sem contexto parcial: erro tecnico permanece `error` e nao apaga automaticamente o contexto; contexto ausente e distinto de contexto invalido; contexto invalido nao e tratado como erro tecnico.
- Integrada a limpeza do cookie ao `logoutAction`: `clearContextCookie` e chamado no inicio da acao, antes de qualquer redirect e antes de qualquer erro do `signOut`, mesmo sem usuario autenticado, preservando `signOut({ scope: "local" })`, a mensagem generica de erro, `revalidatePath` e o redirect final.
- Adicionado teste pgTAP `supabase/tests/006-sprint-03d3-active-context.test.sql`, sob `authenticated`, transacional com `rollback`, reproduzindo exatamente a consulta de `validateActiveContext` em 10 cenarios: usuario hospitalar ativo, `organization_admin`, organizationId de outro tenant, hospital suspenso, organizacao suspensa, vinculo hospitalar revogado, papel hospitalar revogado, usuario sem vinculo, hospital de outro tenant e confirmacao de execucao como `authenticated`.
- Confirmado que o cenario critico de papel hospitalar revogado com vinculo ativo e sem papel organizacional retorna 0 linhas: o RLS da Sprint 03A bloqueia a leitura de `hospitals` porque `current_user_has_hospital_permission` exige papel ativo e nao revogado; nenhuma correcao em TypeScript, migration ou RLS foi necessaria.
- Aprovados lint, typecheck, 117 testes unitarios, build, `db:lint` e 94 verificacoes pgTAP; nenhuma migration criada e nenhuma ampliacao de RLS, grants, roles ou permissions; nenhuma UI ou seletor criado.

### Checkpoint - Sprint 03D1 - Inventario de acessos

- Criada a camada server-side de inventario em `src/lib/auth/context.ts`, funcao `getAuthorizedContextInventory`, que lista as organizations e hospitals ativos e autorizados ao usuario atual, sem UI, sem seletor, sem persistencia de contexto e sem papeis ativos (papeis ficam reservados para a revalidacao de contexto das etapas 03D3/03D4).
- Confirmado que o RLS da Sprint 03A e o filtro definitivo: as consultas selecionam apenas `status = 'active'` e delegam a autorizacao ao banco, sem reconstruir joins de permissao no TypeScript.
- Adotada a Opcao A sem migration: nenhuma migration, politica RLS, grant, papel ou permissao foi criada ou alterada; o inventario usa exclusivamente o cliente Supabase server-side autenticado, sem service role.
- Registrado que um usuario hospital-only sem papel organizacional pode receber `organizations` vazio e `hospitals` preenchido, refletindo o menor privilegio ja garantido pelo RLS.
- Definido retorno discriminado `{ status: "success", inventory }` ou `{ status: "error" }`: em caso de erro em qualquer consulta a funcao retorna `error`, nunca dados parciais e nunca converte erro em inventario vazio; inventario vazio legitimo retorna `success` com listas vazias e `hospitalCount` igual a `hospitals.length`.
- Consultas com campos explicitos, sem `select("*")`, com ordenacao deterministica por `display_name` e `id`.
- Adicionado teste unitario `tests/unit/auth-context.test.ts` (Supabase mockado, cobre normalizacao, derivacao de `hospitalCount` e fail-closed, nao valida RLS).
- Adicionado teste pgTAP `supabase/tests/005-sprint-03d-context-inventory.test.sql`, sob `authenticated`, transacional com `rollback`, cobrindo usuario institucional, usuario hospital-only, usuario multi-hospital, hospital suspenso, organization suspensa, hospital de outro tenant e vinculo hospitalar revogado.
- Aprovados lint, typecheck, 84 testes unitarios, build, `db:lint` e 83 verificacoes pgTAP; nenhuma migration, RLS, grant, papel ou permissao alterada.

### Correcao e validacao - Sprint 03C

- Corrigido defeito de autorizacao em `src/lib/auth/access.ts`: a consulta do gate hospitalar embutia `organizations!inner` e filtrava `organization_memberships.organizations.status`, exigindo leitura de `organizations` que o RLS nega a usuario hospitalar sem papel organizacional; por ser join interno, o vinculo hospitalar inteiro era descartado e o acesso negado indevidamente.
- Removidos apenas o embed `organizations!inner` e o filtro de status de organization da consulta hospitalar, preservando a ordem dos gates `platform`, `organization` e `hospital`.
- Confirmado que a exigencia de organization ativa continua garantida de forma transitiva pela funcao privada `current_user_has_hospital_permission`, sem ampliar permissoes e sem alterar politicas RLS, grants, papeis, permissoes, migracoes ou banco.
- Ajustado o teste unitario `tests/unit/auth-access.test.ts` para o novo formato da consulta, com comentario esclarecendo que a suite cobre a logica de gates e nao o comportamento real do RLS.
- Adicionado teste pgTAP de regressao `supabase/tests/004-sprint-03c-hospital-access.test.sql` para usuario hospital-only sem papel organizacional, validando acesso hospitalar liberado sob RLS como `authenticated`, trava de regressao do embed de organizations e bloqueio por organization suspensa.
- Removida a pasta residual local `supabase/snippets/`, gerada pelo Supabase Studio, contendo apenas uma consulta ad hoc com e-mails ficticios `@example.test`, sem senhas, tokens, chaves, JWT ou service role; a pasta nao estava versionada.
- Registrada validacao manual end-to-end da Sprint 03C: usuario hospital-only autenticado chegou a `/painel`, sem redirecionamento para `/acesso-negado` e sem tela de erro.
- Confirmada instrumentacao de diagnostico temporaria adicionada e removida integralmente de `src/lib/auth/access.ts`, sem registrar cookies, tokens, JWT, sessao, UUID, e-mail ou dados pessoais e sem permanecer no codigo final.
- Aprovados lint, typecheck, 76 testes unitarios, build, `db:lint` e 73 verificacoes pgTAP em banco local reconstruido por `db:reset`.
- Mantida a vulnerabilidade moderada transitiva ja conhecida de PostCSS via Next.js em `KNOWN_ISSUES.md`; `npm audit fix --force` permanece proibido por causar downgrade forcado do Next.js.

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

### Implementacao - Sprint 03B

- Iniciada a Sprint 03B com infraestrutura Supabase SSR, sem implementar login, logout, protecao de rotas, redirecionamentos, convites, usuarios ou contexto ativo.
- Instaladas as dependencias diretas `@supabase/supabase-js` e `@supabase/ssr` em versoes exatas.
- Criado `.env.example` com placeholders seguros para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Criada validacao publica centralizada e preguicosa para variaveis Supabase, sem expor valores recebidos em mensagens de erro.
- Criados clientes Supabase tipados para navegador e servidor usando `Database` de `src/types/database.types.ts`.
- Criado `src/lib/supabase/proxy.ts` para renovacao de sessao por cookies com `getClaims()`, sem `getSession`, sem redirect e sem consulta institucional.
- Criado `src/proxy.ts`, sem criar `middleware.ts`, delegando exclusivamente para `updateSession`.
- Criados testes unitarios com mocks para ambiente, cliente browser, cliente server, Proxy, matcher e revisao estatica de seguranca.
- Confirmado que Sprint 03C e Sprint 03D permanecem nao iniciadas.

### Validacao tecnica - Sprint 03B

- Registrada a Sprint 03B como em validacao tecnica.
- Confirmadas dependencias exatas `@supabase/supabase-js@2.110.2` e `@supabase/ssr@0.12.0`.
- Aprovados lint, typecheck, 11 arquivos de testes, 43 testes, build sem `.env.local` e check completo.
- Confirmada ausencia de `getSession` nos arquivos de codigo da Sprint 03B.
- Confirmado uso de `getClaims` no Proxy.
- Confirmada ausencia de redirect, login funcional, protecao de rotas e contexto ativo.
- Confirmado que `src/types/database.types.ts`, migracoes e testes SQL nao foram alterados.
- Confirmado que Docker e Supabase local nao foram iniciados nesta auditoria.
- Auditorias npm mantiveram apenas a vulnerabilidade moderada ja conhecida de PostCSS via Next.js, sem vulnerabilidade alta ou critica nova.

### Implementacao - Sprint 03C

- Implementado fluxo visual de login em `/login` para contas previamente provisionadas ou vinculadas.
- Implementado logout local com validacao de usuario atual antes de encerrar sessao.
- Implementada rota protegida `/painel` com validacao de usuario autenticado, perfil ativo e vinculo ou papel ativo.
- Implementada pagina publica `/acesso-negado` para usuario autenticado sem vinculo ativo autorizado.
- Adicionado redirecionamento seguro de `next`, restrito a `/painel` e subcaminhos.
- Atualizado Proxy para redirecionar usuario anonimo de rota protegida para login e usuario autenticado de `/login` para `/painel`, preservando cookies renovados.
- Mantida autorizacao institucional no servidor e no banco; o Proxy nao consulta tabelas institucionais.
- Criados testes unitarios para actions, redirecionamentos, proxy, paginas e validacao de acesso.
- Confirmado que Sprint 03D nao foi iniciada e que nao houve novas dependencias, migracoes, APIs, dados reais, segredos ou contexto institucional ativo.

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
