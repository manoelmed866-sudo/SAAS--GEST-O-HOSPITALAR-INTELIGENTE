# SPRINT-04.md

## Sprint 04 - Administracao, governanca e design system autenticado inicial

## Estado do documento

Sprint 04: CONCLUIDA FUNCIONALMENTE (2026-07-15), aguardando merge posterior na main.

Sprint 04A: Concluida.

Sprint 04B: Concluida.

Sprint 04C: Concluida (04C.1, 04C.2 e o fechamento com gestao de papeis).

Fechamento (secao C4): gestao de papeis hospitalares por RPC auditada, DEC-058.

Diferidos com registro: administracao de identidade/convites (Sprint propria), vinculo de perfil existente, governanca visual avancada e workspaces (trilha futura).

Este documento registra o planejamento e a execucao controlada da Sprint 04, iniciada apos a integracao da Sprint 03 na `main`. A Sprint 04A entregou exclusivamente o contrato SQL de capacidades efetivas do hospital ativo e seu consumidor server-side, sem interface, sem CRUD, sem modulo clinico e sem consumo visual das capacidades. A Sprint 04B entregou o primeiro consumo dessas capacidades: navegacao condicional no painel, gate server-side reutilizavel e rota administrativa demonstrativa protegida no servidor, ainda sem CRUD.

## A. Objetivo da Sprint 04

Consolidar a fundacao autenticada da plataforma, cobrindo progressivamente:

- administracao institucional (usuarios, vinculos, papeis e permissoes);
- governanca (autorizacao granular por capacidade, com o RLS como barreira final);
- capacidades efetivas por contexto ativo, expostas como capacidades semanticas;
- design system autenticado inicial e areas de trabalho por perfil.

A Sprint 04 apoia-se no modelo institucional e no RLS da Sprint 03A, no contexto ativo da Sprint 03D e mantem os principios de menor privilegio, separacao entre acesso administrativo e clinico e validacao no servidor e no banco.

## B. Sprint 04A concluida

Escopo entregue:

- Contrato SQL de capacidades efetivas do hospital ativo, resolvido no banco e combinando os tres escopos de autorizacao.
- Consumidor server-side em TypeScript que orquestra o contexto ativo e a RPC, traduzindo o resultado para capacidades semanticas.

Uniao dos tres escopos, relativamente ao hospital ativo:

- plataforma: `platform_role_assignments` (papel de plataforma ativo, nao revogado);
- organizacao: `organization_membership_roles` na organizacao proprietaria do hospital ativo;
- hospital: `hospital_membership_roles` no hospital alvo.

A composicao e monotonica por OR: uma capacidade e verdadeira quando qualquer escopo qualificante possui a permissao correspondente. Nao ha negacao nem precedencia nesta etapa; duplicidade entre escopos nao altera o resultado; a capacidade so nasce de permissao explicitamente atribuida por `role_permissions`.

Cinco capacidades semanticas expostas:

- `canReadHospital`;
- `canReadMemberships`;
- `canManageMemberships`;
- `canReadAudit`;
- `canSwitchContext`.

Contrato tecnico:

- Funcao `public.get_effective_hospital_capabilities(target_hospital_id uuid)`, `language sql`, `stable`, `SECURITY INVOKER`, `set search_path = ''`, retornando exatamente cinco colunas boolean e sempre uma unica linha.
- Por ser `SECURITY INVOKER`, o RLS da Sprint 03A permanece aplicavel a cada tabela lida. `EXECUTE` e revogado de PUBLIC e de `anon` e concedido apenas a `authenticated`. Nenhuma policy, RLS, grant de tabela, role ou permission semeada foi alterada. Nao foi usado `service_role`.
- Resolver server-side `resolveActiveHospitalCapabilities()` em `src/lib/auth/capabilities.ts`, sem argumentos: o hospital alvo vem exclusivamente do contexto ativo revalidado por `resolveActiveContext()`; a RPC recebe somente `target_hospital_id`, nunca `organizationId`; o resolver devolve o mesmo `ActiveContext` revalidado.
- Validacao Zod estrita da resposta da RPC: objeto `.strict()` com exatamente cinco booleanos e array de tamanho exatamente 1. Retorno malformado falha fechado como `{ status: "error" }`, sem capacidade parcial nem fallback permissivo. Nenhum codigo cru de permissao, papel ou scope e exposto ao consumidor.
- Tipos Supabase regenerados pelo comando oficial `npm run db:types`, adicionando somente a nova funcao ao bloco `Functions`.

