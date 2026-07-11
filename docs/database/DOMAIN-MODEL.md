# DOMAIN-MODEL.md

## Modelo conceitual de dominio

Este documento descreve entidades e relacionamentos em nivel conceitual. Nao contem SQL, tabelas, migracoes ou implementacao de banco.

O modelo representa a Visao Funcional Completa em nivel conceitual. A Primeira Versao Operacional podera implementar um recorte, mas nao deve substituir entidades relevantes por campos improvisados incompativeis com a expansao futura.

## Entidades principais

### Hospital

Instituicao ou unidade institucional que possui dados, usuarios, configuracoes, protocolos e registros isolados.

Relacionamentos:

- possui usuarios;
- possui setores;
- possui recursos;
- possui protocolos;
- possui formularios;
- possui pacientes e episodios dentro de seu contexto institucional.

### Usuario

Pessoa autorizada a acessar a plataforma conforme perfil e hospital.

Relacionamentos:

- pertence a um ou mais contextos institucionais;
- possui perfil ou permissoes;
- pode registrar eventos, decisoes, solicitacoes e alteracoes autorizadas.

### Perfil ou papel

Conjunto de permissoes associadas a funcoes institucionais.

Relacionamentos:

- define acesso a modulos, acoes e dados;
- pode variar por hospital.

### Paciente

Entidade longitudinal acompanhada pela instituicao.

Relacionamentos:

- pertence ao contexto de um hospital;
- possui um ou mais episodios assistenciais;
- pode possuir dados cadastrais ficticios no desenvolvimento;
- possui historico longitudinal como visao derivada de episodios e eventos autorizados.

### Historico longitudinal

Visao derivada que organiza eventos assistenciais relacionados ao mesmo paciente. Nao duplica o cadastro do paciente e nao representa tabela fisica definida nesta sprint.

Relacionamentos:

- deriva de paciente, episodios, eventos, evolucoes, exames, recursos, documentos e desfechos autorizados;
- pode reunir episodios anteriores, formas de chegada, avaliacoes, sinais vitais, problemas, hipoteses diagnosticas, diagnosticos confirmados, protocolos acionados, exames, resultados, resultados criticos, evolucoes, internacoes, setores, leitos, transferencias, altas, retornos, eventos adversos, recursos utilizados, documentos e desfechos;
- respeita hospital, unidade, perfil, setor, vinculo assistencial e contexto de acesso;
- nao mistura dados de diferentes hospitais sem regra institucional, autorizacao e integracao apropriadas.

### Episodio assistencial

Passagem ou ciclo de cuidado de um paciente.

Relacionamentos:

- pertence a um paciente;
- pertence a um hospital;
- possui forma de chegada;
- possui Eventos do Episodio;
- possui linha do tempo derivada dos eventos do episodio;
- pode ter hipoteses diagnosticas;
- pode ter evolucoes assistenciais;
- pode ter execucoes de protocolos;
- pode ter exames;
- pode ter recursos previstos, sugeridos, solicitados e utilizados;
- pode ter decisoes profissionais;
- pode ter desfecho.

### Linha do tempo do episodio

Representacao cronologica dos acontecimentos de um episodio especifico. Nao e evolucao clinica e nao representa tabela fisica definida nesta sprint.

Relacionamentos:

- deriva de eventos do episodio;
- pode apresentar abertura, chegada, comunicacao, avaliacao inicial, classificacao, protocolos acionados, exames solicitados, coletas, resultados, evolucoes, intercorrencias, recursos solicitados, recursos utilizados, mudancas de setor, mudancas de leito, internacao, transferencia, alta, encerramento e desfecho;
- cada evento deve identificar tipo, autor ou sistema de origem, data, hora e contexto;
- eventos relevantes devem possuir rastreabilidade.

### Evento do Episodio

Evento do Episodio representa um acontecimento registrado na jornada de um episodio assistencial.

Relacionamentos:

- pertence a um episodio assistencial;
- compoe a linha do tempo do episodio;
- pode ter origem profissional, operacional ou sistemica;
- deve identificar tipo, autor ou sistema de origem, data, hora e contexto;
- pode referenciar evolucao, exame, protocolo, recurso, setor, leito, comunicacao, complemento ou retificacao;
- pode possuir tipos conceituais como chegada, comunicacao, avaliacao, evolucao, exame, movimentacao, transferencia, alta, alerta e utilizacao de recurso;
- seus tipos poderao diferenciar origem, categoria e contexto.

Nota terminologica:

- `Evento do Episodio` e o termo canonico do modelo de dominio.
- `Evento da jornada` pode ser usado apenas como expressao de interface ou apresentacao.
- `Evento da jornada` nao deve originar entidade independente no banco sem necessidade tecnica validada.
- A implementacao futura devera evitar duplicidade entre eventos assistenciais, clinicos e operacionais.

### Forma de chegada

Conceito configuravel que identifica como o episodio assistencial comecou.

Relacionamentos:

- pertence a um episodio assistencial;
- pertence ao contexto de configuracao de um hospital;
- pode acionar protocolos diferentes;
- pode definir campos, documentos, responsaveis, prioridades, notificacoes e fluxos;
- nao deve ser limitada a uma lista rigida no codigo;
- pode possuir tipos configurados por cada hospital, como chegada espontanea, encaminhamento, transferencia, retorno ou internacao eletiva.

### Canal de comunicacao

Meio institucional configuravel usado em comunicacao relevante.

Relacionamentos:

- pertence ao contexto de configuracao de um hospital;
- pode estar relacionado a chegada, transferencia, resultado critico, encaminhamento ou outro evento;
- pode estar vinculado a Evento do Episodio;
- deve registrar remetente, destinatario, data, hora, situacao e confirmacao quando aplicavel;
- nao deve ser limitado a um unico meio;
- comunicacoes relevantes devem integrar a trilha de auditoria.

### Hipotese diagnostica

Possibilidade clinica vinculada a um episodio assistencial. Nao equivale a diagnostico confirmado.

Relacionamentos:

- pertence a um episodio assistencial;
- pode estar relacionada a sindrome, sinais, sintomas, problemas e exames;
- pode possuir estados como proposta, em investigacao, descartada ou confirmada;
- sua confirmacao exige acao explicita de profissional autorizado;
- pode receber sugestoes de possibilidades pela plataforma, sem confirmacao autonoma;
- alteracoes de estado precisam ser rastreaveis.

### Expressao de interface: evento da jornada

Expressao de interface ou apresentacao para eventos relevantes dentro do episodio. Nao deve originar entidade independente no banco sem necessidade tecnica validada.

Relacionamentos:

- corresponde conceitualmente a `Evento do Episodio`;
- pode ser exibida na linha do tempo do episodio;
- deve preservar a mesma rastreabilidade do Evento do Episodio.

### Setor

Area institucional do hospital, como unidade, ala, sala, servico ou local operacional.

Relacionamentos:

- pertence a um hospital;
- pode conter leitos ou recursos;
- pode receber eventos e episodios.

### Leito

Unidade operacional de acomodacao ou atendimento, quando aplicavel.

Relacionamentos:

- pertence a um setor;
- pode ser associado a episodio em determinado periodo;
- pode gerar eventos de movimentacao.

## Protocolos e formularios

### Protocolo

Definicao institucional de fluxo assistencial ou operacional.

Relacionamentos:

- pertence a um hospital;
- possui versoes;
- pode estar associado a formularios, regras, criterios e etapas.

### Versao de protocolo

Versao imutavel ou historicamente rastreavel de um protocolo em determinado momento.

Relacionamentos:

- pertence a um protocolo;
- possui etapas, criterios, regras e formularios de sua versao;
- pode ser usada por execucoes de protocolo.

### Execucao de protocolo

Aplicacao de uma versao de protocolo a um episodio.

Relacionamentos:

- pertence a um episodio;
- referencia uma versao de protocolo;
- registra etapas executadas;
- registra sugestoes apresentadas;
- registra decisoes profissionais relacionadas;
- pode armazenar evidencias, justificativas e desfecho da execucao.

### Etapa de protocolo

Parte da definicao ou execucao de protocolo.

Relacionamentos:

- pertence a uma versao de protocolo;
- pode conter criterios, regras, formularios e orientacoes institucionais;
- pode gerar eventos na execucao.

### Formulario

Definicao de campos para coleta estruturada.

Relacionamentos:

- pertence a um hospital;
- pode ser associado a modulo, etapa, protocolo, episodio ou evento;
- pode possuir versoes futuras;
- gera respostas vinculadas ao contexto de uso.

### Campo de formulario

Unidade de coleta de um formulario.

Relacionamentos:

- pertence a um formulario;
- possui tipo, validacao e regra de exibicao;
- pode compor respostas.

### Regra

Condicao configuravel para controlar exibicao, fluxo, sugestao ou alerta.

Relacionamentos:

- pode pertencer a protocolo, etapa, formulario ou alerta;
- pode avaliar dados do episodio ou contexto institucional;
- nao deve executar diagnostico, prescricao ou conduta autonoma.

## Exames, recursos e decisoes

### Categoria profissional

Categoria autorizada para produzir registros assistenciais conforme configuracao institucional.

Relacionamentos:

- pertence ao contexto de configuracao de um hospital;
- pode estar associada a usuarios, perfis, tipos de evolucao e permissoes;
- nao deve ser lista rigida imutavel no codigo.

### Autor profissional

Profissional identificado responsavel por um registro assistencial.

Relacionamentos:

- referencia usuario autorizado;
- pode possuir categoria profissional;
- pode estar associado a setor, unidade, episodio ou vinculo assistencial;
- deve preservar autoria em evolucoes, complementos e retificacoes.

### Tipo de evolucao

Classificacao configuravel de uma evolucao assistencial.

Relacionamentos:

- pertence ao contexto de um hospital;
- pode estar associado a categoria profissional;
- pode definir estrutura de campos, texto livre, anexos permitidos e regras de estado;
- exemplos medicos podem incluir avaliacao inicial, evolucao diaria, plantao, intercorrencia, reavaliacao, parecer, pre-operatorio, pos-operatorio, transferencia, resumo de alta, complemento e retificacao, sem lista fixa definitiva.

### Evolucao assistencial

Registro assistencial produzido por profissional identificado e autorizado.

Relacionamentos:

- pertence a um paciente;
- pertence a um episodio assistencial;
- possui autor profissional;
- possui categoria profissional;
- possui tipo de evolucao;
- possui data, hora, estado e contexto;
- pode estar relacionada a setor e leito;
- pode conter campos estruturados e texto livre;
- pode relacionar problemas, hipoteses, diagnosticos, protocolos, exames, resultados, recursos e pendencias;
- integra a linha do tempo do episodio;
- integra o historico longitudinal conforme permissoes;
- nao pode ser atribuida ao sistema como se tivesse sido escrita por profissional.

### Evolucao medica

Categoria de evolucao assistencial produzida por profissional medico autorizado.

Relacionamentos:

- especializa evolucao assistencial em nivel conceitual;
- pode utilizar tipos configuraveis de evolucao medica;
- pode relacionar problemas, hipoteses, diagnosticos, protocolos, exames, pendencias e plano registrado pelo profissional;
- nao confirma diagnostico automaticamente;
- nao cria prescricao automatica;
- nao e escrita pelo sistema em nome do medico.

### Evolucao multiprofissional

Categoria de evolucao assistencial de profissional nao medico ou de outras categorias autorizadas pelo hospital.

Relacionamentos:

- especializa evolucao assistencial em nivel conceitual;
- pode incluir enfermagem, fisioterapia, nutricao, psicologia, servico social, farmacia clinica e outras categorias autorizadas;
- categorias e tipos devem ser configuraveis por hospital.

### Complemento de evolucao

Registro posterior que acrescenta informacao sem apagar o conteudo original.

Relacionamentos:

- pertence a uma evolucao assistencial original;
- possui autor profissional, data, hora e justificativa quando aplicavel;
- integra a linha do tempo e auditoria;
- pode integrar o historico longitudinal conforme permissoes.

### Retificacao de evolucao

Registro de correcao associado a uma evolucao original.

Relacionamentos:

- pertence a uma evolucao assistencial original;
- identifica o conteudo corrigido conforme regra institucional;
- preserva vinculo com o registro original;
- possui autor profissional, data, hora e justificativa rastreaveis;
- nao apaga silenciosamente a evolucao original.

### Anexo de evolucao

Documento, imagem autorizada ou arquivo relacionado a uma evolucao assistencial.

Relacionamentos:

- pertence a uma evolucao assistencial, complemento ou retificacao;
- pode estar relacionado a sinais vitais, problemas, hipoteses, diagnosticos, protocolos, exames, resultados, recursos, internacao, setor, leito ou eventos;
- deve ser privado e sujeito a controle de acesso;
- acessos e alteracoes devem ser auditaveis quando aplicavel.

### Vinculo assistencial

Relacao autorizada entre profissional, paciente, episodio, setor, leito ou responsabilidade atribuida.

Relacionamentos:

- pode limitar visualizacao, criacao, finalizacao, complementacao ou retificacao;
- pode ser usado em conjunto com perfil, categoria profissional e contexto de acesso;
- ajuda a impedir acesso clinico irrestrito por nome de funcao.

### Contexto de acesso

Combinacao de fatores que define autorizacao.

Relacionamentos:

- considera organizacao, hospital, unidade, setor, perfil, categoria profissional, permissoes especificas, vinculo com episodio, responsabilidade atribuida, finalidade do acesso e situacao do usuario;
- afeta historico longitudinal, episodio, linha do tempo, evolucoes, exames, documentos, indicadores e exportacoes;
- deve ser aplicado no cliente, servidor e banco quando essas camadas existirem.

