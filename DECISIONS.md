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

### DEC-028 - Sprint 03 com vinculos institucionais e hospitalares separados

A Sprint 03 devera usar modelo hierarquico com `organization_memberships` e `hospital_memberships` separadas, mantendo dependencia explicita entre vinculo institucional e vinculo hospitalar.

Motivo: melhorar clareza, integridade referencial, auditoria de RLS, testes pgTAP e suporte a usuarios com papeis diferentes em hospitais diferentes, reduzindo risco de privilegios excessivos.

### DEC-029 - Papeis, permissoes e acesso clinico separados

Papel, permissao, escopo, vinculo, acesso administrativo e acesso clinico serao tratados como conceitos diferentes.

Motivo: impedir que um administrador tecnico ou institucional receba acesso clinico automatico e permitir autorizacao por menor privilegio.

### DEC-030 - Cadastro publico bloqueado no fluxo inicial

O fluxo inicial recomendado para a Sprint 03 sera login apenas para usuarios previamente cadastrados ou convidados institucionalmente, sem cadastro publico aberto.

Motivo: plataforma hospitalar exige rastreabilidade, controle institucional e reducao de risco desde o primeiro acesso.

### DEC-031 - Contexto ativo sempre validado no banco

Organizacao ativa, hospital ativo, papel e permissoes efetivas nao serao considerados validos apenas por query string, cookie, `localStorage` ou identificador enviado pelo cliente.

Motivo: impedir acesso cruzado entre instituicoes ou hospitais por manipulacao de identificadores.

### DEC-032 - Organization como nome tecnico canonico

`organization` sera o nome tecnico e canonico no banco e no codigo. Instituicao sera o termo principal na interface e na documentacao voltada ao usuario.

`organization` podera representar hospital isolado, rede hospitalar, clinica, organizacao de saude, orgao publico ou grupo empresarial. `hospital` continuara sendo entidade subordinada a `organization`.

Motivo: preservar uma nomenclatura tecnica estavel e flexivel, sem limitar o modelo a um unico tipo de instituicao.

### DEC-033 - Cadastro publico bloqueado na primeira implementacao

Nao havera fluxo publico de criacao de conta na primeira implementacao da Sprint 03. Usuarios somente poderao entrar por convite institucional ou provisionamento administrativo.

Qualquer cadastro publico futuro dependera de decisao especifica e nova revisao de seguranca.

Motivo: reduzir risco de acesso indevido em uma plataforma hospitalar multi-institucional.

### DEC-034 - Convite institucional obrigatorio para usuarios comuns

Convite institucional sera obrigatorio para usuarios comuns. O primeiro `organization_admin` sera vinculado pelo `platform_admin`.

Convites deverao estar associados a e-mail, organization, hospital quando aplicavel, papel, remetente, data de criacao, data de expiracao e estado. Tambem deverao ser de uso unico, revogaveis, expiraveis e auditaveis.

Convite aceito nao podera ser reutilizado e nenhum convite podera conceder papel superior ao do emissor.

Motivo: garantir rastreabilidade e impedir criacao de acesso fora do escopo autorizado.

### DEC-035 - Confirmacao de e-mail obrigatoria no fluxo de convite

Confirmacao de e-mail sera obrigatoria no fluxo de convite. No ambiente local, o fluxo sera testado com o Mailpit fornecido pelo Supabase.

Nenhuma confirmacao sera simulada com contas reais e nenhuma configuracao remota sera criada nesta fase.

O `platform_admin` inicial podera ser provisionado por procedimento administrativo seguro e documentado.

Motivo: confirmar posse do e-mail antes de liberar acesso e manter a validacao restrita ao ambiente local nesta etapa.

### DEC-036 - Limites de criacao e gestao de hospitals

Na primeira implementacao, `platform_admin` podera criar `organization`, criar `hospital`, vincular o primeiro `organization_admin` e ativar ou suspender `organization` por motivos tecnicos ou contratuais.

`organization_admin` podera visualizar a propria organization, editar campos institucionais permitidos, visualizar hospitals da propria organization, editar campos operacionais permitidos, gerenciar vinculos dentro do proprio tenant e solicitar ou preparar criacao de novo hospital, sem persistir diretamente nesta fase.

