# PROTOCOL-CONCEPT.md

## Conceito do motor de protocolos

O motor de protocolos sera o conjunto de conceitos, regras e mecanismos que permite ao hospital definir, versionar e executar protocolos institucionais dentro de episodios assistenciais.

Ele deve organizar a assistencia sem substituir a decisao profissional.

O motor de protocolos pertence a Visao Funcional Completa. A Primeira Versao Operacional podera implementar apenas parte de suas capacidades, mas a arquitetura nao deve impedir versionamento, revisao, aprovacao, publicacao, arquivamento, construtor visual, formularios dinamicos, motor de regras, sugestoes, aceite, rejeicao, justificativa e evidencias de execucao.

## Separacoes obrigatorias

### Definicao do protocolo

Representa o desenho institucional do protocolo. Pode incluir objetivo, contexto, etapas, criterios, formularios, regras, orientacoes e possiveis sugestoes.

Nao e uma execucao em paciente.

### Versao

Representa uma fotografia rastreavel do protocolo em determinado momento.

Execucoes devem referenciar a versao usada, para preservar historico mesmo quando o protocolo for alterado depois.

### Etapa

Parte estrutural do protocolo. Pode organizar coleta de dados, exibicao de orientacoes, avaliacao de criterios, sugestoes, alertas ou encaminhamento para outra etapa.

### Criterio

Condicao que ajuda a orientar o fluxo. Pode considerar dados informados, contexto do episodio, perfil do usuario ou configuracao institucional.

Nao deve confirmar diagnostico automaticamente.

### Regra

Logica configuravel que avalia criterios e produz efeitos limitados, como:

- mostrar ou ocultar campos;
- sugerir proxima etapa;
- sugerir recurso contextual;
- gerar alerta;
- destacar pendencia;
- solicitar justificativa;
- recomendar revisao profissional.

Regra nao deve executar prescricao, diagnostico, solicitacao, utilizacao de recurso ou conduta clinica autonoma.

### Formulario

Estrutura de campos vinculada ao protocolo, etapa ou contexto assistencial.

Formulario coleta dados; nao transforma automaticamente respostas em diagnostico confirmado.

### Execucao no episodio

Aplicacao de uma versao de protocolo a um episodio assistencial especifico.

A execucao registra:

- versao usada;
- etapas iniciadas e concluidas;
- dados coletados;
- sugestoes apresentadas;
- decisoes profissionais;
- evidencias;
- justificativas;
- desfecho da execucao.

Execucoes de protocolo podem aparecer na linha do tempo do episodio e no historico longitudinal conforme permissoes.

### Sugestao

Resultado orientativo apresentado pelo sistema conforme protocolo e regras institucionais.

Sugestao deve ser visualmente e funcionalmente separada de decisao profissional.

Uma sugestao de recurso nao equivale a recurso solicitado, prescrito ou utilizado. Aceite, rejeicao e justificativa devem poder ser auditados.

### Decisao profissional

Registro de escolha, avaliacao ou conduta feita por profissional autorizado.

A decisao pode concordar com uma sugestao, divergir dela ou seguir caminho alternativo conforme julgamento profissional e regra institucional.

Solicitacoes de recursos dependem de decisao profissional. A utilizacao efetiva do recurso deve ser registrada como evento proprio no episodio.

### Evidencia

Informacao que sustenta uma avaliacao, sugestao ou decisao. Pode vir de formulario, evento, exame, observacao registrada ou outro dado permitido.

Evidencia nao executa conduta por si so.

### Justificativa

Explicacao registrada para decisao, excecao, divergencia, cancelamento ou alteracao de fluxo.

Pode ser obrigatoria conforme regra institucional.

### Desfecho

Resultado final ou estado de encerramento de uma execucao de protocolo.

Desfecho de protocolo nao deve ser confundido automaticamente com desfecho clinico do paciente ou diagnostico confirmado.

## Fluxo conceitual de execucao

```text
Protocolo definido
-> Versao publicada
-> Episodio elegivel
-> Execucao iniciada
-> Etapas e formularios aplicados
-> Regras avaliam contexto
-> Sugestoes ou alertas podem ser apresentados
-> Profissional registra decisao
-> Evidencias e justificativas sao preservadas
-> Execucao recebe desfecho
```

## Recursos no protocolo

O motor de protocolos deve diferenciar quatro conceitos:

- recurso previsto pelo protocolo: recurso relacionado a definicao ou versao do protocolo;
- recurso sugerido pelo sistema: apresentacao contextual conforme regra, etapa ou contexto do episodio;
- recurso solicitado pelo profissional: pedido registrado apos decisao profissional;
- recurso efetivamente utilizado: consumo ou uso registrado no episodio.

Uma sugestao nao equivale a solicitacao, prescricao ou utilizacao. O sistema nao executa automaticamente a utilizacao do recurso.

## Hipotese diagnostica no protocolo

Protocolos podem se relacionar a sindromes, sinais, sintomas, problemas, exames ou hipoteses diagnosticas.

Hipotese diagnostica nao e diagnostico confirmado. A plataforma pode sugerir possibilidades, mas a confirmacao exige acao explicita de profissional autorizado e alteracoes de estado precisam ser rastreaveis.

## Evolucoes e protocolos

Evolucoes assistenciais podem referenciar protocolos acionados, etapas realizadas, evidencias, pendencias, sugestoes apresentadas, decisoes profissionais e justificativas.

O protocolo pode apresentar campos, informacoes ou orientacoes relacionadas, mas nao escreve evolucao em nome de profissional, nao confirma diagnostico, nao cria prescricao automatica e nao executa conduta clinica autonoma.

Complementacoes e retificacoes de evolucoes relacionadas a protocolos devem manter autoria, data, hora, justificativa e vinculo com o registro original.

## Chegada e comunicacao

Formas de chegada podem acionar protocolos diferentes e devem ser configuraveis por hospital, sem lista rigida no codigo.

Canais de comunicacao podem estar vinculados a chegada, transferencia, resultado critico, encaminhamento ou outros eventos relevantes, integrando trilha de auditoria quando aplicavel.

## Limites do motor de protocolos

- Nao diagnostica automaticamente.
- Nao prescreve automaticamente.
- Nao executa condutas clinicas autonomamente.
- Nao solicita ou utiliza recursos automaticamente.
- Nao substitui profissional habilitado.
- Nao apaga historico de versoes anteriores.
- Nao mistura sugestao com decisao profissional.

## Corolario

O motor de protocolos deve funcionar como estrutura institucional de organizacao, rastreabilidade e apoio ao trabalho. Seu valor esta em reduzir desordem operacional e aumentar consistencia, sem atravessar o limite da decisao profissional.