Testes:

- `supabase/tests/007-sprint-04a-effective-capabilities.test.sql`: 21 verificacoes pgTAP sob `authenticated`, transacionais com `rollback`, cobrindo os tres escopos, papel/atribuicao revogados, membership suspensa, hospital inativo, organizacao inativa, isolamento entre hospitais e tenants, duplicidade entre escopos e a garantia de sempre uma linha com cinco booleanos.
- `tests/unit/auth-capabilities.test.ts`: 19 testes de orquestracao, mapeamento snake_case para camelCase e comportamento fail-closed.
- `tests/unit/sprint-04a-static-security.test.ts`: 32 testes estaticos de arquitetura e seguranca sobre a migration, o resolver, os tipos gerados e o cookie.

Resultado validado da Sprint 04A: lint, typecheck, build, `db:lint` aprovados; 227 testes unitarios e 115 verificacoes pgTAP aprovados. Decisao registrada em `DECISIONS.md` como DEC-054.

## C. Sprint 04B concluida

### C.A. Objetivo

- Primeiro consumo das capacidades efetivas entregues pela 04A.
- Navegacao condicional no painel, refletindo (sem substituir) a autorizacao do servidor.
- Gate server-side reutilizavel por capacidade, para paginas presentes e futuras.
- Rota administrativa demonstrativa comprovando que o acesso direto por URL e avaliado no servidor.

### C.B. Helper de gate por capacidade

- Arquivo: `src/lib/auth/capability-gate.ts`, funcao `evaluateHospitalCapability(capability)`.
- Argumento restrito em TypeScript a `HospitalCapability = keyof HospitalCapabilities`; nenhuma string generica.
- Resultado discriminado em cinco estados: `allowed` e `denied` (ambos com o mesmo `ActiveContext` revalidado), `absent`, `invalid` e `error` propagados de `resolveActiveHospitalCapabilities()`, chamada exatamente uma vez.
- Sem Supabase direto (sem `createClient`, RPC ou tabelas), sem leitura de cookie, sem `redirect`/`notFound`, sem `service_role`.
- Sem `hospitalId` ou `organizationId` externos: o hospital vem exclusivamente do contexto ativo revalidado.
- Sem retorno do mapa completo de capacidades: `allowed`/`denied` devolvem apenas o status e o contexto; somente a capacidade solicitada decide.

### C.C. Painel

- O painel passou a usar `resolveActiveHospitalCapabilities()` como fonte unica de contexto e capacidades, numa unica chamada apos `requirePortalAccess()`; `resolveActiveContext()` nao e mais chamado diretamente pelo painel.
- Link "Gerenciar equipe" (para `/painel/admin/equipe`) condicionado somente a `capabilities.canManageMemberships`; quando falso, o link nao existe, sem botao desabilitado e sem explicar a permissao interna.
- "Trocar hospital" permanece incondicional no estado `active`, independentemente de `canSwitchContext`; a barreira da troca continua no servidor sob RLS.
- Estados anteriores preservados (`active`, `absent`, `invalid`, `error`), com nome e codigo do hospital revalidado, logout em todos os estados e nenhum papel, scope, codigo cru ou UUID exposto.

### C.D. Rota administrativa demonstrativa

- Rota: `/painel/admin/equipe`, Server Component com `export const dynamic = "force-dynamic"`.
- Ordem obrigatoria: `requirePortalAccess()` e somente entao `evaluateHospitalCapability("canManageMemberships")`, chamado exatamente uma vez com o literal correto.
- Cinco estados renderizados: `allowed` (eyebrow "Administracao institucional", titulo "Gestao da equipe", hospital do contexto e aviso de implementacao futura), `denied` (mensagem generica "Sem permissao para gerenciar a equipe", sem conteudo autorizado e sem revelar papel ou capacidade), `absent` e `invalid` (orientam a selecao com links para o seletor e para o painel) e `error` (tentativa novamente na propria rota e retorno ao painel). Logout em todos os estados.
- Ausencia de CRUD: nenhum formulario administrativo, Server Action de mutacao, botao de adicionar/convidar/editar/suspender/excluir/remover/salvar ou consulta direta a Supabase, RPC, tabelas ou cookie.
- Acesso direto protegido: a rota permanece barrada no servidor mesmo quando o link nao aparece no painel; `denied` e distinto do acesso negado institucional.

