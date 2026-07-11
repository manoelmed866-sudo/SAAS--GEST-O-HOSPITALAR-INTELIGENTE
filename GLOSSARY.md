# GLOSSARY.md

## Glossario

Este glossario define termos usados na documentacao inicial da Plataforma de Inteligencia Hospitalar.

## Termos assistenciais

### Paciente

Pessoa acompanhada longitudinalmente pela instituicao hospitalar.

### Episodio assistencial

Passagem, atendimento, internacao ou ciclo de cuidado vinculado a um paciente.

### Jornada do paciente

Sequencia de eventos relacionados ao paciente dentro de um episodio ou ao longo de multiplos episodios.

### Historico longitudinal

Visao organizada de eventos assistenciais relacionados ao mesmo paciente dentro do contexto institucional autorizado. Nao duplica o cadastro do paciente.

### Linha do tempo do episodio

Representacao cronologica dos acontecimentos de um episodio assistencial especifico. Reune eventos de diversas origens e nao equivale a evolucao assistencial.

### Hipotese diagnostica

Possibilidade clinica considerada por profissional habilitado. Nao equivale a diagnostico confirmado.

Pode possuir estados institucionais como proposta, em investigacao, descartada ou confirmada. A confirmacao exige acao explicita de profissional autorizado e deve ser rastreavel.

### Sindrome

Conjunto de sinais, sintomas ou contexto assistencial que pode orientar avaliacao, formularios ou protocolos. Nao representa diagnostico confirmado por si so.

### Diagnostico

Registro clinico confirmado conforme decisao profissional e regra institucional. Nao deve ser gerado automaticamente pela plataforma.

### Conduta

Acao ou orientacao definida por profissional ou equipe autorizada. Nao deve ser executada autonomamente pelo sistema.

### Evolucao assistencial

Registro produzido por profissional identificado e autorizado, vinculado a paciente e episodio, com categoria profissional, tipo, data, hora, autoria, estado e contexto.

### Categoria profissional

Categoria autorizada pelo hospital para produzir ou consultar registros assistenciais conforme perfil, contexto e permissao.

### Autor profissional

Profissional identificado e autorizado responsavel por um registro assistencial.

### Tipo de evolucao

Classificacao configuravel de uma evolucao assistencial, associada a categoria profissional e regras institucionais.

### Evolucao medica

Categoria de evolucao assistencial produzida por profissional medico autorizado.

### Evolucao multiprofissional

Evolucao assistencial produzida por categoria profissional autorizada pelo hospital, como enfermagem, fisioterapia, nutricao, psicologia, servico social, farmacia clinica ou outras.

### Complementacao de evolucao

Registro posterior que acrescenta informacao a uma evolucao finalizada sem apagar o original.

### Retificacao de evolucao

Registro de correcao que preserva vinculo com a evolucao original e exige autoria, data, hora e justificativa rastreaveis.

### Anexo de evolucao

Documento, imagem autorizada ou arquivo relacionado a uma evolucao assistencial, privado por padrao e sujeito a controle de acesso.

### Rascunho

Estado de registro ainda editavel pelo autor conforme regras institucionais.

### Evolucao finalizada

Evolucao cujo conteudo foi concluido por profissional autorizado e deve ser preservado sem sobrescrita silenciosa.

### Desfecho

Resultado ou encerramento relevante de uma etapa ou episodio, conforme classificacao institucional.

## Termos de protocolos

### Protocolo institucional

Definicao de fluxo, etapas, criterios, formularios e orientacoes configurada pelo hospital.

### Versao do protocolo

Registro versionado de um protocolo em determinado momento.

### Execucao do protocolo

Aplicacao de uma versao de protocolo a um episodio especifico.

### Etapa

Parte ordenada ou condicional de um protocolo, formulario ou fluxo.

### Criterio

Condicao usada para orientar exibicao, elegibilidade, alerta ou sugestao.

### Regra

Logica configuravel que pode condicionar fluxos, campos, orientacoes ou alertas.

### Sugestao

Orientacao apresentada pelo sistema conforme regra institucional. Deve ser separada de decisao profissional.

### Decisao profissional

Registro de escolha, avaliacao ou conduta feita por profissional autorizado.

### Evidencia

Dado, registro, evento, exame ou informacao usada para sustentar uma avaliacao ou decisao.

### Justificativa

Explicacao registrada para uma decisao, divergencia, excecao ou conduta.

## Termos operacionais

### Capacidade hospitalar

