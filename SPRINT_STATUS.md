# SPRINT_STATUS.md

## Status das sprints

Este arquivo acompanha o estado macro do plano de desenvolvimento.

As sprints constroem progressivamente a Visao Funcional Completa. A Primeira Versao Operacional sera um recorte integrado e validavel, nao o limite final do produto.

| Etapa | Nome | Status |
| --- | --- | --- |
| Sprint 00 | Documentacao permanente | Concluída |
| Sprint 01 | Fundacao visual e tecnica inicial | Concluída |
| Sprint 02 | Fundacao local do banco e migracoes | Concluída |
| Sprint 03 | Autenticacao, contexto institucional e extensao visual autenticada | Não iniciada |
| Sprint 04 | Administracao, governanca e design system autenticado inicial | Pendente |
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
- A Sprint 03 permanece nao iniciada.

## Observacao sobre Sprint 06 e Sprint 13

A Sprint 06 trata rede de referencia, comunicacao institucional e relacionamentos externos. O historico longitudinal funcional do paciente fica reservado para a Sprint 13.

## Encerramento da Sprint 00

- Validacao documental realizada por Manoel Neto em 2026-07-11.
- Sprint 00 aprovada para encerramento documental.
- Primeiro commit autorizado na branch `sprint/00-documentacao`.
- Todas as demais sprints permanecem pendentes.
- A Sprint 01 foi iniciada posteriormente na branch `sprint/01-fundacao-local` e concluida apos validacao tecnica.