### C.E. Testes

- `tests/unit/auth-capability-gate.test.ts`: 20 testes do helper (allowed/denied por capacidade, preservacao do contexto, nao vazamento do mapa, propagacao de estados, resolucao unica).
- `tests/unit/auth-pages.test.tsx`: painel atualizado para mockar `resolveActiveHospitalCapabilities`, cobrindo link condicional, "Trocar hospital" incondicional, ausencia do link administrativo em `absent`/`invalid`/`error` e a garantia de que `resolveActiveContext` nao e chamado diretamente.
- `tests/unit/auth-admin-team-page.test.tsx`: 6 testes da rota (ordem dos gates, allowed, denied por acesso direto sem renderizar o painel, absent, invalid, error), com verificacao de nao vazamento e ausencia de controles de mutacao.
- `tests/unit/sprint-04b-static-security.test.ts`: 36 testes estaticos de arquitetura e seguranca cobrindo helper, painel, rota, estados, prova de que a UI nao e a unica barreira, regressao da 03D4 e escopo proibido.
- `tests/unit/sprint-03d4-static-security.test.ts`: atualizado minimamente para exigir `resolveActiveHospitalCapabilities` e proibir `resolveActiveContext` direto no painel, preservando todas as demais garantias da 03D4.
- Totais: 292 testes unitarios e 115 verificacoes pgTAP aprovados.

### C.F. E2E assistido

Registrado sem credenciais, UUIDs, e-mails ou tokens:

- Fluxo HTTP real contra o Next.js e o Supabase locais, com formularios submetidos por progressive enhancement das Server Actions (sem navegador grafico e sem dependencia nova) e sessoes/cookies isolados por usuario.
- Usuario `member`: painel com hospital e codigo visiveis, "Trocar hospital" presente e SEM o link "Gerenciar equipe"; acesso direto a `/painel/admin/equipe` negado no servidor com o estado `denied` generico, sem conteudo autorizado.
- Usuario `hospital_admin`: painel com o link "Gerenciar equipe" (href exato `/painel/admin/equipe`) e rota autorizada exibindo "Gestao da equipe", o hospital do contexto e o aviso de implementacao futura.
- "Trocar hospital" presente para ambos os usuarios.
- Logout validado nos dois contextos: retorno ao login e novo acesso a `/painel` exigindo autenticacao.
- Ausencia de CRUD, de vazamento de capacidades/papeis/UUIDs nas paginas e de capacidades no cookie.
- Fixtures temporarias integralmente removidas ao final, com contagens de conferencia zeradas (usuarios, perfis, vinculos, papeis, hospital e organizacao E2E).
- Limitacao registrada: nao houve navegador grafico, screenshots ou validacao de hidratacao client-side; as assercoes cobrem o HTML renderizado no servidor.

Decisao registrada em `DECISIONS.md` como DEC-055.

## C2. Sprint 04C.1 concluida

### C2.A. Objetivo

- Primeira administracao real da equipe: listagem somente leitura dos integrantes do hospital ativo, sem nenhuma mutacao.

### C2.B. RPC de listagem (DEC-056)

- `public.get_hospital_team(target_hospital_id uuid)`: `language sql`, `stable`, **SECURITY DEFINER**, `set search_path = ''`, objetos qualificados, sem SQL dinamico.
- Necessidade comprovada em auditoria: a policy de SELECT de `organization_memberships` exige permissao organizacional que o `hospital_admin` nao possui; SECURITY INVOKER herdaria o bloqueio. Afrouxar RLS foi rejeitado.
- Validacao interna explicita antes de qualquer linha: perfil ativo, organizacao proprietaria ativa, hospital alvo ativo e `hospital_memberships.read` por papel hospitalar OU organizacional (ativo, nao revogado), via funcoes `app_private` existentes. Fail-closed; sem bypass de platform_admin; sem acesso por nome de papel.
- Retorno minimo: `display_name`, `membership_status`, `role_labels` (somente `roles.display_name`). Sem `auth.users`, e-mail, UUID ou `role.code`. EXECUTE apenas para `authenticated`. RLS inalterada.
- Regras: perfil inativo, vinculo organizacional nao ativo e vinculo `revoked` excluidos; `suspended`/`pending` aparecem com o proprio status; papeis somente de escopo hospital ativos; ordenacao deterministica; uma pessoa por linha.

