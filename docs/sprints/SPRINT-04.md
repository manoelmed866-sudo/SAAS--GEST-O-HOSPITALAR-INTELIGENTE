# SPRINT-04.md

## Sprint 04 - Administracao, governanca e design system autenticado inicial

## Estado do documento

Sprint 04: Em andamento.

Sprint 04A: Concluida.

Sprint 04B, 04C, 04D e 04E: nao iniciadas.

Este documento registra o planejamento e a execucao controlada da Sprint 04, iniciada apos a integracao da Sprint 03 na `main`. A Sprint 04A entregou exclusivamente o contrato SQL de capacidades efetivas do hospital ativo e seu consumidor server-side, sem interface, sem CRUD, sem modulo clinico e sem consumo visual das capacidades.

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

## C. Limitacoes conscientes

- O painel ainda nao consome as capacidades; o consumo visual foi adiado.
- Nao ha CRUD administrativo.
- Nao ha categorias profissionais (medico, enfermeiro e afins nao sao papeis nesta etapa).
- Nao ha expiracao temporal de vinculo; suspensao e revogacao sao tratadas por `status` e `revoked_at`.
- O gate de organizacao ativa no caminho hospital-only permanece transitivo pela visibilidade do hospital sob RLS, e nao por leitura direta de `organizations`.
- `SECURITY DEFINER` nao foi adotado; sera avaliado apenas futuramente, mediante necessidade comprovada e nova decisao.

## D. Proximas subfases sugeridas

Sem detalhamento de implementacao nesta etapa:

- 04B: consumo inicial das capacidades na navegacao e gates server-side.
- 04C: administracao de usuarios e vinculos.
- 04D: gestao de papeis e permissoes.
- 04E: design system autenticado e workspaces iniciais.

## E. Fora do escopo

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
