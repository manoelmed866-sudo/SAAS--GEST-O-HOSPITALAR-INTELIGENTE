# PRODUCT_SCOPE.md

## Visao do produto

A Plataforma de Inteligencia Hospitalar sera um sistema institucional para apoiar a organizacao da jornada assistencial, operacional e gerencial de hospitais.

O produto deve conectar dados de pacientes, episodios assistenciais, protocolos institucionais, exames, medicamentos, insumos, operacao hospitalar, indicadores e alertas em uma estrutura unica, rastreavel e configuravel.

A plataforma nao substitui a decisao profissional. Ela organiza informacoes, apresenta orientacoes institucionais, registra execucoes e melhora a capacidade de acompanhamento da operacao hospitalar.

Ela tambem devera organizar o historico longitudinal do paciente, o historico completo dos episodios assistenciais, a linha do tempo de cada episodio e as evolucoes assistenciais registradas por profissionais autorizados.

## Terminologia oficial

### Visao Funcional Completa

Conjunto integral das capacidades planejadas para o produto, independentemente da sprint ou versao em que serao implementadas.

### Primeira Versao Operacional

Primeiro recorte utilizavel, integrado e validavel da plataforma. A Primeira Versao Operacional nao representa o limite funcional do produto.

### Sprint

Unidade controlada de desenvolvimento que implementa parte da Visao Funcional Completa.

### Versao Candidata

Versao submetida a estabilizacao, testes e auditoria.

### Produto Completo

Plataforma que implementa os modulos e relacionamentos pertencentes a Visao Funcional Completa, sem obrigatoriamente substituir todos os sistemas administrativos externos utilizados por um hospital.

## Visao Funcional Completa

A arquitetura completa devera comportar os grupos funcionais abaixo. Todos pertencem a Visao Funcional Completa, mesmo quando a implementacao ocorrer em sprints, versoes ou integracoes diferentes.

### Estrutura institucional

- Organizacoes, hospitais, unidades, predios, setores, servicos, especialidades, profissionais, equipes, leitos, equipamentos e ambulancias.
- Capacidade cirurgica, capacidade obstetrica, suporte ventilatorio, matriz de capacidade, rede de referencia e comunicacao institucional.

### Paciente e assistencia

- Cadastro longitudinal, prevencao de duplicidade, historico longitudinal, episodios assistenciais, formas de chegada, linha do tempo e Eventos do Episodio.
- Triagem quando aplicavel, classificacao, avaliacoes, sinais vitais, problemas ativos, hipoteses diagnosticas, diagnosticos diferenciais, diagnosticos confirmados, internacao, observacao, movimentacoes, transferencias, altas, retornos, desfechos, eventos adversos, documentos e anexos autorizados.

### Evolucoes assistenciais

- Evolucao medica, evolucao de enfermagem, evolucoes multiprofissionais, formularios estruturados, texto livre, rascunho, finalizacao, complemento, retificacao, autoria, data e hora, setor, leito, anexos, filtros, busca, visualizacao por perfil, preservacao do registro original e rastreabilidade.

### Protocolos e inteligencia assistencial

- Sindromes, diagnosticos, linhas de cuidado, criterios clinicos, criterios de gravidade, protocolos assistenciais, protocolos operacionais, protocolos de chegada, protocolos de comunicacao, versionamento, revisao, aprovacao, publicacao, arquivamento, construtor visual, formularios dinamicos, motor de regras, criterios preenchidos, criterios pendentes, sugestoes institucionais, aceite, rejeicao, justificativa e evidencias de execucao.

### Exames e diagnostico complementar

- Catalogo, disponibilidade, solicitacao, prioridade, coleta, material, transporte, processamento, laudo, resultado estruturado, valores de referencia, anexos, exames externos, resultados criticos, comunicacao, confirmacao de ciencia, indicadores de tempo e indisponibilidade de equipamento ou insumo.

### Medicamentos, insumos e recursos

- Medicamentos, materiais, insumos, equipamentos, apresentacoes, unidades de medida, criticidade, substitutos, recursos previstos, recursos sugeridos, recursos solicitados, recursos efetivamente utilizados, estoque por local, lotes, validade, movimentacoes, perdas, estoque minimo, estoque de seguranca, consumo, pedidos em transito, fornecedores, custos, previsao de demanda, risco de ruptura, risco de vencimento e planejamento de reposicao.

### Operacao hospitalar

- Fluxo de pacientes, filas, observacao, internacao, ocupacao, movimentacao, transferencias, altas, tempos entre etapas, pendencias, indisponibilidade de equipamentos, gargalos provaveis, comunicacao operacional e gestao de capacidade.

### Indicadores, alertas e governanca

- Painel executivo, assistencial, clinico, de pacientes, protocolos, exames, estoque e operacional; alertas, responsaveis, prazos, resolucao, planos de acao, qualidade, eventos adversos, auditoria, versionamento, trilhas de acesso, relatorios, exportacoes e governanca institucional.

### Areas por perfil

- Medico, enfermagem, equipe multiprofissional, laboratorio e diagnostico, farmacia, almoxarifado, direcao, gestao, qualidade, responsavel tecnico, administrador e auditor.

### Integracoes e evolucao futura