### C2.C. Resolver e interface

- `resolveActiveHospitalTeam()` (`src/lib/auth/hospital-team.ts`), sem argumentos: uma chamada a `resolveActiveHospitalCapabilities()`; `denied` sem RPC quando `canReadMemberships` e falso; RPC somente com o `hospitalId` do contexto; Zod estrito; lista vazia valida; fail-closed.
- Painel: link "Ver equipe" condicionado somente a `canReadMemberships` (auditor enxerga; member nao); `canManageMemberships` nao controla mais a visibilidade; "Trocar hospital" permanece incondicional.
- Pagina `/painel/admin/equipe`: Server Component `force-dynamic`; `requirePortalAccess()` e depois o resolver; estados allowed (lista com nome, status traduzido Ativo/Suspenso/Pendente e papeis amigaveis), allowed vazio, denied generico, absent, invalid e error. Sem CRUD, formulario administrativo, Server Action de dominio, e-mail ou UUID; somente logout.

### C2.D. Testes

- `supabase/tests/008-sprint-04c-team-listing.test.sql`: 24 verificacoes pgTAP (estrutura da funcao, grants, autorizacao por perfil, isolamento entre hospitais e organizacoes, estados de vinculo, papel revogado, rotulos amigaveis, lista vazia, platform_admin sem bypass).
- `tests/unit/auth-hospital-team.test.ts` (19), `tests/unit/auth-admin-team-page.test.tsx` (7), `tests/unit/auth-pages.test.tsx` (12) e `tests/unit/sprint-04c-static-security.test.ts` (16); testes estaticos da 04B atualizados minimamente para o novo consumo.
- Totais: 330 testes unitarios e 139 verificacoes pgTAP aprovados.

### C2.E. E2E assistido

Registrado sem credenciais, UUIDs, e-mails ou tokens: fluxo HTTP real com tres perfis em sessoes isoladas. Member: sem link "Ver equipe" e negado por URL direta com estado generico. Hospital_auditor e hospital_admin: link presente e listagem completa com status traduzidos (suspended -> Suspenso, pending -> Pendente), vinculo revoked ausente, papeis amigaveis, nenhum e-mail/UUID/CRUD. Logout validado nos tres contextos; fixtures integralmente removidas com contagens zeradas.

### C2.F. Proxima subfase

- 04C.2 (concluida nesta sprint, ver secao C3): mutacoes de vinculo (suspender/reativar), invariantes de ultimo administrador e trilha de auditoria administrativa.

## C3. Sprint 04C.2 concluida

### C3.A. Objetivo

- Primeiras mutacoes administrativas reais: suspensao (`active -> suspended`) e reativacao (`suspended -> active`) de vinculos hospitalares, com trilha de auditoria transacional. `pending` e `revoked` fora do escopo (`revoked` terminal). Nenhuma exclusao, revogacao, alteracao de papel, convite ou criacao de conta.

### C3.B. Banco (DEC-057)

- Referencia publica opaca `hospital_memberships.management_ref` (128 bits, 32 hex, `gen_random_bytes`, unique + check): o UUID interno nunca trafega em HTML ou FormData; a referencia nao autoriza e a RPC revalida tudo.
- Tabela append-only `public.administrative_audit_events` SEM acesso direto da aplicacao (RLS habilitado sem policy permissiva, zero grants); insercao exclusivamente dentro da RPC, na MESMA transacao da alteracao; constraint cruzada de consistencia evento/transicao (`administrative_audit_events_transition_consistency_check`).
- RPC unica `public.change_hospital_membership_status(uuid, text, text)`, `plpgsql`, `volatile`, **SECURITY DEFINER** restrito, `set search_path = ''`: autorizacao explicita fail-closed (`hospital_memberships.manage` por escopo hospitalar OU organizacional, sem bypass de platform_admin), lock por hospital com checagem de ultimo administrador APOS o lock, auto-suspensao bloqueada, alvo por referencia opaca sem enumeracao. `EXECUTE` somente para `authenticated`.
- Hardening RPC-only (migration `20260714030000`): `UPDATE (status)` de `authenticated` em `hospital_memberships` revogado e policy `hospital_memberships_update_allowed` removida; a RPC e o unico caminho de alteracao de status. `organization_memberships` e tabelas de papeis intocadas; nenhum grant novo.
- `get_hospital_team` estendida com `management_ref`, `can_suspend` e `can_reactivate` apenas para quem possui manage; auditor recebe referencia nula e indicadores falsos.

