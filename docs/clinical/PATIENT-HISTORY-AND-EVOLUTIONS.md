# PATIENT-HISTORY-AND-EVOLUTIONS.md

## Finalidade

Este documento define, em nivel conceitual, como a Plataforma de Inteligencia Hospitalar devera tratar historico longitudinal do paciente, historico do episodio, linha do tempo e evolucoes assistenciais.

Nao ha implementacao tecnica, banco de dados, telas, APIs ou regras clinicas nesta Sprint 00.

Historico longitudinal, historico por episodio, linha do tempo, Evento do Episodio, evolucao medica, evolucao de enfermagem, evolucao multiprofissional, rascunho, finalizacao, complemento, retificacao, autoria, anexos, filtros, busca, acesso por perfil e relacionamentos com problemas, hipoteses, diagnosticos, protocolos, exames, recursos, internacao, alta e desfecho pertencem a Visao Funcional Completa.

## Conceitos

### Cadastro do paciente

Registro de identidade e dados cadastrais do paciente dentro do contexto institucional. Nao deve ser confundido com historico longitudinal.

### Historico longitudinal

Visao organizada dos eventos assistenciais relacionados a mesma pessoa, reunindo registros autorizados de multiplos episodios.

### Episodio assistencial

Passagem, atendimento, internacao ou ciclo de cuidado vinculado a um paciente.

### Linha do tempo do episodio

Representacao cronologica dos acontecimentos de um episodio especifico.

### Evolucao assistencial

Registro produzido por profissional identificado e autorizado, vinculado a paciente e episodio.

## Historico longitudinal

O paciente possui identidade unica dentro do contexto institucional e pode possuir multiplos episodios assistenciais.

O historico longitudinal reune dados relevantes de todos os episodios autorizados, sem duplicar o cadastro do paciente. Sua visualizacao deve respeitar hospital, unidade, perfil, setor, vinculo assistencial e contexto de acesso.

O historico podera ser cronologico e resumido. Eventos devem manter origem, autor, data e hora.

Dados de diferentes hospitais nao devem ser misturados sem regra institucional, autorizacao e integracao apropriadas.

Conforme permissoes, o historico pode reunir:

- episodios anteriores;
- formas de chegada;
- avaliacoes;
- sinais vitais;
- problemas;
- hipoteses diagnosticas;
- diagnosticos confirmados;
- protocolos acionados;
- exames;
- resultados;
- resultados criticos;
- evolucoes;
- internacoes;
- setores e leitos;
- transferencias;
- altas;
- retornos;
- eventos adversos;
- recursos utilizados;
- documentos;
- desfechos.

## Historico do episodio

O historico do episodio organiza os registros pertencentes a uma passagem assistencial especifica.

Ele pode conter eventos operacionais, assistenciais, comunicacoes, exames, recursos, evolucoes, mudancas de setor, leito, transferencia, alta, encerramento e desfecho.

## Linha do tempo

A linha do tempo representa cronologicamente os acontecimentos de um episodio.

Ela pode apresentar:

- abertura do episodio;
- chegada;
- comunicacao;
- avaliacao inicial;
- classificacao;
- protocolos acionados;
- exames solicitados;
- coletas;
- resultados;
- evolucoes;
- intercorrencias;
- recursos solicitados;
- recursos utilizados;
- mudancas de setor;
- mudancas de leito;
- internacao;
- transferencia;
- alta;
- encerramento;
- desfecho.

A linha do tempo nao e uma evolucao clinica. Ela reune eventos de diversas origens.

Cada evento deve identificar tipo, autor ou sistema de origem, data, hora e contexto. Eventos relevantes devem possuir rastreabilidade.

O sistema podera criar eventos automaticos operacionais, mas nao podera criar autonomamente conteudo clinico atribuido a um profissional.

## Evolucao assistencial

Uma evolucao assistencial:

- pertence a um paciente e a um episodio assistencial;
- e produzida por profissional identificado e autorizado;
- possui categoria profissional;
- possui tipo;
- possui data e hora;
- pode estar relacionada a setor e leito;
- pode conter campos estruturados e texto livre;
- pode relacionar problemas, hipoteses, diagnosticos, protocolos, exames, recursos e pendencias;
- integra a linha do tempo do episodio;
- integra o historico longitudinal conforme permissoes;
- nao pode ser atribuida ao sistema como se tivesse sido escrita por profissional;
- deve preservar autoria e rastreabilidade.

## Evolucao medica

Evolucao medica e uma categoria de evolucao assistencial.

Tipos configuraveis podem incluir, como exemplos:

- avaliacao medica inicial;
- evolucao medica diaria;
- evolucao de plantao;
- registro de intercorrencia;
- reavaliacao;
- parecer especializado;
- evolucao pre-operatoria;
- evolucao pos-operatoria;
- registro de transferencia;
- resumo de alta;
- complemento;
- retificacao.

Esses exemplos nao sao conteudo clinico obrigatorio nem lista fixa definitiva.

Conforme configuracao institucional, uma evolucao medica podera permitir:

- motivo ou contexto;
- estado clinico atual;
- queixas;
- exame fisico;
- sinais vitais relacionados;
- problemas ativos;
- hipoteses diagnosticas;
- diagnosticos confirmados;
- exames relevantes;
- resposta as acoes anteriores;
- avaliacao profissional;
- plano registrado pelo profissional;
- protocolos relacionados;
- pendencias;
- previsao de reavaliacao;
- texto livre.

