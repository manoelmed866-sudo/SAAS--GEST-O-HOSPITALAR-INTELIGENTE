# ROLE-ACCESS-MATRIX.md

## Finalidade

Esta matriz descreve, em nivel conceitual, como perfis, modulos, acoes, escopos, restricoes e auditoria devem ser considerados na Plataforma de Inteligencia Hospitalar.

A matriz inicial devera ser refinada com cada hospital antes da implementacao.

A matriz pertence a Visao Funcional Completa e devera evoluir conforme modulos, perfis, hospitais, unidades, setores, vinculos assistenciais e integracoes forem implementados.

## Principios

- Menor privilegio.
- Acesso conforme necessidade e finalidade.
- Acesso contextual por organizacao, hospital, unidade, setor, perfil, categoria profissional, permissao especifica, vinculo assistencial e responsabilidade atribuida.
- Administrador nao recebe acesso clinico automatico.
- Auditor nao altera dados.
- Interface nao substitui autorizacao no servidor e no banco.
- Acoes sensiveis devem ser auditaveis quando aplicavel.

## Acoes conceituais

- visualizar;
- criar;
- editar rascunho;
- finalizar;
- complementar;
- retificar;
- consultar historico;
- consultar episodio;
- consultar exame;
- liberar resultado;
- administrar protocolo;
- visualizar indicador;
- exportar;
- auditar.

## Matriz resumida

| Perfil | Modulo ou area | Acoes conceituais | Escopo | Restricoes | Auditoria |
| --- | --- | --- | --- | --- | --- |
| Medico | Inicio, Paciente, Episodio, Evolucoes | visualizar, criar, editar rascunho, finalizar, complementar, retificar, consultar historico, consultar episodio | pacientes sob responsabilidade, setor autorizado ou permissao explicita | nao altera evolucao finalizada de outro profissional; nao recebe acesso fora do contexto autorizado | sim para evolucoes, historico e acoes sensiveis |
| Enfermagem | Inicio, Paciente, Episodio, Sinais, Evolucoes de enfermagem | visualizar, criar, editar rascunho, finalizar, complementar, retificar conforme permissao | pacientes do setor ou vinculo autorizado | nao edita evolucoes medicas; nao implementa prescricao ou administracao medicamentosa completa nesta etapa | sim para registros e consultas sensiveis |
| Multiprofissional | Paciente, Episodio, Evolucoes da categoria | visualizar, criar, editar rascunho, finalizar, complementar, retificar conforme permissao | pacientes vinculados ou setor autorizado | limitado a categoria, finalidade e regras institucionais | sim quando aplicavel |
| Laboratorio e diagnostico | Exames e Diagnostico | visualizar solicitacoes, consultar exame, liberar resultado, comunicar resultado critico | exames autorizados, fila, setor ou servico | sem acesso indiscriminado a evolucoes clinicas | sim para resultados, laudos e criticos |
| Farmacia e almoxarifado | Medicamentos e Insumos | visualizar catalogo, estoques, solicitacoes, recursos utilizados, consumo | recursos e solicitacoes autorizadas | acesso ao paciente limitado ao necessario para a funcao | sim para consumo, itens criticos e substituicoes |
| Direcao e gestao | Inicio, Indicadores, Operacao | visualizar indicador, exportar conforme permissao | dados agregados por hospital, unidade ou setor | acesso nominal clinico depende de permissao e finalidade explicita | sim para exportacoes e consultas sensiveis |
| Qualidade | Protocolos, Indicadores, Alertas, Auditoria assistencial | visualizar, auditar, consultar desvios, planos de acao | escopo autorizado de qualidade | acesso a evolucoes apenas quando necessario e autorizado | sim |
| Responsavel tecnico | Protocolos, Governanca, Qualidade | administrar protocolo, visualizar aderencia, revisar pendencias | protocolos e governanca autorizados | nao substitui decisao profissional assistencial | sim |
| Administrador | Administracao e Governanca | configurar instituicoes, unidades, usuarios, perfis e permissoes | administracao do hospital ou organizacao | nao recebe acesso clinico automatico; acessos excepcionais devem ser controlados | sim |
| Auditor | Auditoria, Historico autorizado | visualizar, consultar historico, consultar episodio, auditar | somente leitura no escopo autorizado | nao cria, edita, finaliza ou retifica evolucoes; nao altera dados clinicos ou operacionais | sim |

## Regras adicionais

- Um perfil nao deve receber acesso clinico irrestrito apenas por nome de funcao.
- Exportacoes devem exigir permissao explicita e auditoria quando aplicavel.
- Consultas ao historico longitudinal devem respeitar isolamento institucional e contexto de acesso.
- Evolucao finalizada nao deve ser sobrescrita silenciosamente.
- Complementacao e retificacao exigem autoria e rastreabilidade.
- A matriz nao substitui validacao institucional e juridica.
