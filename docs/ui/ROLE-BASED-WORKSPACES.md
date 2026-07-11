# ROLE-BASED-WORKSPACES.md

## Finalidade

Este documento descreve areas de trabalho por perfil, incluindo conteudo do modulo Inicio, atalhos, listas de trabalho, pendencias, alertas, informacoes resumidas, acesso a ficha do paciente e acoes permitidas.

O modulo Inicio deve ser personalizado, mas nao deve duplicar regras de autorizacao.

A interface pode ocultar uma funcao, mas a seguranca tambem deve ser aplicada no servidor e no banco quando essas camadas existirem.

Areas de trabalho por perfil fazem parte da Visao Funcional Completa. Elas devem permitir informacoes, acoes, listas, pendencias e alertas diferentes conforme perfil e contexto de acesso.

## Comportamento sem permissao

- Ocultar acoes que o usuario nao pode executar, quando isso melhorar clareza.
- Exibir bloqueio ou mensagem institucional quando o usuario tentar acessar recurso sem permissao.
- Registrar consultas sensiveis quando aplicavel.
- Nunca usar apenas a interface como barreira de seguranca.

## Area medica

O login medico podera apresentar, conforme permissao:

- pacientes sob sua responsabilidade;
- pacientes do setor autorizado;
- resumo do episodio;
- historico longitudinal permitido;
- linha do tempo;
- problemas ativos;
- hipoteses;
- diagnosticos;
- protocolos;
- exames solicitados;
- resultados disponiveis;
- resultados criticos comunicados;
- evolucoes anteriores;
- pendencias assistenciais;
- botao para nova evolucao medica;
- rascunhos proprios;
- evolucoes finalizadas;
- complementacoes;
- retificacoes;
- documentos permitidos;
- registros de alta ou transferencia, quando autorizado.

Acoes possiveis conforme permissao: criar, editar enquanto rascunho, finalizar, complementar ou retificar evolucoes medicas.

O medico nao deve alterar evolucoes finalizadas de outro profissional.

## Area da enfermagem

O login de enfermagem podera apresentar, conforme permissao:

- pacientes do setor;
- identificacao e alertas relevantes;
- sinais vitais;
- dispositivos;
- cuidados registrados;
- protocolos aplicaveis;
- exames pendentes relevantes;
- recursos utilizados;
- eventos do episodio;
- evolucoes de enfermagem;
- intercorrencias;
- pendencias da equipe.

A enfermagem podera criar e administrar seus registros autorizados, sem editar evolucoes medicas.

Esta documentacao nao implementa prescricao ou administracao medicamentosa completa.

## Area de laboratorio e diagnostico

O login de laboratorio ou diagnostico podera apresentar:

- solicitacoes autorizadas;
- fila de exames;
- prioridade;
- coleta;
- material;
- processamento;
- exames externos;
- resultados;
- laudos;
- resultados criticos;
- comunicacao;
- confirmacao de ciencia;
- indisponibilidades.

Esse perfil nao deve receber acesso indiscriminado a todas as evolucoes clinicas.

## Area de farmacia e almoxarifado

O login de farmacia ou almoxarifado podera apresentar:

- catalogo autorizado;
- estoques;
- lotes;
- validade;
- solicitacoes de recursos;
- recursos utilizados;
- consumo;
- protocolos relacionados;
- itens criticos;
- risco de ruptura;
- substitutos autorizados;
- necessidades de reposicao.

O acesso a informacoes do paciente devera ser limitado ao necessario para a funcao e as regras institucionais.

## Area de direcao e gestao

O login de direcao ou gestao podera apresentar:

- indicadores executivos;
- ocupacao;
- atendimentos;
- internacoes;
- transferencias;
- tempos;
- desfechos;
- alertas;
- protocolos;
- exames;
- consumo;
- riscos;
- planos de acao.

Por padrao, o perfil gerencial deve priorizar dados agregados.

O acesso nominal a registros clinicos depende de permissao e finalidade institucional explicitas.

## Area de qualidade e responsavel tecnico

Esses perfis poderao visualizar, conforme autorizacao:

- protocolos;
- versoes;
- aderencia;
- desvios;
- justificativas;
- eventos adversos;
- alertas;
- planos de acao;
- evolucoes necessarias para analise autorizada;
- indicadores de qualidade;
- revisoes pendentes.

O responsavel tecnico podera administrar o ciclo de governanca dos protocolos dentro de suas permissoes.

## Area administrativa

Administrador configura instituicoes, unidades, usuarios, perfis e permissoes.

Administrador nao recebe automaticamente acesso ao conteudo clinico.

Acessos excepcionais devem ser controlados e auditados.

## Area de auditoria

Auditor possui acesso somente leitura ao escopo autorizado.

Auditor nao cria, edita, finaliza ou retifica evolucoes.

Auditor nao altera dados clinicos ou operacionais.

Consultas devem ser rastreaveis quando aplicavel.

## Atalhos, listas e pendencias

O modulo Inicio pode apresentar atalhos e listas de trabalho conforme permissao:

- pacientes sob responsabilidade;
- pacientes do setor;
- exames pendentes;
- resultados criticos;
- evolucoes pendentes;
- rascunhos proprios;
- protocolos em andamento;
- recursos solicitados;
- itens criticos;
- alertas;
- indicadores agregados;
- revisoes pendentes.

## Informacoes resumidas

Informacoes resumidas devem respeitar o mesmo contexto de acesso da ficha completa.

Resumo nao deve expor dado clinico a perfil sem permissao.

## Acesso a ficha do paciente

O acesso a ficha do paciente deve considerar hospital, unidade, setor, perfil, categoria profissional, vinculo assistencial, responsabilidade atribuida, finalidade do acesso e situacao do usuario.

## Acoes ocultas ou bloqueadas

Acoes sem permissao podem ficar ocultas ou bloqueadas.

Bloqueio visual nao substitui controle no servidor e no banco.
