# BUSINESS_RULES.md

## Regras funcionais conhecidas

Este documento registra regras funcionais permanentes conhecidas ate a Sprint 00. As regras podem evoluir mediante decisao documentada, validacao institucional e sprint apropriada.

## Posicionamento do produto

- A plataforma esta sendo desenhada com Visao Funcional Completa.
- A Primeira Versao Operacional e um recorte utilizavel, integrado e validavel, nao o limite final do produto.
- Funcionalidades nao implementadas no primeiro recorte devem permanecer documentadas quando pertencerem a Visao Funcional Completa.
- Nenhuma sprint isolada define o limite final da plataforma.
- Decisoes funcionais e tecnicas devem preservar expansao para os modulos planejados.

## Paciente e episodio

- O paciente deve ser tratado como entidade longitudinal.
- O paciente possui uma identidade unica dentro do contexto institucional.
- Um paciente pode possuir multiplos episodios assistenciais.
- Cada passagem relevante do paciente pelo hospital deve ser representada por um episodio assistencial.
- Eventos, protocolos, exames, recursos, decisoes e desfechos devem estar vinculados ao episodio quando fizer sentido assistencial ou operacional.
- A forma de chegada pertence ao episodio assistencial e identifica como aquele episodio comecou.
- Cada hospital podera configurar seus proprios tipos de forma de chegada.

## Historico longitudinal

- Historico longitudinal e uma visao organizada de eventos assistenciais relacionados ao mesmo paciente.
- O historico longitudinal nao deve duplicar o cadastro do paciente.
- O historico longitudinal reune dados relevantes de episodios autorizados conforme regras institucionais.
- A visualizacao deve respeitar hospital, unidade, perfil, setor, vinculo assistencial e contexto de acesso.
- O historico pode ser apresentado de forma cronologica e resumida.
- Eventos exibidos devem manter identificacao de origem, autor, data e hora.
- Informacoes corrigidas nao devem apagar silenciosamente registros anteriores.
- Dados de diferentes hospitais nao devem ser misturados sem regra institucional, autorizacao e integracao apropriadas.

## Linha do tempo do episodio

- Linha do tempo e a representacao cronologica dos acontecimentos de um episodio especifico.
- Linha do tempo nao e evolucao clinica.
- Linha do tempo reune eventos de diversas origens.
- Cada evento deve identificar tipo, autor ou sistema de origem, data, hora e contexto.
- Eventos relevantes devem possuir rastreabilidade.
- O sistema pode criar eventos automaticos operacionais.
- O sistema nao pode criar autonomamente conteudo clinico atribuido a profissional.

## Hipotese e diagnostico

- Hipotese diagnostica nao e diagnostico confirmado.
- Sindromes, queixas, suspeitas e hipoteses podem orientar protocolos e formularios.
- Hipotese diagnostica pertence a um episodio assistencial.
- Hipotese diagnostica pode estar relacionada a sindrome, sinais, sintomas, problemas e exames.
- Hipotese diagnostica pode possuir estados como proposta, em investigacao, descartada ou confirmada.
- A confirmacao de uma hipotese diagnostica exige acao explicita de profissional autorizado.
- O sistema nao deve converter hipotese em diagnostico por regra automatica.
- A plataforma pode sugerir possibilidades, mas nao confirma hipoteses autonomamente.
- Alteracoes de estado de hipotese diagnostica precisam ser rastreaveis.
- Diagnosticos, quando existirem em sprints futuras, devem ser registrados conforme decisao profissional e regra institucional.

## Protocolos institucionais

- Protocolos organizam a assistencia, mas nao substituem a decisao profissional.
- O protocolo deve ser separado de sua execucao em um paciente.
- Protocolos devem possuir versionamento.
- Uma execucao de protocolo deve referenciar a versao utilizada no momento da execucao.
- Alteracoes em protocolos nao devem apagar o historico de execucoes anteriores.
- O hospital podera configurar protocolos de chegada, comunicacao, admissao, atendimento, internacao, alta e transferencia.

## Autonomia profissional

