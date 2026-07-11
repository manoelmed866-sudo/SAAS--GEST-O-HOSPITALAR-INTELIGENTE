# ARCHITECTURE.md

## Arquitetura conceitual

A arquitetura funcional da Plataforma de Inteligencia Hospitalar parte da capacidade institucional do hospital e acompanha a jornada do paciente ate desfechos, indicadores e alertas.

A arquitetura representa a Visao Funcional Completa do produto. A Primeira Versao Operacional sera apenas um recorte utilizavel dessa arquitetura, sem reduzir o desenho dos modulos e relacionamentos planejados.

Fluxo conceitual:

```text
Capacidade hospitalar
-> Paciente e episodio
-> Sindrome ou hipotese
-> Protocolo institucional
-> Exames e recursos
-> Conduta registrada pelo profissional
-> Desfecho
-> Indicadores e alertas
```

## Camadas conceituais

### 1. Capacidade hospitalar

Representa os recursos institucionais disponiveis ou configuraveis, como unidades, setores, leitos, equipes, fluxos, exames, medicamentos, insumos, protocolos e regras operacionais.

Nao deve ser confundida com disponibilidade real em tempo instantaneo, que podera depender de integracoes, registros operacionais e atualizacoes futuras.

A Visao Funcional Completa tambem devera suportar organizacoes, hospitais, unidades, predios, servicos, especialidades, profissionais, equipes, equipamentos, ambulancias, capacidade cirurgica, capacidade obstetrica, suporte ventilatorio, matriz de capacidade, rede de referencia e comunicacao institucional.

### 2. Paciente e episodio

O paciente e uma entidade longitudinal. Ele pode ter multiplos episodios assistenciais ao longo do tempo.

O episodio assistencial representa uma passagem, atendimento, internacao ou ciclo de cuidado dentro de uma instituicao.

A forma de chegada identifica como o episodio comecou e deve ser configuravel por hospital. Ela pode influenciar campos, documentos, responsaveis, prioridades, notificacoes, fluxos e protocolos.

### 3. Sindrome ou hipotese

Sindrome, queixa, problema ou hipotese diagnostica podem orientar fluxos e protocolos, mas nao equivalem a diagnostico confirmado.

A plataforma deve preservar essa diferenca em interface, regras, registros e indicadores.

Hipoteses diagnosticas pertencem ao episodio, podem mudar de estado e exigem acao explicita de profissional autorizado para confirmacao. O sistema pode sugerir possibilidades, mas nao confirma hipoteses autonomamente.

### 3.1 Historico longitudinal do paciente

O historico longitudinal do paciente e uma visao organizada de eventos assistenciais relacionados a mesma pessoa dentro do contexto institucional autorizado.

Ele nao duplica o cadastro do paciente. Ele reune, conforme permissoes, informacoes de episodios anteriores, formas de chegada, avaliacoes, sinais vitais, problemas, hipoteses diagnosticas, diagnosticos confirmados, protocolos acionados, exames, resultados, evolucoes, internacoes, setores, leitos, transferencias, altas, retornos, eventos adversos, recursos utilizados, documentos e desfechos.

Eventos exibidos no historico devem manter origem, autor, data, hora e contexto. Dados de diferentes hospitais nao devem ser misturados sem regra institucional, autorizacao e integracao apropriadas.

### 3.2 Linha do tempo do episodio

A linha do tempo do episodio e a representacao cronologica dos acontecimentos de um episodio especifico.

Ela pode reunir abertura, chegada, comunicacao, avaliacao inicial, classificacao, protocolos acionados, exames solicitados, coletas, resultados, evolucoes, intercorrencias, recursos solicitados, recursos utilizados, mudancas de setor, mudancas de leito, internacao, transferencia, alta, encerramento e desfecho.

A linha do tempo nao e uma evolucao clinica. Ela agrega eventos de diversas origens e cada evento deve identificar tipo, autor ou sistema de origem, data, hora e contexto.

O sistema podera criar eventos automaticos operacionais, mas nao podera criar autonomamente conteudo clinico atribuido a um profissional.

### 3.3 Evolucao assistencial

Evolucao assistencial e registro produzido por profissional identificado e autorizado, vinculado a paciente e episodio assistencial.

