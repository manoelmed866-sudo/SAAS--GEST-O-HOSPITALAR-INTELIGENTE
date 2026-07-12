# DECISIONS.md

## Registro de decisoes

Este documento registra decisoes permanentes ou relevantes do projeto. Novas decisoes devem ser adicionadas sem apagar o historico.

## Decisoes iniciais da Sprint 00

### DEC-001 - Paciente como entidade longitudinal

O paciente sera tratado como entidade longitudinal, permitindo multiplos episodios assistenciais ao longo do tempo.

Motivo: evitar que cada atendimento seja tratado como pessoa isolada e permitir visao historica organizada.

### DEC-002 - Episodio assistencial como unidade de passagem

Cada passagem relevante do paciente pelo hospital sera representada como episodio assistencial.

Motivo: separar identidade do paciente de eventos, atendimentos, internacoes e ciclos especificos.

### DEC-003 - Separacao entre hipotese e diagnostico

Hipotese diagnostica nao sera tratada como diagnostico confirmado.

Motivo: preservar rigor clinico, rastreabilidade e decisao profissional.

### DEC-004 - Protocolos separados de execucoes

Protocolos institucionais serao separados das execucoes aplicadas a pacientes.

Motivo: permitir versionamento, auditoria e rastreio do que foi executado em cada episodio.

### DEC-005 - Sem diagnostico, prescricao ou conduta automatica

O sistema nao realizara diagnostico automatico, prescricao automatica ou condutas clinicas autonomas.

Motivo: preservar responsabilidade profissional e limites seguros do produto.

### DEC-006 - Dados ficticios no desenvolvimento

Durante desenvolvimento, testes e demonstracoes, somente dados ficticios poderao ser utilizados.

Motivo: reduzir risco de exposicao indevida de dados sensiveis.

### DEC-007 - Preparacao para multiplos hospitais

O sistema deve ser preparado para multiplos hospitais com isolamento de dados.

Motivo: permitir uso institucional seguro por diferentes hospitais ou unidades.

### DEC-008 - Sprint 00 exclusivamente documental

A Sprint 00 cria apenas documentacao permanente e nao implementa codigo, banco, telas, APIs ou dependencias.

Motivo: estabelecer base clara antes da implementacao.

### DEC-009 - Hipotese diagnostica como conceito rastreavel

Hipotese diagnostica pertence ao episodio assistencial, pode estar relacionada a sindrome, sinais, sintomas, problemas e exames, e pode possuir estados como proposta, em investigacao, descartada ou confirmada.

Motivo: preservar a diferenca entre possibilidade clinica e diagnostico confirmado, exigindo acao explicita de profissional autorizado para confirmacao e rastreabilidade nas mudancas de estado.

### DEC-010 - Recurso sugerido como conceito proprio

Recurso sugerido sera separado de recurso previsto pelo protocolo, recurso solicitado pelo profissional e recurso efetivamente utilizado.

Motivo: evitar que uma apresentacao contextual do sistema seja confundida com solicitacao, prescricao ou utilizacao.

### DEC-011 - Forma de chegada configuravel

Forma de chegada sera conceito configuravel por hospital e pertencera ao episodio assistencial.

Motivo: permitir que diferentes hospitais representem seus proprios tipos de entrada e acionem campos, documentos, responsaveis, prioridades, notificacoes, fluxos e protocolos sem lista rigida no codigo.

### DEC-012 - Canal de comunicacao configuravel e auditavel

Canal de comunicacao sera conceito configuravel por hospital e podera estar vinculado a chegada, transferencia, resultado critico, encaminhamento ou outro evento relevante.

Motivo: registrar comunicacoes institucionais com remetente, destinatario, data, hora, situacao e confirmacao quando aplicavel, preservando trilha de auditoria.

### DEC-013 - Modulo Inicio sem sprint propria

O modulo Inicio sera central de comando e apresentacao resumida da plataforma, implementado progressivamente durante as sprints dos demais modulos e consolidado na Sprint 20, quando indicadores e alertas estiverem disponiveis.

Motivo: evitar criar uma sprint isolada para um painel que depende de dados e capacidades dos demais modulos.

### DEC-014 - Historico longitudinal como visao derivada

Historico longitudinal sera uma visao organizada dos eventos assistenciais autorizados relacionados ao mesmo paciente.

Motivo: permitir visao cronologica e resumida do paciente sem duplicar cadastro, sem misturar hospitais indevidamente e respeitando contexto de acesso.

### DEC-015 - Linha do tempo separada de evolucao clinica

Linha do tempo do episodio sera a representacao cronologica dos acontecimentos de um episodio especifico e nao sera tratada como evolucao assistencial.

Motivo: separar eventos operacionais e assistenciais agregados de registros profissionais narrativos ou estruturados.

### DEC-016 - Evolucao assistencial com autoria profissional

Evolucao assistencial sera registro produzido por profissional identificado e autorizado, com categoria profissional, tipo, data, hora, estado, autoria e contexto.