- O sistema nao realiza diagnostico automatico.
- O sistema nao realiza prescricao automatica.
- O sistema nao executa condutas clinicas autonomamente.
- O sistema nao escreve evolucao medica ou multiprofissional em nome de profissional.
- Sugestoes devem ser separadas de decisoes.
- Decisoes profissionais devem ser registradas com autoria, contexto e horario quando aplicavel.
- Quando uma sugestao nao for seguida, a justificativa podera ser registrada conforme regra institucional.

## Evolucoes assistenciais

- Evolucao assistencial pertence a um paciente e a um episodio assistencial.
- Evolucao assistencial e produzida por profissional identificado e autorizado.
- Evolucao assistencial possui categoria profissional, tipo, data, hora, autoria, estado e contexto.
- Evolucao assistencial pode estar relacionada a setor e leito.
- Evolucao assistencial pode conter campos estruturados e texto livre conforme configuracao institucional.
- Evolucao assistencial pode relacionar problemas, hipoteses, diagnosticos, protocolos, exames, recursos, pendencias, documentos e eventos.
- Evolucao assistencial integra a linha do tempo do episodio.
- Evolucao assistencial integra o historico longitudinal conforme permissoes.
- Evolucao assistencial nao pode ser atribuida ao sistema como se tivesse sido escrita por profissional.
- Categorias de evolucao, como medica, enfermagem, fisioterapia, nutricao, psicologia, servico social, farmacia clinica e outras autorizadas pelo hospital, devem ser configuraveis e nao listas rigidas imutaveis no codigo.

## Evolucao medica

- Evolucao medica e uma categoria de evolucao assistencial.
- Tipos de evolucao medica devem ser configuraveis por hospital.
- Exemplos demonstrativos incluem avaliacao medica inicial, evolucao medica diaria, evolucao de plantao, registro de intercorrencia, reavaliacao, parecer especializado, evolucao pre-operatoria, evolucao pos-operatoria, registro de transferencia, resumo de alta, complemento e retificacao.
- Esses exemplos nao sao conteudo clinico obrigatorio nem lista fixa definitiva.
- A estrutura de uma evolucao medica podera permitir, conforme configuracao institucional, motivo ou contexto, estado clinico atual, queixas, exame fisico, sinais vitais relacionados, problemas ativos, hipoteses diagnosticas, diagnosticos confirmados, exames relevantes, resposta a acoes anteriores, avaliacao profissional, plano registrado pelo profissional, protocolos relacionados, pendencias, previsao de reavaliacao e texto livre.
- A conclusao e finalizacao pertencem ao profissional autorizado.
- Eventual assistencia futura para resumo ou organizacao devera ser claramente identificada e sempre validada pelo profissional.

## Estados, complementacao e retificacao

- Estados conceituais minimos de evolucao: rascunho, finalizada, complementada e retificada.
- Rascunho pode ser editado pelo autor dentro das regras institucionais.
- Evolucao finalizada preserva o conteudo registrado.
- Complementacao acrescenta informacao posterior sem apagar o original.
- Retificacao identifica a correcao e mantem vinculo com o registro original.
- Autor, data, hora e justificativa devem ser rastreaveis.
- Regras definitivas de assinatura, validade, retencao e correcao deverao passar por validacao institucional e juridica antes da producao.

## Formularios dinamicos

- A interface podera apresentar campos, orientacoes e protocolos conforme regras institucionais configuradas.
- Formularios devem ser configuraveis por hospital, modulo, fluxo, etapa, perfil e contexto quando essa capacidade for implementada.
- Campos dinamicos devem possuir validacao apropriada.
- A exibicao de um campo nao deve significar confirmacao clinica automatica.
- Formas de chegada podem definir campos, documentos, responsaveis, prioridades, notificacoes e fluxos conforme configuracao institucional.
- Formas de chegada nao devem ser limitadas a uma lista rigida no codigo.

## Comunicacoes institucionais

- Canal de comunicacao identifica o meio institucional utilizado em uma comunicacao relevante.
- Canais de comunicacao podem estar relacionados a chegada, transferencia, resultado critico, encaminhamento ou outro evento.
- Cada hospital podera configurar os canais permitidos.
- O sistema nao deve ser limitado a um unico meio de comunicacao.
- Comunicacoes relevantes devem registrar remetente, destinatario, data, hora, situacao e confirmacao quando aplicavel.
- Comunicacoes relevantes devem integrar a trilha de auditoria.