Ela possui categoria profissional, tipo, data, hora, autoria, estado e contexto. Pode conter campos estruturados e texto livre conforme configuracao institucional.

Evolucoes podem se relacionar a problemas, hipoteses, diagnosticos, protocolos, exames, resultados, recursos, pendencias, setor, leito, documentos, anexos autorizados e eventos da linha do tempo.

Evolucoes integram a linha do tempo do episodio e o historico longitudinal conforme permissoes. Elas nao podem ser atribuidas ao sistema como se tivessem sido escritas por profissional.

### 4. Protocolo institucional

Protocolos institucionais organizam etapas, criterios, formularios, sugestoes e fluxos de atendimento definidos pelo hospital.

Eles nao substituem julgamento clinico, nao confirmam diagnosticos e nao executam condutas sem decisao profissional.

### 5. Exames e recursos

Exames possuem fluxo proprio. Eles podem ser previstos por protocolos, solicitados por profissionais, coletados, realizados, disponibilizados e interpretados conforme regras institucionais.

Medicamentos e insumos devem separar recursos previstos pelo protocolo, recursos sugeridos pelo sistema, recursos solicitados pelo profissional e recursos efetivamente utilizados.

### 6. Conduta registrada pelo profissional

Condutas, decisoes, justificativas e alteracoes relevantes devem ser registradas como atos profissionais quando aplicavel.

O sistema pode organizar o contexto, mas a decisao permanece humana e institucionalmente atribuida.

### 7. Desfecho

Desfechos representam resultados do episodio, como alta, transferencia, internacao, encerramento administrativo ou outros eventos definidos pela instituicao.

Nenhum desfecho clinico especifico deve ser inventado sem validacao institucional.

### 8. Indicadores e alertas

Indicadores agregam eventos, tempos, status, fluxos e resultados operacionais ou assistenciais definidos.

Alertas chamam atencao para condicoes configuradas, mas nao devem executar decisoes clinicas autonomamente.

## Modulo Inicio

O modulo Inicio sera a central de comando e apresentacao resumida da plataforma.

Ele deve reunir, de forma progressiva, informacoes sinteticas dos demais modulos, como pacientes, episodios, mapa do hospital, protocolos, exames, recursos, operacao, indicadores e alertas.

Esse modulo nao exige uma sprint propria. Ele sera implementado progressivamente durante as sprints dos demais modulos e consolidado na Sprint 20, quando indicadores e alertas estiverem disponiveis.

O conteudo do modulo Inicio e da area do paciente devera variar conforme perfil e contexto de acesso, considerando organizacao, hospital, unidade, setor, categoria profissional, permissoes especificas, vinculo com episodio, responsabilidade atribuida, finalidade do acesso e situacao do usuario.

A interface pode ocultar funcoes sem permissao, mas a autorizacao tambem devera ser aplicada no servidor e no banco quando essas camadas existirem.

## Sistemas externos

A arquitetura diferencia:

- funcionalidades pertencentes ao nucleo da plataforma;
- funcionalidades previstas por integracao;
- sistemas administrativos que nao pertencem ao nucleo atual.

A Visao Funcional Completa nao exige substituir integralmente ERP financeiro, contabilidade, folha de pagamento, faturamento hospitalar completo, compras publicas completas, PACS, processamento de imagens medicas, sistema laboratorial completo, sistema oficial de regulacao, sistemas governamentais ou todos os recursos existentes em prontuarios eletronicos comerciais.

A plataforma devera estar preparada para receber ou fornecer dados a esses sistemas quando necessario.

## Principio de evolucao arquitetural

As sprints indicam ordem de construcao. Estruturas iniciais devem preservar expansao para funcionalidades futuras da Visao Funcional Completa, evitando entidades improvisadas que gerem retrabalho previsivel.

## Diferenciacao de entidades

### Paciente

Pessoa acompanhada longitudinalmente pela instituicao. Pode ter um ou mais episodios assistenciais.

### Episodio

Representa uma passagem assistencial de um paciente por um fluxo de cuidado, atendimento, internacao ou processo institucional.

### Historico longitudinal

