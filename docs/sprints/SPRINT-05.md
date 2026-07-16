# SPRINT-05.md

## Sprint 05 - Cadastro institucional hospitalar

## Estado do documento

Sprint 05: CONCLUIDA FUNCIONALMENTE (2026-07-15) na branch `sprint/05-cadastro-institucional`, aguardando merge posterior na `main`.

Decisao arquitetural registrada como DEC-059.

## A. Objetivo oficial

Modelar a estrutura institucional do hospital — unidades, setores, leitos e recursos institucionais — tornando a estrutura hospitalar configuravel por instituicao (PLANO_MESTRE_CODEX.md, Sprint 05). O cadastro do hospital em si ja existia desde a Sprint 03A; esta sprint entrega a estrutura interna configuravel.

Cadastro de recurso NAO significa recurso utilizado: nada aqui e dado clinico ou operacional em tempo real. Ocupacao de leito pertence ao Mapa do Hospital (Sprint 08) e recursos assistenciais previstos/sugeridos/solicitados/utilizados pertencem a Sprint 16.

## B. Modelo de dados

Quatro tabelas publicas novas, todas multi-tenant com `organization_id` e `hospital_id` obrigatorios e FK COMPOSTA `(hospital_id, organization_id) -> hospitals(id, organization_id)`, impedindo mistura de tenants por construcao:

- `public.hospital_units` (unidades): raiz da hierarquia.
- `public.hospital_sectors` (setores): FK composta `(unit_id, hospital_id) -> hospital_units(id, hospital_id)` garante setor e unidade do MESMO hospital.
- `public.hospital_beds` (leitos): FK composta `(sector_id, hospital_id) -> hospital_sectors(id, hospital_id)`.
- `public.hospital_resources` (recursos institucionais): catalogo por hospital, com `description` opcional (ate 500).

Colunas comuns: `code` (slug minusculo, unico por hospital, ate 60), `display_name` (ate 120, nao vazio), `status` (`active`/`inactive`), `management_ref` (referencia publica opaca de 128 bits, 32 hex, unique + check, padrao DEC-057; NUNCA autoriza nada), `created_by` (autoria, default `auth.uid()`), `created_at`/`updated_at` com trigger.

Invariantes no banco:

- FKs compostas de mesmo hospital (acima).
- Unicidade de codigo por hospital em cada tabela.
- Checks de formato (slug, tamanhos, status, formato da referencia opaca).
- Triggers `hospital_sectors_enforce_active_unit` e `hospital_beds_enforce_active_sector` (funcoes comuns em `app_private`, SEM SECURITY DEFINER, rodam sob o usuario e sob RLS): filho nao nasce sob pai inativo; pai invisivel sob RLS equivale a inexistente (fail-closed).
- Nenhum DELETE fisico: desativacao logica por `status`.

## C. Autorizacao e capacidades

Novas permissoes semanticas semeadas (nenhum papel novo):

- `organization`: `hospital_structure.read`, `hospital_structure.manage` (organization_admin: ambas; auditor institucional: read).
- `hospital`: `hospital_structure.read`, `hospital_structure.manage` (hospital_admin: ambas; auditor hospitalar: read).
- `member` NAO recebe permissao de estrutura; `platform_admin` NAO possui bypass.

`public.get_effective_hospital_capabilities` foi estendida (drop + recreate, mesma semantica dos cinco booleanos da DEC-054) com `can_read_structure` e `can_manage_structure`, permanecendo `SECURITY INVOKER`, `search_path` vazio, sempre uma linha, EXECUTE somente para authenticated. O resolver `resolveActiveHospitalCapabilities()` passou a validar sete booleanos com Zod estrito e devolve `canReadStructure`/`canManageStructure`.

## D. RLS

RLS habilitado nas quatro tabelas com privilegios base zerados e grants minimos:

- SELECT de tabela para authenticated; INSERT somente das colunas de cadastro (`organization_id`, `hospital_id`, pai quando ha, `code`, `display_name`, `description` em recursos); UPDATE somente da coluna `status`. `status`, `management_ref` e `created_by` nascem por default e NAO sao gravaveis pelo cliente.
- Policies fail-closed por permissao explicita via funcoes `app_private` existentes: SELECT exige `hospital_structure.read` (escopo hospitalar OU organizacional); INSERT/UPDATE exigem `hospital_structure.manage`; INSERT exige adicionalmente hospital ativo visivel sob RLS.
- Nenhuma policy para anon; nenhuma policy de DELETE; nenhum `USING (true)`.
- SECURITY INVOKER por construcao: a aplicacao le e muta diretamente as tabelas sob o cliente autenticado; NENHUMA funcao SECURITY DEFINER nova foi criada nesta sprint.

## E. Aplicacao

- Resolver `resolveActiveHospitalStructure()` (`src/lib/auth/hospital-structure.ts`), sem argumentos: gate `canReadStructure` (denied sem consulta), quatro leituras filtradas EXCLUSIVAMENTE pelo hospital do contexto ativo revalidado, Zod estrito por linha, aninhamento unidade -> setor -> leito montado no servidor com descarte dos UUIDs internos; referencias opacas expostas SOMENTE a quem possui `canManageStructure` (leitores recebem null); fail-closed integral.
- Server Actions (`/painel/admin/estrutura/actions.ts`): `createUnitAction`, `createSectorAction`, `createBedAction`, `createResourceAction` e `changeStructureStatusAction`. O navegador envia SOMENTE campos de cadastro e referencias opacas; `kind` e enum fechado (unit/sector/bed/resource); pai resolvido no servidor por referencia restrita ao hospital ativo e a itens ativos (resposta identica para inexistente/fora de escopo/inativo); erros do banco traduzidos sem vazar detalhe interno (23505 codigo duplicado, 23514 pai indisponivel/formato, 42501 negado); revalidacao somente em sucesso.
- Pagina `/painel/admin/estrutura` (Server Component `force-dynamic`): `requirePortalAccess()` e depois o resolver; estados allowed (hierarquia + recursos + formularios/controles apenas para gestores), allowed vazio, denied generico, absent, invalid e error; logout em todos os estados; nenhum UUID, e-mail, papel ou permissao no HTML.
- Componentes cliente: quatro formularios de criacao (selects de vinculo usam referencia opaca como valor) e `StructureStatusControls` com confirmacao explicita inline (Desativar/Reativar + Confirmar/Cancelar).
- Painel: novo link "Estrutura do hospital" condicionado somente a `canReadStructure` (auditor enxerga; member nao).