## Exames

- Exames possuem fluxo proprio.
- Exames previstos por protocolo devem ser separados de exames solicitados.
- Exames solicitados devem ser separados de exames realizados.
- Resultados de exames devem ser tratados como evidencias registradas, nao como decisoes automaticas.
- Interpretacoes e condutas derivadas devem preservar decisao profissional.

## Medicamentos e insumos

- Recursos previstos devem ser separados de recursos solicitados.
- Recursos sugeridos devem ser separados de recursos previstos, solicitados e utilizados.
- Recursos solicitados devem ser separados de recursos efetivamente utilizados.
- Recurso previsto e o recurso relacionado a definicao do protocolo.
- Recurso sugerido e uma apresentacao contextual feita pelo sistema.
- Recurso solicitado depende de decisao profissional.
- Recurso utilizado representa consumo ou uso registrado no episodio.
- Uma sugestao nao equivale a solicitacao, prescricao ou utilizacao.
- Aceite, rejeicao e justificativa de sugestoes devem poder ser auditados.
- O sistema nao executa automaticamente a utilizacao do recurso.
- Uso de medicamentos e insumos deve ser rastreavel quando essa funcionalidade existir.
- A existencia de recurso previsto em protocolo nao significa prescricao automatica.

## Rastreabilidade

- Operacoes sensiveis devem gerar registro de auditoria.
- Mudancas relevantes em protocolos, formularios, regras, decisoes, recursos e desfechos devem preservar historico.
- Registros devem manter autoria, data, contexto e instituicao quando aplicavel.
- Consultas sensiveis devem poder ser rastreadas quando aplicavel.
- Evolucoes finalizadas nao devem ser sobrescritas silenciosamente.

## Acesso por perfil e contexto

- O modulo Inicio e a area do paciente devem ser apresentados de forma diferente conforme perfil e contexto de acesso.
- A interface nao deve depender apenas do cargo do usuario.
- A autorizacao deve considerar organizacao, hospital, unidade, setor, perfil, categoria profissional, permissoes especificas, vinculo com episodio, responsabilidade atribuida, finalidade do acesso e situacao do usuario.
- Um perfil nao deve receber acesso clinico irrestrito apenas por possuir determinado nome de funcao.
- Administrador configura instituicoes, unidades, usuarios, perfis e permissoes, mas nao recebe automaticamente acesso ao conteudo clinico.
- Auditor possui acesso somente leitura ao escopo autorizado e nao cria, edita, finaliza ou retifica evolucoes.
- Medicos, enfermagem, laboratorio, farmacia, almoxarifado, direcao, gestao, qualidade e responsavel tecnico devem ter areas de trabalho e acoes conforme permissoes institucionais.
- A interface pode ocultar funcoes, mas a seguranca tambem deve ser aplicada no servidor e no banco quando existirem.

## Isolamento institucional

- O sistema deve ser preparado para multiplos hospitais.
- Dados de um hospital nao podem ser acessados por outro hospital.
- Regras, protocolos, formularios, usuarios, perfis, indicadores e configuracoes podem variar por hospital.
- Autorizacao deve ser aplicada no servidor e no banco de dados quando essas camadas forem implementadas.
- Historico longitudinal e evolucoes devem respeitar isolamento institucional e contexto de acesso.

## Sistemas externos e integracoes

- A Visao Funcional Completa nao exige substituir integralmente ERP financeiro, contabilidade, folha de pagamento, faturamento hospitalar completo, compras publicas completas, PACS, processamento de imagens medicas, sistema laboratorial completo, sistema oficial de regulacao, sistemas governamentais ou todos os recursos de prontuarios eletronicos comerciais.
- A plataforma devera estar preparada para receber ou fornecer dados a sistemas externos quando necessario.
- O fato de um sistema externo nao fazer parte do nucleo atual nao impede integracoes futuras.

## Dados ficticios

- Durante desenvolvimento, testes e demonstracoes, somente dados ficticios podem ser utilizados.
- Nenhum dado real de paciente, profissional ou instituicao deve ser inserido no projeto.