O sistema nao escrevera a evolucao em nome do medico, nao confirmara diagnostico e nao criara prescricao automatica.

O sistema podera apresentar campos, informacoes ou protocolos relacionados. A conclusao e finalizacao pertencem ao profissional autorizado.

Eventual assistencia futura para resumo ou organizacao devera ser claramente identificada e sempre validada pelo profissional.

## Evolucoes multiprofissionais

Evolucoes multiprofissionais sao evolucoes assistenciais produzidas por categorias autorizadas pelo hospital.

Categorias previstas conceitualmente:

- evolucao de enfermagem;
- evolucao de fisioterapia;
- evolucao de nutricao;
- evolucao de psicologia;
- evolucao de servico social;
- evolucao de farmacia clinica;
- evolucao de outras categorias autorizadas pelo hospital.

Essas categorias devem ser configuraveis e nao listas rigidas imutaveis no codigo.

## Estados

Estados conceituais minimos:

- rascunho;
- finalizada;
- complementada;
- retificada.

Rascunho pode ser editado pelo autor dentro das regras institucionais.

Evolucao finalizada preserva o conteudo registrado.

Autor, data, hora e justificativa devem ser rastreaveis.

Regras definitivas de assinatura, validade, retencao e correcao deverao passar por validacao institucional e juridica antes da producao.

## Complementacao

Complementacao acrescenta informacao posterior sem apagar o original.

Ela deve manter vinculo com a evolucao original, autoria, data, hora e justificativa quando aplicavel.

## Retificacao

Retificacao identifica correcao e mantem vinculo com o registro original.

Ela nao deve sobrescrever silenciosamente a evolucao finalizada.

Autor, data, hora e justificativa devem ser rastreaveis.

## Autoria

Toda evolucao, complemento e retificacao deve preservar autor profissional, categoria profissional, data, hora e contexto.

O sistema nao pode assinar ou escrever conteudo clinico como se fosse profissional.

## Relacionamentos

Uma evolucao podera se relacionar, conforme permissao, a:

- sinais vitais;
- problemas;
- hipoteses;
- diagnosticos;
- protocolos;
- exames;
- resultados;
- documentos;
- imagens autorizadas;
- recursos;
- internacao;
- setor;
- leito;
- eventos da linha do tempo;
- evolucao anterior;
- complemento;
- retificacao.

## Anexos

Anexos deverao ser privados e sujeitos a controle de acesso.

Podem incluir documentos, imagens autorizadas ou outros arquivos permitidos institucionalmente.

Acesso, download, alteracao e exclusao deverao ser auditaveis quando aplicavel.

## Filtros e busca

O historico longitudinal e a linha do tempo poderao possuir filtros por episodio, data, setor, tipo de evento, categoria profissional, tipo de evolucao, protocolo, exame, problema, hipotese, diagnostico, recurso, documento e desfecho.

A busca deve respeitar o contexto de acesso.

## Visualizacao por perfil

O modulo Inicio e a area do paciente devem variar conforme perfil e contexto de acesso.

A autorizacao deve considerar organizacao, hospital, unidade, setor, perfil, categoria profissional, permissoes especificas, vinculo com episodio, responsabilidade atribuida, finalidade do acesso e situacao do usuario.

Um perfil nao recebe acesso clinico irrestrito apenas por possuir determinado nome de funcao.

## Rastreabilidade

Eventos, evolucoes, complementos, retificacoes, anexos e consultas sensiveis devem preservar rastreabilidade quando aplicavel.

Informacoes corrigidas nao devem apagar silenciosamente registros anteriores.

## Limites da Primeira Versao Operacional

- Nao substituir prontuario eletronico completo.
- Nao implementar prescricao medica completa.
- Nao implementar administracao medicamentosa completa.
- Nao criar diagnostico automatico.
- Nao criar prescricao automatica.
- Nao executar conduta clinica autonoma.
- Nao escrever evolucao em nome de profissional.
- Nao usar dados reais em desenvolvimento.

Funcionalidades nao incluidas no primeiro recorte continuam pertencendo a Visao Funcional Completa quando documentadas.

## Questoes que ainda exigem validacao institucional

- Regras definitivas de assinatura.
- Validade juridica dos registros.
- Politica de retencao e descarte.
- Fluxo de complementacao e retificacao.
- Perfis e permissoes por hospital.
- Categorias profissionais autorizadas.
- Tipos de evolucao por categoria.
- Regras para acesso excepcional.
- Escopo de auditoria de consultas sensiveis.
- Politica de anexos e imagens autorizadas.

## Criterios de aceite para implementacao futura

- Historico longitudinal diferencia cadastro, episodio, linha do tempo e evolucao.
- Linha do tempo exibe eventos cronologicos de um episodio sem se confundir com evolucao clinica.
- Evolucoes exigem autoria profissional identificada.
- Evolucao finalizada nao e sobrescrita silenciosamente.
- Complementacao e retificacao preservam vinculo com o original.
- Anexos sao privados por padrao.
- Perfil administrativo nao recebe acesso clinico automatico.
- Autorizacao e aplicada na interface, servidor e banco quando implementados.
- Testes cobrem isolamento institucional, autoria, acesso ao historico, complemento e retificacao.