Conjunto de recursos, setores, leitos, equipes, protocolos e estruturas disponiveis ou configuraveis no hospital.

### Mapa do hospital

Representacao operacional de setores, leitos, ocupacao, fluxos e localizacoes relevantes.

### Evento da jornada

Ocorrencia registrada no caminho do paciente ou do episodio.

### Recurso

Medicamento, insumo, equipamento, leito, equipe ou outro elemento usado na operacao hospitalar.

### Recurso previsto

Recurso indicado por protocolo, fluxo ou planejamento.

### Recurso sugerido

Recurso apresentado contextualmente pelo sistema conforme protocolo, regra ou situacao do episodio. Nao equivale a solicitacao, prescricao ou utilizacao.

### Recurso solicitado

Recurso requisitado por usuario autorizado.

### Recurso utilizado

Recurso efetivamente consumido, administrado, aplicado ou registrado conforme processo institucional.

### Exame

Processo diagnostico ou complementar com fluxo proprio de solicitacao, realizacao, resultado e registro.

### Forma de chegada

Conceito configuravel que identifica como um episodio assistencial comecou. Pode acionar campos, documentos, responsaveis, prioridades, notificacoes, fluxos e protocolos diferentes conforme configuracao de cada hospital.

Exemplos demonstrativos: chegada espontanea, encaminhamento, transferencia, retorno ou internacao eletiva.

### Canal de comunicacao

Meio institucional configuravel utilizado em uma comunicacao relevante. Pode estar relacionado a chegada, transferencia, resultado critico, encaminhamento ou outro evento.

### Vinculo assistencial

Relacao autorizada entre profissional, paciente, episodio, setor, leito ou responsabilidade atribuida.

### Contexto de acesso

Combinacao de organizacao, hospital, unidade, setor, perfil, categoria profissional, permissoes especificas, vinculo assistencial, responsabilidade atribuida, finalidade do acesso e situacao do usuario.

### Matriz de acesso

Documento conceitual que relaciona perfil, modulo, acao, escopo, restricoes e necessidade de auditoria.

### Area de trabalho por perfil

Organizacao da interface conforme perfil e contexto de acesso, sem substituir as regras de autorizacao do servidor e do banco.

### Indicador

Medida calculada para acompanhamento assistencial, operacional ou administrativo.

### Alerta

Sinalizacao gerada por regra institucional para chamar atencao de usuarios autorizados.

## Termos de governanca e seguranca

### Hospital

Instituicao ou unidade institucional isolada dentro da plataforma.

### Isolamento institucional

Garantia de que dados, usuarios, configuracoes e registros de um hospital nao sejam acessados indevidamente por outro.

### Menor privilegio

Principio de conceder a cada usuario apenas as permissoes necessarias para sua funcao.

### Auditoria

Registro rastreavel de operacoes sensiveis, mudancas relevantes e acessos importantes.

### Consulta sensivel

Acesso a informacao que pode exigir registro de auditoria conforme regra institucional.

### Dado ficticio

Dado criado para desenvolvimento, teste ou demonstracao, sem representar pessoa, hospital ou evento real.

### Segredo

Token, chave, senha, credencial ou valor sensivel que nao deve ser exposto.

## Termos de desenvolvimento

### Sprint

Ciclo planejado de trabalho com objetivo, escopo, entregas e criterios de avanco.

### MVP

Termo legado que, quando usado no projeto, deve significar apenas primeira etapa de validacao. Nao representa o limite funcional final do produto. Preferir `Primeira Versao Operacional` quando o assunto for o primeiro recorte utilizavel da plataforma.

### Visao Funcional Completa

Conjunto integral das capacidades planejadas para o produto, independentemente da sprint ou versao em que serao implementadas.

### Primeira Versao Operacional

Primeiro recorte utilizavel, integrado e validavel da plataforma. Nao representa o limite funcional do produto.

### Versao Candidata

Versao submetida a estabilizacao, testes e auditoria.

### Produto Completo

Plataforma que implementa os modulos e relacionamentos pertencentes a Visao Funcional Completa, sem obrigatoriamente substituir todos os sistemas administrativos externos utilizados por um hospital.

### Migracao versionada

Arquivo controlado por versao que altera estrutura ou regras de banco de dados de forma rastreavel.

### Lint

Verificacao automatizada de padroes e problemas comuns no codigo.

### Typecheck

Verificacao automatizada de tipos em linguagens ou ferramentas que suportam tipagem.

### Build

Processo de gerar versao executavel, empacotada ou validada da aplicacao.