### C3.C. Aplicacao

- Server Action `changeMembershipStatusAction`: recebe SOMENTE `managementRef` + `requestedStatus` (Zod estrito); exige `canManageMemberships`; o hospital vem exclusivamente do contexto ativo revalidado; mensagens genericas.
- Componente cliente `TeamMemberControls`: renderiza apenas a acao indicada pelo servidor e exige confirmacao explicita inline (Confirmar suspensao/reativacao + Cancelar) antes de submeter.

### C3.D. Testes

- `supabase/tests/009-sprint-04c2-membership-mutations.test.sql`: 59 verificacoes pgTAP (estrutura, grants, hardening de privilegios/policy, constraint de consistencia, autorizacao, isolamento, anti-enumeracao, transicoes, auto-suspensao, ultimo administrador, auditoria transacional e metadados de acao).
- `tests/unit/team-membership-actions.test.ts` e `tests/unit/team-member-controls.test.tsx` novos; `auth-hospital-team`, `auth-admin-team-page` e testes estaticos atualizados.
- Totais: 368 testes unitarios e 198 verificacoes pgTAP aprovados.

### C3.E. E2E em navegador real

Registrado sem credenciais, UUIDs, e-mails, tokens ou management_ref: Chromium headless dirigido via CDP (JavaScript, hidratacao, `useActionState` e `revalidatePath` reais; sem dependencia nova), 35 verificacoes aprovadas:

- Member: acesso direto negado com estado generico, sem lista, sem botoes, sem dados internos no HTML.
- Auditor: lista visivel sem nenhum botao de mutacao, confirmacao, formulario ou referencia opaca no HTML.
- Admin: acoes coerentes por estado (active -> Suspender; suspended -> Reativar; pending sem acao; self sem suspensao; segundo admin suspensivel); nenhum excluir/remover/revogar/alterar papel.
- FormData inspecionado no navegador: somente `managementRef` (32 hex, nao UUID) e `requestedStatus`, alem dos metadados internos do Next.js; nenhum campo proibido.
- Cancelamento sem mutacao e sem evento; suspensao e reativacao com mensagem de sucesso, status e botao atualizados; ultimo administrador protegido tambem na interface apos suspensao do segundo admin (reativado ao final).
- UPDATE direto via PostgREST negado (HTTP 403) mesmo para admin autenticado.
- Auditoria conferida no banco: exatamente 1 evento por mutacao bem-sucedida (4 no total), ator/hospital/alvo/event_type/estados/timestamp corretos, zero eventos de cancelamento ou falha, zero combinacoes inconsistentes. Lock comprovado estruturalmente; teste real de concorrencia nao foi executado.
- Logout com retorno ao login e `/painel` reprotegido; fixtures integralmente removidas com contagens zeradas.

Decisao registrada em `DECISIONS.md` como DEC-057.

## C4. Fechamento da Sprint 04 - gestao de papeis hospitalares (DEC-058)

### C4.A. Objetivo

- Concluir funcionalmente Administracao e Governanca: atribuir, revogar e reatribuir papeis hospitalares EXISTENTES no hospital ativo, fechando o ultimo caminho de mutacao direta. Sem criacao/edicao de roles ou permissions; sem papeis organizacionais ou de plataforma.

### C4.B. Banco

- `roles.management_ref`: referencia publica opaca de 128 bits (unique + check), mesmo padrao da DEC-057; ids internos de papel nunca trafegam.
- Hardening RPC-only de `hospital_membership_roles`: INSERT/UPDATE/DELETE de `authenticated` revogados (tabela e colunas) e policies de mutacao removidas; SELECT preservado. `organization_membership_roles`, `platform_role_assignments` e catalogos intocados.
- Auditoria administrativa estendida na PROPRIA tabela: eventos `hospital_role_assigned`/`hospital_role_revoked`, coluna opcional `target_role_id` e constraint cruzada ampliada (vinculo sem papel; papel obrigatorio e transicoes coerentes). Append-only, RLS fechado, mesma transacao.
- RPC unica `public.change_hospital_membership_role(uuid, text, text, text)`: SECURITY DEFINER restrito, `search_path` vazio, lock por hospital, manage fail-closed sem bypass, anti-enumeracao (alvo e papel por refs opacas), assign com reativacao da linha revogada (sem duplicata), revoke somente de atribuicao ativa, `self_admin_role_forbidden` e `last_admin_forbidden` (apos o lock; admin com multiplos papeis continua admin).
- `get_hospital_assignable_roles(uuid)`: catalogo hospitalar minimo (rotulo + ref), manage-only. `get_hospital_team` com `assigned_roles` (label/roleRef/canRevoke) somente para gestores.