## F. Auditoria

- Autoria e tempo registrados em cada linha (`created_by`, `created_at`, `updated_at`).
- Trilha transacional de eventos administrativos (padrao `administrative_audit_events` da DEC-057) NAO foi estendida para estrutura nesta sprint: e configuracao institucional nao clinica, no mesmo regime atual de organizations/hospitals. Deferimento consciente registrado em DEC-059; a Sprint 20 (auditoria ampliada) reavalia.

## G. Itens conscientemente diferidos

- Edicao de nome/descricao de itens existentes (rename): somente criacao e ativacao/desativacao nesta sprint.
- Trilha de auditoria transacional para mutacoes de estrutura (ver secao F).
- Desativacao de pai NAO cascateia para filhos: o invariante do banco impede apenas criar filho sob pai inativo; a interpretacao hierarquica fica com a interface e com sprints operacionais.
- Tipologia avancada (categorias de leito, capacidade cirurgica/obstetrica, equipamentos com atributos, predios/servicos/especialidades): Visao Funcional Completa, sprints futuras.
- Leitura de estrutura por papeis assistenciais (member) para consumo operacional: sera modelada quando os modulos clinicos existirem.
- Observacao registrada: leitores com `hospital_structure.read` conseguem, via PostgREST direto, selecionar a coluna `management_ref` (grant de SELECT e por tabela). A referencia e opaca e nao autoriza nada; a interface nao a exibe a leitores. Restricao por coluna seria inviavel sem quebrar os gestores.

## H. Testes

- Unitarios: 508 aprovados (406 anteriores + 102 novos/atualizados), incluindo `auth-hospital-structure.test.ts` (resolver), `structure-actions.test.ts` (Server Actions), `structure-page.test.tsx`, `structure-forms.test.tsx`, `structure-status-controls.test.tsx` e `sprint-05-static-security.test.ts` (revisao estatica: migration, resolver, actions, pagina, componentes e painel). Suites 04A/04B e `auth-capabilities` atualizadas legitimamente para o contrato de sete capacidades.
- pgTAP: 341 aprovadas (265 anteriores + 76 novas em `011-sprint-05-hospital-structure.test.sql`): estrutura, RLS, grants minimos (sem DELETE; colunas), FKs compostas, triggers, permissoes semeadas, capacidades por papel, perfis autorizados/negados, isolamento entre hospitais e organizacoes, invariantes de pai ativo, codigo duplicado, anti-gravacao de colunas protegidas e ausencia de bypass de platform_admin. Teste 001 atualizado legitimamente: `hospital_units` deixou a lista de tabelas proibidas (escopo legitimo da Sprint 05) e contagens de permissions refletem as quatro novas.

## I. E2E em navegador real

Chromium headless via CDP (WebSocket nativo do Node, sem dependencia nova), contra o BUILD DE PRODUCAO local com hidratacao real; 28 verificacoes aprovadas, sem imprimir senhas, tokens, UUIDs, referencias opacas, e-mails ou cookies:

- Admin: link no painel; pagina autorizada com estados vazios e sequencia orientada; criacao de unidade, setor, leito e recurso pela interface; codigo duplicado bloqueado com mensagem amigavel; FormData da mutacao contendo somente `kind` + `managementRef` (32 hex, nunca UUID) + `requestedStatus`; cancelamento sem mutacao; desativacao confirmada com status e botao atualizados; HTML sem UUID/e-mail/codigo de permissao; logout.
- Auditor: link presente; estrutura visivel em modo somente leitura; nenhum formulario, controle ou referencia opaca no HTML.
- Member: sem link; acesso direto negado no servidor sem vazar conteudo.
- Isolamento: admin de hospital de OUTRA organizacao ve estrutura vazia, sem nenhum item do outro tenant.
- Rota protegida apos logout exige autenticacao.
- Conferencia no banco: contagens exatas (1 unidade, 1 setor, 1 leito inativo, 1 recurso; zero no outro tenant; autoria `created_by` correta). Fixtures integralmente removidas com zero orfaos.
- Registro tecnico: no `next dev` local o Chromium headless nao hidratou o app (limitacao do ambiente de desenvolvimento, nao do produto); o E2E foi executado contra `next build` + `next start`, que hidratou normalmente.

## J. Criterio de encerramento

Atendido: estrutura hospitalar (unidades, setores, leitos e recursos institucionais) configuravel por instituicao, com isolamento multi-tenant comprovado em pgTAP e E2E, autorizacao semantica server-side com RLS como barreira final, lint/typecheck/testes/build/db:lint/db:test verdes e documentacao atualizada. Sprint 06 NAO foi iniciada.

## K. Fora do escopo

- Pacientes, episodios, prontuario, ocupacao de leitos, protocolos, medicamentos, insumos, estoque, laboratorio, UTI, IA, voz, integracoes externas.
