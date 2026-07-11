# PLANO_MESTRE_CODEX.md

## Plano mestre de desenvolvimento

Este plano organiza a evolucao da Plataforma de Inteligencia Hospitalar da Sprint 00 ate a Sprint 22, seguida de preparacao para auditoria no Claude.

Nenhuma sprint alem da Sprint 00 esta sendo executada neste momento.

As 22 sprints constroem progressivamente a Visao Funcional Completa. A Primeira Versao Operacional surgira durante esse processo como recorte utilizavel, integrado e validavel, sem representar o limite funcional final do produto.

Nenhuma funcionalidade pertencente a Visao Funcional Completa deve ser removida por nao caber na Primeira Versao Operacional. Pendencias devem ser registradas como planejadas ou sujeitas a validacao, nao apagadas do escopo.

## Sprint 00 - Documentacao permanente

Objetivo: transformar a definicao funcional inicial em documentacao permanente.

Principais entregas: escopo, arquitetura conceitual, regras de negocio, glossario, plano mestre, modelo de dominio, seguranca e conceito de protocolos.

Dependencias: definicao inicial do produto.

Criterios de avanco: documentacao validada por Manoel Neto.

## Sprint 01 - Fundacao tecnica do projeto

Objetivo: criar a base tecnica da aplicacao.

Principais entregas: estrutura inicial do projeto, padroes de ambiente, scripts basicos e documentacao tecnica inicial.

Dependencias: Sprint 00 validada.

Criterios de avanco: projeto inicia localmente e possui comandos basicos de qualidade.

## Sprint 02 - Design system e estrutura visual

Objetivo: definir linguagem visual e componentes base.

Principais entregas: layout principal, navegacao, componentes reutilizaveis e padroes de estado.

Dependencias: Sprint 01.

Criterios de avanco: interface base navegavel com componentes consistentes.

## Sprint 03 - Autenticacao e contexto institucional

Objetivo: estabelecer entrada segura e contexto de hospital.

Principais entregas: autenticacao, sessao, contexto institucional, matriz de papeis, permissoes, areas de trabalho por login e regras iniciais de acesso.

Dependencias: Sprint 01.

Criterios de avanco: usuario autenticado acessa somente contexto permitido e administrador nao recebe acesso clinico automatico.

## Sprint 04 - Administracao e governanca inicial

Objetivo: criar base administrativa para usuarios, perfis e configuracoes.

Principais entregas: estrutura de perfis, permissoes, configuracoes institucionais e registros administrativos.

Dependencias: Sprint 03.

Criterios de avanco: administracao inicial operando com isolamento institucional.

## Sprint 05 - Cadastro institucional hospitalar

Objetivo: modelar hospitais, unidades, setores e capacidades.

Principais entregas: cadastro de hospital, unidades, setores, leitos e recursos institucionais.

Dependencias: Sprint 04.

Criterios de avanco: estrutura hospitalar configuravel por instituicao.

## Sprint 06 - Rede de referencia e comunicacao institucional

Objetivo: estruturar rede de referencia, comunicacao institucional e relacionamentos externos.

Principais entregas: unidades de referencia, canais de comunicacao, relacionamentos externos, fluxos de encaminhamento, transferencia e retorno, sem implementar historico longitudinal funcional do paciente.

Dependencias: Sprint 03 e Sprint 05.

Criterios de avanco: comunicacoes e referencias institucionais ficam configuradas sem misturar dados clinicos ou historico longitudinal funcional.

## Sprint 07 - Episodios assistenciais

Objetivo: registrar passagens assistenciais vinculadas ao paciente.

Principais entregas: abertura, acompanhamento e encerramento conceitual de episodios.

Dependencias: Sprint 06.

Criterios de avanco: paciente possui multiplos episodios rastreaveis.

## Sprint 08 - Mapa do hospital

Objetivo: visualizar estrutura operacional e ocupacao conceitual.

Principais entregas: mapa de setores, leitos, status e movimentacoes basicas.

Dependencias: Sprint 05 e Sprint 07.

Criterios de avanco: mapa reflete episodios e capacidade configurada.

## Sprint 09 - Eventos do Episodio

Objetivo: registrar Eventos do Episodio relevantes.

Principais entregas: linha do tempo, tipos de Eventos do Episodio, autoria e auditoria inicial.

Dependencias: Sprint 07.

Criterios de avanco: Eventos do Episodio ficam ordenados e rastreaveis.

## Sprint 10 - Formularios dinamicos

Objetivo: permitir coleta estruturada configuravel.

Principais entregas: definicao de formularios, campos, validacoes e exibicao por contexto.

Dependencias: Sprint 04 e Sprint 09.

Criterios de avanco: formulario configurado aparece no contexto correto.

## Sprint 11 - Protocolos institucionais

Objetivo: cadastrar definicoes de protocolos institucionais.

Principais entregas: protocolo, etapas, criterios, regras, formularios associados, modelos configuraveis de formularios de evolucao e status.

Dependencias: Sprint 10.

Criterios de avanco: protocolo pode ser definido sem executar condutas automaticamente.

## Sprint 12 - Versionamento de protocolos

Objetivo: preservar historico de mudancas em protocolos.

Principais entregas: versoes, publicacao, vigencia e rastreio.

Dependencias: Sprint 11.

Criterios de avanco: execucoes futuras conseguem referenciar versoes publicadas.

## Sprint 13 - Execucao de protocolos e historico longitudinal

Objetivo: aplicar versao de protocolo a episodio especifico e implementar o historico longitudinal funcional do paciente.