### C4.C. Aplicacao

- Server Action `changeMembershipRoleAction`: Zod estrito (`membershipRef`, `roleRef`, `requestedAction`); hospital exclusivamente do contexto ativo; cinco outcomes mapeados; revalidacao somente em sucesso.
- `TeamRoleControls`: revogacao por papel com `canRevoke`, select do catalogo excluindo papeis ja ativos, confirmacao explicita inline e cancelamento sem mutacao. Auditor sem controles; member sem acesso.

### C4.D. Testes

- `supabase/tests/010-sprint-04-role-management.test.sql`: 67 pgTAP (refs, hardening, auditoria estendida, RPC, isolamentos, invariantes, catalogo, mutacao direta negada).
- Novos `team-role-actions.test.ts`, `team-role-controls.test.tsx`, `sprint-04-role-static-security.test.ts`; suites 008/04b/04c e resolver/pagina atualizadas legitimamente.
- Totais: 406 testes unitarios e 265 verificacoes pgTAP aprovados.

### C4.E. E2E em navegador real

Chromium headless via CDP (mesmo padrao da 04C.2, sem dependencia nova), 26 verificacoes, sem imprimir segredos/refs/UUIDs/e-mails: member sem acesso; auditor com lista e papeis, sem controles nem referencias; admin atribui e revoga com confirmacao (papel aparece/desaparece nos rotulos), cancelamento sem mutacao, auto-revogacao indisponivel; organization_admin revoga um de dois admins, ultimo admin protegido na interface e estado restaurado; FormData minimo (somente as duas refs e a acao); INSERT/UPDATE diretos via PostgREST negados (HTTP 403). Auditoria conferida: 4 eventos exatos, reatribuicao com previous `revoked`, zero eventos por cancelamento/falha, zero inconsistencias, zero duplicatas; fixtures removidas com contagens zeradas.

### C4.F. Deferimentos registrados

- Administracao de identidade e convites diferida para Sprint propria (exige service_role/Admin API, secrets novos e e-mail; nada foi improvisado; a aplicacao segue sem service_role e sem `auth.users`).
- Vinculo de perfil ja existente ao hospital diferido: sem mecanismo seguro de descoberta de perfis sob RLS; nenhum autocomplete global ou diretorio de usuarios foi criado.
- Painel de leitura de auditoria, workspaces por perfil e design system autenticado: trilha futura; nao bloqueiam as sprints clinicas.

## D. Limitacoes conscientes

- A gestao administrativa cobre status de vinculo e papeis hospitalares existentes; convites, criacao de contas, vinculo de perfil existente e papeis organizacionais/de plataforma permanecem diferidos sob decisao propria (DEC-058).
- "Trocar hospital" nao e condicionado a `canSwitchContext` nesta etapa; condicionar a troca fica para decisao futura especifica.
- Nao ha categorias profissionais (medico, enfermeiro e afins nao sao papeis nesta etapa).
- Nao ha expiracao temporal de vinculo; suspensao e revogacao sao tratadas por `status` e `revoked_at`.
- O gate de organizacao ativa no caminho hospital-only permanece transitivo pela visibilidade do hospital sob RLS, e nao por leitura direta de `organizations`.
- `SECURITY DEFINER` nao foi adotado; sera avaliado apenas futuramente, mediante necessidade comprovada e nova decisao.

## E. Proximas subfases sugeridas

Sem detalhamento de implementacao nesta etapa:

- Gestao de papeis hospitalares: ENTREGUE no fechamento (secao C4).
- Administracao de identidade e convites: DIFERIDA para Sprint propria (DEC-058).
- Design system autenticado e workspaces por perfil: trilha transversal futura, fora do fechamento da Sprint 04.

## F. Fora do escopo

- Pacientes.
- Prontuario.
- Triagem.
- Protocolos.
- Medicamentos.
- Insumos.
- Estoque.
- Laboratorio.
- UTI.
- IA.
- Voz.
- Integracoes externas.