`organization_admin` nao podera criar diretamente hospital na primeira implementacao, mover hospital entre organizations, alterar identificadores estruturais, excluir fisicamente organization ou hospital, alterar situacao contratual da plataforma, conceder `platform_admin` ou acessar dados de outra organization.

`hospital_admin` administrara somente o hospital ao qual esta vinculado, sem criar novos hospitals e sem alterar dados da organization fora do escopo hospitalar.

Motivo: separar governanca da plataforma, administracao institucional e administracao hospitalar com menor privilegio.

### DEC-037 - Desativacao logica para organizations, hospitals e vinculos

Organizations, hospitals e vinculos institucionais deverao usar desativacao logica na primeira implementacao. Exclusao fisica nao sera usada como mecanismo operacional.

Motivo: preservar rastreabilidade, historico administrativo e auditoria.

### DEC-038 - Auditor inicial somente leitura

O papel `auditor` sera inicialmente somente leitura dentro do escopo concedido.

O auditor podera visualizar organization, hospital, vinculos, papeis, permissoes e logs de auditoria futuros. Nao podera criar ou alterar registros, gerenciar vinculos, alterar papeis ou acessar dados clinicos automaticamente.

Qualquer acesso clinico futuro exigira permissao clinica separada, escopo institucional explicito, finalidade registrada, autoria, data e hora, e trilha de auditoria.

Motivo: permitir revisao e controle sem transformar auditoria em permissao clinica implicita.

### DEC-039 - Papeis minimos da primeira implementacao

Os papeis minimos da primeira implementacao serao `platform_admin`, `organization_admin`, `hospital_admin`, `auditor` e `member`.

Nao serao adotados ainda como papeis definitivos medico, enfermeiro, farmaceutico, profissional assistencial, gestor clinico ou operador de estoque. Esses papeis serao definidos junto aos modulos correspondentes.

Motivo: manter a Sprint 03 focada em acesso institucional e evitar antecipar regras de modulos clinicos ou operacionais.

### DEC-040 - Estados canonicos com text e CHECK constraints

Na Sprint 03A, estados canonicos serao modelados como `text` com `CHECK constraints`, sem enums PostgreSQL.

Estados aprovados:

- `profiles.status`: `pending`, `active`, `suspended`, `deactivated`.
- `organizations.status`: `active`, `suspended`, `inactive`.
- `hospitals.status`: `active`, `suspended`, `inactive`.
- `organization_memberships.status`: `pending`, `active`, `suspended`, `revoked`.
- `hospital_memberships.status`: `pending`, `active`, `suspended`, `revoked`.
- Atribuicoes de papel: `active`, `revoked`.

Motivo: permitir evolucao controlada nesta fase sem acoplar o banco a enums prematuros.

### DEC-041 - Estrutura relacional das memberships e atribuicoes de papeis

A Sprint 03A implementara `organization_memberships`, `organization_membership_roles`, `hospital_memberships` e `hospital_membership_roles` como estruturas separadas.

`hospital_memberships` devera validar por FKs compostas que o hospital e o organization membership pertencem a mesma organization.

Motivo: impedir associacoes cruzadas entre tenants, permitir papeis diferentes por hospital e facilitar RLS auditavel.

### DEC-042 - Papeis e permissoes relacionais

Papeis, permissoes e seus mapeamentos serao relacionais por meio de `roles`, `permissions` e `role_permissions`.

O mapeamento inicial de papeis e permissoes e dado estrutural da aplicacao e devera ser inserido por migracao, nao por `seed.sql`.

Motivo: permitir auditoria, expansao por escopo e impedir mistura entre permissoes de plataforma, organization e hospital.

### DEC-043 - Schema privado app_private para funcoes de autorizacao

A Sprint 03A criara o schema privado `app_private` para funcoes tecnicas de `updated_at` e funcoes booleanas de autorizacao usadas por RLS.

O schema nao devera ser exposto pela Data API e nao recebera tabelas nesta fase.

Funcoes `security definer` deverao usar `search_path = ''`, nomes totalmente qualificados e retornar somente boolean quando forem funcoes de autorizacao.

Motivo: reduzir recursao em politicas RLS sem expor registros institucionais.

### DEC-044 - Sem trigger automatico em auth.users na Sprint 03A