Visao derivada que organiza eventos e registros autorizados de multiplos episodios de um paciente. Nao substitui nem duplica o cadastro do paciente.

### Linha do tempo do episodio

Representacao cronologica dos eventos de um episodio especifico. Nao equivale a evolucao assistencial.

### Evolucao assistencial

Registro assistencial produzido por profissional identificado e autorizado, com categoria, tipo, data, hora, autoria, estado e contexto.

### Evolucao medica

Categoria de evolucao assistencial produzida por profissional medico autorizado. O sistema nao escreve a evolucao em nome do medico, nao confirma diagnostico e nao cria prescricao automatica.

### Evolucao multiprofissional

Evolucao assistencial de categoria profissional autorizada pelo hospital, como enfermagem, fisioterapia, nutricao, psicologia, servico social, farmacia clinica ou outras categorias configuradas.

### Complemento de evolucao

Registro posterior que acrescenta informacao a uma evolucao finalizada sem apagar o conteudo original.

### Retificacao de evolucao

Registro de correcao que identifica a alteracao, preserva vinculo com o original e exige autoria, data, hora e justificativa rastreaveis.

### Hipotese diagnostica

Possibilidade clinica vinculada a um episodio assistencial. Pode estar relacionada a sindrome, sinais, sintomas, problemas e exames. Pode possuir estados como proposta, em investigacao, descartada ou confirmada, sem equivaler automaticamente a diagnostico confirmado.

### Protocolo

Definicao institucional de um fluxo assistencial ou operacional. Contem estrutura, etapas, criterios, formularios e regras.

### Versao do protocolo

Retrato versionado de um protocolo em determinado momento. Permite rastrear qual conjunto de regras estava vigente quando uma execucao ocorreu.

### Execucao do protocolo

Aplicacao de uma versao de protocolo a um episodio especifico. A execucao registra etapas realizadas, sugestoes apresentadas, decisoes profissionais, evidencias e justificativas.

### Formulario

Conjunto de campos configuraveis para coleta estruturada de dados. Pode aparecer conforme modulo, etapa, regra, perfil, hospital ou contexto do episodio.

### Regra

Condicao configuravel que pode alterar fluxos, exibir campos, acionar orientacoes, gerar alertas ou sugerir proximas etapas. Nao deve automatizar diagnosticos, prescricoes ou condutas.

### Exame

Processo diagnostico ou complementar com ciclo proprio, separado da simples previsao em protocolo.

### Recurso

Medicamento, insumo, equipamento, leito, equipe ou capacidade operacional relacionada ao atendimento. Deve permitir distincao entre previsto, sugerido, solicitado e utilizado.

### Recurso sugerido

Recurso apresentado pelo sistema conforme contexto, regra ou protocolo. Nao equivale a solicitacao, prescricao ou utilizacao, e sua aceitacao, rejeicao ou justificativa deve poder ser auditada.

### Evento da jornada

Registro de ocorrencia relevante dentro do episodio, como chegada, classificacao, movimentacao, atendimento, solicitacao, resultado, decisao, transferencia, alta ou outro marco configurado.

### Forma de chegada

Configuracao institucional que identifica como o episodio comecou. Pode acionar protocolos, campos, documentos, responsaveis, prioridades, notificacoes e fluxos diferentes conforme hospital.

### Canal de comunicacao

Meio institucional configuravel usado em comunicacao relevante. Pode estar associado a chegada, transferencia, resultado critico, encaminhamento ou outro evento, com registro de remetente, destinatario, data, hora, situacao e confirmacao quando aplicavel.

### Contexto de acesso

Combinacao de organizacao, hospital, unidade, setor, perfil, categoria profissional, permissoes especificas, vinculo assistencial, responsabilidade atribuida, finalidade do acesso e situacao do usuario.

### Vinculo assistencial

Relacao autorizada entre profissional, paciente, episodio, setor, leito ou responsabilidade atribuida. Ajuda a definir quais informacoes e acoes ficam disponiveis.

### Indicador

Medida calculada a partir de dados registrados, voltada para acompanhamento assistencial, operacional ou de governanca.

### Alerta

Sinalizacao gerada por regra institucional para chamar atencao de usuarios autorizados. Deve ser rastreavel e nao substituir decisao profissional.