### Exame

Processo com fluxo proprio de previsao, solicitacao, realizacao, resultado e registro.

Relacionamentos:

- pertence a um episodio;
- pode ser previsto por protocolo;
- pode ser solicitado por usuario autorizado;
- pode gerar resultado;
- pode servir como evidencia.

### Resultado de exame

Registro de resultado associado a exame.

Relacionamentos:

- pertence a um exame;
- pode ser usado como evidencia;
- nao confirma diagnostico automaticamente.

### Recurso

Medicamento, insumo, equipamento, equipe, leito ou capacidade operacional.

Relacionamentos:

- pertence a um hospital;
- pode ser previsto, sugerido, solicitado ou utilizado em episodio;
- pode estar associado a protocolo ou evento.

### Registro de recurso no episodio

Representa a relacao entre recurso e episodio.

Relacionamentos:

- pertence a um episodio;
- referencia recurso;
- indica estado conceitual: previsto, sugerido, solicitado ou utilizado;
- pode ter autoria e horario.

### Recurso sugerido

Apresentacao contextual de um recurso feita pelo sistema.

Relacionamentos:

- pertence a um episodio;
- pode derivar de protocolo, regra, alerta ou contexto operacional;
- referencia um recurso;
- nao equivale a solicitacao, prescricao ou utilizacao;
- pode ser aceito, rejeitado ou justificado por profissional autorizado;
- aceite, rejeicao e justificativa devem poder ser auditados;
- nao executa automaticamente a utilizacao do recurso.

### Decisao profissional

Registro de decisao, conduta ou avaliacao feita por profissional autorizado.

Relacionamentos:

- pertence a um episodio;
- pode estar associada a sugestao, evidencia, exame, protocolo ou evento;
- possui autoria, contexto e horario;
- pode ter justificativa.

### Sugestao

Orientacao gerada por regra institucional.

Relacionamentos:

- pode pertencer a execucao de protocolo, alerta ou formulario;
- pode ser aceita, recusada, ignorada ou substituida por decisao profissional;
- nao representa conduta autonoma.

## Indicadores, alertas e auditoria

### Indicador

Medida calculada a partir de dados do sistema.

Relacionamentos:

- pertence a hospital ou escopo institucional;
- pode usar eventos, episodios, tempos, recursos e desfechos;
- deve respeitar isolamento institucional.

### Alerta

Sinalizacao gerada por regra configurada.

Relacionamentos:

- pertence a hospital;
- pode ser vinculado a episodio, indicador, exame, recurso ou evento;
- possui status e destinatarios;
- nao executa decisao clinica autonomamente.

### Registro de auditoria

Registro de operacao sensivel.

Relacionamentos:

- pertence a hospital;
- referencia usuario, acao, entidade afetada, horario e contexto;
- deve preservar rastreabilidade.

## Relacionamentos essenciais

- Um hospital possui muitos pacientes.
- Um paciente possui muitos episodios.
- O historico longitudinal e uma visao derivada de eventos e registros autorizados do paciente.
- Um episodio pertence a um paciente e a um hospital.
- Um episodio possui muitos Eventos do Episodio.
- A linha do tempo do episodio deriva dos eventos do episodio.
- Uma evolucao assistencial pertence a um paciente e a um episodio.
- Uma evolucao assistencial possui autor profissional, categoria profissional e tipo.
- Uma evolucao medica e uma categoria de evolucao assistencial.
- Uma evolucao multiprofissional e uma categoria de evolucao assistencial.
- Complemento e retificacao pertencem a evolucao original e nao apagam silenciosamente o registro anterior.
- Anexos de evolucao devem ser privados e sujeitos a controle de acesso.
- Vinculo assistencial e contexto de acesso ajudam a determinar permissao.
- Um protocolo possui muitas versoes.
- Uma execucao de protocolo usa uma versao de protocolo.
- Uma execucao de protocolo pertence a um episodio.
- Um exame pertence a um episodio e possui fluxo proprio.
- Uma hipotese diagnostica pertence a um episodio e nao equivale a diagnostico confirmado.
- Um recurso pode ser previsto, sugerido, solicitado ou utilizado em um episodio.
- Um recurso sugerido nao equivale a solicitacao, prescricao ou utilizacao.
- Uma forma de chegada pertence ao episodio e pode acionar fluxos configuraveis.
- Um canal de comunicacao pode estar associado a eventos relevantes e deve respeitar auditoria.
- Uma sugestao nao equivale a uma decisao profissional.
- Uma hipotese nao equivale a um diagnostico confirmado.
- Dados, usuarios, protocolos e indicadores devem respeitar isolamento por hospital.