Motivo: preservar responsabilidade profissional, impedir que o sistema escreva evolucoes em nome de profissionais e permitir rastreabilidade.

### DEC-017 - Complementacao e retificacao sem apagar original

Complementacao acrescentara informacao posterior e retificacao identificara correcao, ambas preservando vinculo com a evolucao original.

Motivo: impedir sobrescrita silenciosa de registros finalizados e manter autoria, data, hora e justificativa rastreaveis.

### DEC-018 - Acesso por perfil e contexto

Visualizacao e acoes dependerao de organizacao, hospital, unidade, setor, perfil, categoria profissional, permissoes especificas, vinculo assistencial, responsabilidade atribuida, finalidade do acesso e situacao do usuario.

Motivo: evitar acesso clinico irrestrito por nome de funcao e permitir areas de trabalho por login com menor privilegio.

### DEC-019 - Administrador sem acesso clinico automatico

Perfil administrador configurara instituicoes, unidades, usuarios, perfis e permissoes, mas nao recebera automaticamente acesso ao conteudo clinico.

Motivo: separar funcao administrativa de acesso assistencial e reduzir risco de exposicao indevida.

### DEC-020 - Separacao entre Sprint 06 e Sprint 13

A Sprint 06 sera dedicada a rede de referencia, comunicacao institucional e relacionamentos externos. A Sprint 13 sera responsavel pelo historico longitudinal funcional do paciente.

Motivo: evitar que comunicacao institucional e transferencia sejam confundidas com historico longitudinal clinico funcional.

### DEC-021 - Evento do Episodio como termo canonico

`Evento do Episodio` sera o termo canonico no modelo de dominio. `Evento da jornada` podera ser usado apenas como expressao de interface ou apresentacao.

Motivo: evitar duplicidade futura entre eventos assistenciais, clinicos e operacionais sem necessidade tecnica validada.

### DEC-022 - Recurso sugerido como estagio proprio no plano

Recurso sugerido permanece como estagio proprio entre recurso previsto pelo protocolo e recurso solicitado pelo profissional.

Motivo: sugestao nao equivale a solicitacao, prescricao ou baixa automatica de estoque, e aceite, rejeicao e justificativa devem ser rastreaveis.

### DEC-023 - Evolucoes essenciais dentro da Primeira Versao Operacional e prontuario completo fora do escopo

Evolucoes medicas, de enfermagem e multiprofissionais essenciais fazem parte da Primeira Versao Operacional, incluindo complementacao e retificacao. Prontuario eletronico completo em todas as suas funcoes permanece fora do escopo inicial.

Motivo: permitir registro assistencial essencial sem assumir substituicao integral de um prontuario eletronico hospitalar.

### DEC-024 - Visao Funcional Completa como posicionamento oficial

O produto sera desenhado com Visao Funcional Completa. A Primeira Versao Operacional sera somente um recorte utilizavel, integrado e validavel dessa visao.

Motivo: impedir que o primeiro recorte de implementacao seja confundido com o limite funcional final da plataforma.

### DEC-025 - Sprints como fases de construcao

As sprints indicam ordem controlada de construcao, nao importancia funcional nem limite definitivo do produto.

Motivo: preservar expansao arquitetural para modulos documentados e evitar reducoes permanentes de escopo por conveniencia de uma sprint.

### DEC-026 - Sistemas externos separados do nucleo

A Visao Funcional Completa nao exige substituir integralmente sistemas como ERP financeiro, contabilidade, folha de pagamento, faturamento completo, PACS, sistema laboratorial completo, sistemas governamentais ou todos os recursos de prontuarios comerciais.

Motivo: diferenciar nucleo da plataforma, integracoes previstas e sistemas administrativos externos.

### DEC-027 - Sprint 02 como fundacao local do banco

A Sprint 02 foi redefinida como fundacao local do banco de dados e das migracoes.

Motivo: autenticacao, contexto institucional, isolamento e permissoes dependem de banco local reproduzivel, migracoes versionadas, reset confiavel e tipos gerados antes da Sprint 03.

O design system nao foi removido. Ele permanece como trilha transversal do produto: a fundacao visual iniciou na Sprint 01, sera estendida na Sprint 03 para login e contexto institucional, consolidada inicialmente na Sprint 04 para areas autenticadas e ampliada em cada sprint funcional conforme componentes reais forem necessarios.

A Supabase CLI sera usada como dependencia de desenvolvimento local do projeto, com versao estavel e exata, sem faixa flutuante e sem beta, canary ou preview. Os comandos serao expostos por scripts npm e tambem poderao ser executados manualmente com `npm exec supabase --`, sem exigir instalacao global da CLI.

O Supabase local da Sprint 02 nao sera vinculado a projeto remoto. Nao sera executado `supabase login`, `supabase link` nem acesso a projeto remoto. Docker Desktop ou runtime Docker compativel e pre-requisito externo. Nenhum dado real sera utilizado e chaves locais geradas nao deverao ser copiadas para arquivos versionados.