- APIs, importacoes, exportacoes, integracoes com sistemas existentes, prontuarios, laboratorio, imagem, estoque, sistemas administrativos e arquitetura preparada para inteligencia assistiva futura.

## Problema que resolve

Hospitais frequentemente operam com informacoes fragmentadas entre recepcao, atendimento, enfermagem, exames, farmacia, gestao de leitos, administracao e indicadores.

Essa fragmentacao dificulta:

- acompanhar a jornada completa do paciente;
- diferenciar historico longitudinal de atendimentos isolados;
- aplicar protocolos institucionais de forma consistente;
- rastrear decisoes, justificativas e desfechos;
- visualizar gargalos operacionais;
- separar recursos previstos, solicitados e efetivamente utilizados;
- visualizar historico longitudinal, linha do tempo do episodio e evolucoes sem misturar conceitos diferentes;
- controlar acesso conforme perfil, hospital, unidade, setor, vinculo assistencial e finalidade;
- gerar indicadores confiaveis;
- manter governanca entre unidades, equipes e hospitais.

## Publico institucional

O produto e direcionado a instituicoes hospitalares e suas equipes autorizadas, incluindo:

- administracao hospitalar;
- coordenacoes assistenciais;
- equipes medicas;
- equipes de enfermagem;
- equipes de apoio diagnostico;
- farmacia e suprimentos;
- regulacao interna;
- qualidade e seguranca do paciente;
- auditoria e governanca;
- tecnologia da informacao institucional.

## Modulos do produto

1. Inicio.
2. Pacientes e Atendimentos.
3. Mapa do Hospital.
4. Gestao Clinica.
5. Protocolos Assistenciais.
6. Exames e Diagnostico.
7. Medicamentos e Insumos.
8. Operacao Hospitalar.
9. Indicadores e Alertas.
10. Administracao e Governanca.

## Proposta de valor

- Centralizar a visao institucional da jornada hospitalar.
- Tratar o paciente como entidade longitudinal.
- Representar cada passagem hospitalar como episodio assistencial.
- Apoiar protocolos institucionais sem automatizar condutas clinicas.
- Permitir configuracao de fluxos por hospital.
- Melhorar rastreabilidade de eventos, decisoes e recursos.
- Permitir visualizacao organizada do historico longitudinal do paciente conforme permissoes.
- Permitir evolucoes assistenciais com autoria profissional, estados e rastreabilidade.
- Diferenciar areas de trabalho por perfil de login sem conceder acesso clinico irrestrito por nome de funcao.
- Apoiar gestao operacional com indicadores e alertas.
- Preparar a base para multiplos hospitais com isolamento de dados.

## Primeira Versao Operacional

A Primeira Versao Operacional sera um recorte funcional integrado, utilizavel e validavel da plataforma. Ela nao representa o produto final nem o limite funcional da arquitetura.

Ela podera priorizar:

- autenticacao;
- organizacoes e hospitais;
- perfis e permissoes;
- estrutura institucional;
- paciente;
- episodio assistencial;
- historico longitudinal inicial;
- linha do tempo;
- evolucoes essenciais;
- protocolos;
- formularios;
- regras;
- exames;
- recursos;
- operacao;
- indicadores iniciais;
- auditoria.

Funcionalidades nao incluidas na Primeira Versao Operacional continuam pertencendo a Visao Funcional Completa.

Limites do primeiro recorte:

- nao ser prontuario eletronico completo;
- nao ser prescricao medica completa;
- nao ser ERP hospitalar;
- nao ser PACS;
- nao ser sistema laboratorial completo;
- nao ser sistema oficial de regulacao;
- nao realizar diagnostico automatico;
- nao realizar prescricao automatica;
- nao executar condutas clinicas autonomamente;
- nao escrever evolucoes medicas ou multiprofissionais em nome de profissionais;
- nao conceder acesso clinico automatico a administradores;
- utilizar somente dados ficticios em desenvolvimento.

## Principio de construcao

- As sprints indicam ordem de construcao, nao importancia funcional.
- Cada sprint implementara parte da Visao Funcional Completa.
- Estruturas criadas nas primeiras sprints deverao suportar expansoes futuras.
- Entidades importantes nao deverao ser substituidas por campos improvisados.
- Funcionalidades futuras deverao ser consideradas nos relacionamentos e limites de dominio.
- A construcao devera evitar retrabalho arquitetural previsivel.
- Modulos poderao receber melhorias apos a Sprint 22.
- A auditoria no Claude sera um marco de validacao externa, nao necessariamente o encerramento definitivo do produto.

## Resultados esperados

- Documentacao permanente suficiente para orientar as proximas sprints.
- Modelo conceitual claro de paciente, episodio, protocolos, exames, recursos, eventos, indicadores e alertas.
- Modelo documental claro para historico longitudinal, linha do tempo do episodio, evolucoes assistenciais, complementacao e retificacao.
- Diretrizes iniciais de visualizacao e permissoes por perfil.
- Regras funcionais iniciais registradas.
- Limites de seguranca e governanca documentados.
- Plano mestre de desenvolvimento definido da Sprint 00 ate a Sprint 22.
- Preparacao para auditoria final no Claude apos as sprints planejadas.