A Sprint 03A nao criara trigger automatico em `auth.users` e nao inserira `profile` automaticamente.

A criacao de `profile` sera tratada posteriormente por fluxo administrativo ou fase autorizada.

Motivo: evitar criacao inconsistente de usuarios e manter o provisionamento institucional sob controle.

### DEC-045 - Platform admin nao sera semeado

Nenhum `platform_admin`, usuario inicial, organization, hospital ou membership sera inserido pela Sprint 03A.

O provisionamento inicial do `platform_admin` sera definido posteriormente por procedimento administrativo seguro e documentado.

Motivo: impedir credenciais, usuarios ou dados institucionais permanentes dentro de migracoes estruturais.

### DEC-046 - Supabase SSR com chave publicavel e Proxy sem autorizacao na Sprint 03B

A Sprint 03B usara `@supabase/ssr` e `@supabase/supabase-js` como base oficial para clientes Supabase no navegador e no servidor.

Serao usados clientes separados:

- `createBrowserClient` para o navegador;
- `createServerClient` para servidor e Proxy.

A aplicacao usara somente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` como variaveis publicas da integracao Supabase nesta fase.

Service role, secret key, senha de banco, JWT secret, connection strings e chaves privadas nao poderao ser usadas no cliente nem receber prefixo `NEXT_PUBLIC_`.

Cookies serao a base da integracao SSR. O Proxy do Next.js sera implementado em `src/proxy.ts`, nao em `middleware.ts`, e ficara restrito a renovacao segura de sessao.

O Proxy devera chamar `getClaims()` para renovacao e validacao criptografica possivel do token, sem usar `getSession()` como base de autorizacao no servidor.

Durante a Sprint 03B, o Proxy nao redirecionara usuarios, nao classificara rotas como publicas ou protegidas, nao consultara `profiles`, memberships ou tabelas institucionais e nao decidira autorizacao.

A validacao de ambiente sera preguicosa: variaveis publicas do Supabase serao lidas apenas quando os clientes forem criados ou quando o Proxy for executado. Isso preserva lint, typecheck, testes e build sem `.env.local`, desde que a aplicacao atual nao chame Supabase durante geracao estatica.

Motivo: preparar a fundacao SSR segura para autenticacao futura sem antecipar login, logout, protecao de rotas, contexto ativo ou autorizacao institucional.

### DEC-047 - Sprint 03C com login protegido sem contexto ativo

A Sprint 03C implementara login, logout, pagina de acesso negado, rota protegida `/painel`, redirecionamento seguro e validacao de usuario no servidor.

O acesso inicial ao painel exigira usuario autenticado, perfil ativo e pelo menos um papel ou vinculo ativo de plataforma, instituicao ou hospital. Essa validacao nao seleciona instituicao, nao seleciona hospital, nao cria contexto institucional ativo e nao substitui as politicas RLS do banco.

Cadastro publico, convite persistido, recuperacao de senha, confirmacao de e-mail funcional, MFA, criacao automatica de perfil, trigger em `auth.users`, novas tabelas, migracoes e contexto ativo ficam fora da Sprint 03C.

Motivo: liberar a primeira porta autenticada da aplicacao com menor privilegio e mensagens seguras, sem antecipar a Sprint 03D nem criar atalhos de autorizacao.

### DEC-048 - Gate hospitalar nao depende de leitura de organizations

A verificacao de acesso hospitalar em `src/lib/auth/access.ts` nao devera exigir leitura direta da tabela `organizations`. A consulta do gate hospitalar consulta apenas `hospital_memberships`, `hospitals`, `organization_memberships` do proprio usuario e `hospital_membership_roles` com seus `roles`.

A exigencia de organization ativa continua garantida de forma transitiva pela funcao privada `current_user_has_hospital_permission`, que valida organization e hospital ativos ao autorizar a leitura de `hospitals` por RLS.

Motivo: usuario com vinculo hospitalar valido, mas sem papel de escopo organizacao, nao possui permissao de leitura em `organizations`, entao exigir essa leitura em join interno nega indevidamente o acesso. A decisao preserva menor privilegio e evita ampliar permissoes ou afrouxar RLS apenas para satisfazer a consulta de aplicacao. Um teste pgTAP de regressao para usuario hospital-only protege essa decisao.