Principais entregas: execucao, etapas realizadas, sugestoes, evidencias, decisoes, justificativas, cadastro longitudinal do paciente, reuniao dos episodios autorizados, visao cronologica, filtros, consulta conforme permissoes e preparacao para integracao posterior com linha do tempo, evolucoes, exames, protocolos e desfechos.

Dependencias: Sprint 07, Sprint 09 e Sprint 12.

Criterios de avanco: protocolo executado registra dados sem substituir decisao profissional e historico longitudinal funcional consulta apenas episodios autorizados.

## Sprint 14 - Gestao clinica e linha do tempo sem automacao decisoria

Objetivo: organizar informacoes clinicas e linha do tempo do episodio sem diagnostico ou prescricao automatica.

Principais entregas: hipoteses, problemas, decisoes profissionais, registros de conduta, eventos do episodio e linha do tempo.

Dependencias: Sprint 13.

Criterios de avanco: hipotese, sugestao, decisao, evento de linha do tempo e evolucao permanecem conceitos separados.

## Sprint 15 - Exames, diagnostico e evolucoes assistenciais

Objetivo: estruturar fluxo proprio de exames e evolucoes assistenciais.

Principais entregas: previsao, solicitacao, realizacao, resultado, vinculo com evidencias, evolucoes medicas e multiprofissionais, rascunho, finalizacao, complemento, retificacao e associacao com problemas, hipoteses, protocolos e exames.

Dependencias: Sprint 14.

Criterios de avanco: exames seguem fluxo proprio, nao confirmam diagnostico automaticamente e evolucoes exigem autoria profissional sem sobrescrita silenciosa.

## Sprint 16 - Medicamentos, insumos e recursos

Objetivo: separar recursos previstos, sugeridos, solicitados e utilizados.

Principais entregas: catalogo conceitual, recurso previsto pelo protocolo, recurso sugerido pelo sistema, recurso solicitado pelo profissional, recurso efetivamente utilizado, aceite, rejeicao, justificativa e rastreio.

Dependencias: Sprint 14.

Criterios de avanco: sugestao nao equivale a solicitacao, prescricao ou baixa automatica de estoque; aceite, rejeicao e justificativa sao rastreaveis; decisao permanece com profissional autorizado.

## Sprint 17 - Operacao hospitalar

Objetivo: consolidar fluxos operacionais de atendimento, internacao, transferencia e alta.

Principais entregas: paineis operacionais, filas, status, movimentacoes e gargalos.

Dependencias: Sprint 08, Sprint 09, Sprint 15 e Sprint 16.

Criterios de avanco: operacao acompanha episodios e recursos em tempo de sistema.

## Sprint 18 - Indicadores

Objetivo: criar indicadores assistenciais, operacionais e administrativos iniciais.

Principais entregas: definicao, calculo, visualizacao e filtros institucionais.

Dependencias: Sprint 17.

Criterios de avanco: indicadores sao calculados com dados isolados por hospital.

## Sprint 19 - Alertas

Objetivo: implementar alertas configuraveis por regras institucionais.

Principais entregas: definicao de alertas, disparos, status, destinatarios, trilha e integracao das evolucoes com internacao, setor, leito, transferencia, alta e jornada operacional.

Dependencias: Sprint 18.

Criterios de avanco: alertas sinalizam condicoes sem executar decisoes autonomas e evolucoes se conectam a jornada operacional sem perder autoria.

## Sprint 20 - Auditoria, logs e seguranca ampliada

Objetivo: fortalecer rastreabilidade, autorizacao, protecao de dados e consolidar o modulo Inicio por perfil.

Principais entregas: logs sensiveis, revisao de permissoes, politicas de acesso, protecao de anexos, modulo Inicio com informacoes personalizadas por perfil, paineis e listas de trabalho conforme permissoes.

Dependencias: Sprint 03, Sprint 04 e Sprint 19.

Criterios de avanco: operacoes sensiveis possuem registro, controles revisados e areas de trabalho respeitam permissoes.

## Sprint 21 - Testes integrados e hardening

Objetivo: validar fluxos principais de ponta a ponta e produzir uma Versao Candidata para auditoria.

Principais entregas: testes integrados, revisao de erros, ajustes de desempenho, verificacoes de seguranca, testes de autorizacao por perfil, isolamento institucional, acesso ao historico, autoria, preservacao de evolucao finalizada, complemento, retificacao, permissoes na interface, servidor e banco, e Versao Candidata estabilizada.

Dependencias: Sprint 20.

Criterios de avanco: fluxos criticos passam em testes e revisoes, incluindo acesso contextual e preservacao de registros finalizados, permitindo auditoria interna.

## Sprint 22 - Auditoria interna da versao candidata

Objetivo: realizar auditoria interna do marco construido e preparar a versao para auditoria externa independente.

Principais entregas: revisao final, documentacao de uso, checklist de auditoria, pacote de demonstracao com dados ficticios, pendencias classificadas e plano de continuidade da Visao Funcional Completa.

Dependencias: Sprint 21.

Criterios de avanco: Versao Candidata auditada internamente e pronta para avaliacao institucional e auditoria externa.

## Auditoria Claude - Revisao externa

Objetivo: submeter arquitetura, seguranca, escopo e coerencia funcional a auditoria externa independente no Claude.

Principais entregas: pacote documental, relatorio de riscos, perguntas de auditoria e plano de correcao.

Dependencias: Sprint 22.

Criterios de avanco: achados avaliados, classificados e transformados em plano de acao.

## Continuidade apos auditoria externa

Funcionalidades, expansoes e integracoes adicionais poderao continuar apos esse marco. A auditoria no Claude e marco de validacao externa, nao encerramento definitivo do produto.
