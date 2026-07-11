# CHANGELOG.md

## Changelog

Todas as mudancas relevantes do projeto devem ser registradas aqui.

## 2026-07-11

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
