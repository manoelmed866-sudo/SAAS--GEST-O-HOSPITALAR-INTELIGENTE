# SPRINT-00.md

## Sprint 00 - Documentacao permanente

## Objetivo

Transformar a definicao funcional da Plataforma de Inteligencia Hospitalar em documentacao permanente, suficiente para orientar todas as proximas etapas de desenvolvimento.

A Sprint 00 documenta a Visao Funcional Completa do produto. A Primeira Versao Operacional sera apenas um recorte utilizavel, integrado e validavel dessa visao, nao o limite funcional final.

## Escopo

Criar somente documentos de fundacao do projeto:

- regras permanentes para agentes;
- escopo do produto;
- arquitetura conceitual;
- regras de negocio conhecidas;
- itens fora de escopo;
- glossario;
- decisoes;
- pendencias conhecidas;
- changelog;
- status das sprints;
- plano mestre;
- modelo conceitual de dominio;
- principios de seguranca;
- conceito do motor de protocolos;
- historico longitudinal do paciente;
- linha do tempo do episodio;
- evolucoes assistenciais;
- matriz conceitual de acesso por perfil;
- areas de trabalho por perfil.

## Entregaveis

- `AGENTS.md`
- `PRODUCT_SCOPE.md`
- `ARCHITECTURE.md`
- `BUSINESS_RULES.md`
- `OUT_OF_SCOPE.md`
- `GLOSSARY.md`
- `DECISIONS.md`
- `KNOWN_ISSUES.md`
- `CHANGELOG.md`
- `SPRINT_STATUS.md`
- `PLANO_MESTRE_CODEX.md`
- `docs/sprints/SPRINT-00.md`
- `docs/database/DOMAIN-MODEL.md`
- `docs/security/SECURITY-PRINCIPLES.md`
- `docs/protocol-engine/PROTOCOL-CONCEPT.md`
- `docs/clinical/PATIENT-HISTORY-AND-EVOLUTIONS.md`
- `docs/security/ROLE-ACCESS-MATRIX.md`
- `docs/ui/ROLE-BASED-WORKSPACES.md`

## Restricoes

- Nao criar arquivos de codigo-fonte.
- Nao instalar pacotes.
- Nao criar `package.json`.
- Nao configurar Supabase.
- Nao criar tabelas.
- Nao criar migracoes.
- Nao criar telas.
- Nao criar APIs.
- Nao fazer commit.
- Nao avancar para a Sprint 01.

## Principios protegidos

- A plataforma possui Visao Funcional Completa.
- Nenhuma sprint isolada define o limite final do produto.
- A Primeira Versao Operacional e apenas uma etapa de implementacao e validacao.
- O paciente sera uma entidade longitudinal.
- Cada passagem do paciente sera representada por um episodio assistencial.
- Hipotese diagnostica nao sera tratada como diagnostico confirmado.
- Hipotese diagnostica pertencera ao episodio assistencial, podera ter estados rastreaveis e exigira acao explicita de profissional autorizado para confirmacao.
- Protocolos institucionais organizarao a assistencia sem substituir a decisao profissional.
- O protocolo sera separado de sua execucao em um paciente.
- Os exames possuirao fluxo proprio.
- Medicamentos e insumos previstos, sugeridos, solicitados e utilizados serao conceitos separados.
- O hospital podera configurar diferentes protocolos de chegada, comunicacao, admissao, atendimento, internacao, alta e transferencia.
- Forma de chegada e canal de comunicacao serao conceitos configuraveis por hospital.
- A interface podera apresentar campos, orientacoes e protocolos conforme regras institucionais configuradas.
- O modulo Inicio sera uma central de comando e apresentacao resumida, implementada progressivamente e consolidada na Sprint 20, quando indicadores e alertas estiverem disponiveis.
- O sistema nao realizara diagnostico automatico.
- O sistema nao realizara prescricao automatica.
- O sistema nao executara condutas clinicas autonomamente.
- Somente dados ficticios poderao ser utilizados durante o desenvolvimento.
- O sistema devera ser preparado para multiplos hospitais, com isolamento dos dados.
- Historico longitudinal, episodio assistencial, linha do tempo do episodio e evolucao assistencial serao conceitos diferentes.
- Evolucao assistencial dependera de autoria profissional identificada e autorizada.
- Evolucao finalizada nao devera ser sobrescrita silenciosamente.
- Complementacao e retificacao deverao preservar vinculo com registro original.
- Administrador nao recebera acesso clinico automatico.
- Acesso devera considerar perfil, hospital, unidade, setor, categoria profissional, permissoes, vinculo assistencial e finalidade.

## Criterios de aceite

- Todos os arquivos previstos foram criados.
- Nenhum arquivo fora do escopo documental foi criado, exceto a pasta `.git` autorizada para controle de versao local.
- A branch ativa e `sprint/00-documentacao`.
- A documentacao diferencia hipotese, diagnostico, protocolo, execucao, sugestao, decisao profissional, recurso previsto, recurso sugerido, recurso solicitado e recurso utilizado.
- A documentacao registra os limites de seguranca e isolamento institucional.
- A documentacao registra forma de chegada, canal de comunicacao e modulo Inicio em nivel conceitual.
- A documentacao registra historico longitudinal, linha do tempo, evolucoes assistenciais, complementacao, retificacao e matriz de acesso.
- Nenhum commit foi realizado.

## Correcoes documentais controladas

- Incluida hipotese diagnostica como conceito explicito do dominio.
- Incluido recurso sugerido como conceito proprio, separado de recurso previsto, solicitado e utilizado.
- Incluida forma de chegada como configuracao institucional vinculada ao episodio.
- Incluido canal de comunicacao como conceito configuravel e auditavel.
- Esclarecido que o modulo Inicio sera central de comando e resumo, sem sprint propria.
- Registrados aprofundamentos futuros de seguranca para sprints posteriores.
- Incluido historico longitudinal como visao derivada de eventos autorizados do paciente.
- Incluida linha do tempo do episodio separada de evolucao clinica.
- Incluidas evolucoes medicas e multiprofissionais como categorias configuraveis de evolucao assistencial.
- Incluidos estados de evolucao: rascunho, finalizada, complementada e retificada.
- Incluidas regras conceituais para acesso por perfil, contexto e vinculo assistencial.
- Criados documentos especificos para historico/evolucoes, matriz de acesso e areas de trabalho por perfil.
- Refinada a Sprint 06 como rede de referencia e comunicacao institucional, sem historico longitudinal funcional.
- Refinada a Sprint 13 como responsavel pelo historico longitudinal funcional do paciente.
- Refinada a Sprint 16 para explicitar recurso previsto, sugerido, solicitado e utilizado.
- Adotado Evento do Episodio como termo canonico no modelo de dominio.
- Atualizado o escopo para deixar evolucoes assistenciais essenciais dentro da Primeira Versao Operacional e prontuario eletronico completo fora do escopo.
- Reposicionado o produto como Visao Funcional Completa.
- Definida a Primeira Versao Operacional como recorte inicial, sem reduzir o produto completo.
- Registrado que funcionalidades fora do primeiro recorte continuam pertencendo a Visao Funcional Completa quando documentadas.

## Status

Concluída.

## Encerramento documental

- Documentacao revisada integralmente antes do primeiro commit.
- Nao houve achados criticos ou altos na revisao final.
- Sprint 00 aprovada para versionamento.
- Nenhuma funcionalidade foi implementada nesta sprint.
- Nenhum codigo-fonte, banco, migracao, API ou tela foi criado.
- A Sprint 01 nao foi iniciada.
