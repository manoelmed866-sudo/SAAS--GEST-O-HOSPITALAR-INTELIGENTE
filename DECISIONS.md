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

### DEC-049 - Inventario de acessos por RLS sem migration na Sprint 03D1

O inventario de contexto institucional da Sprint 03D1, em `src/lib/auth/context.ts`, listara organizations e hospitals ativos consultando as proprias tabelas com filtro `status = 'active'` e delegando a autorizacao definitiva ao RLS da Sprint 03A, sem reconstruir joins de permissao na aplicacao e sem nova migration (Opcao A).

O inventario nao resolve papeis ativos, que ficam reservados para a revalidacao do contexto selecionado nas etapas 03D3 e 03D4. Um usuario hospital-only sem papel de escopo organizacao podera receber a lista de organizations vazia e a lista de hospitals preenchida, porque o RLS nao lhe concede leitura em `organizations`, mas concede leitura no proprio hospital.

A funcao retorna um resultado discriminado `success` ou `error`. Em erro de qualquer consulta, retorna `error` sem dados parciais e sem converter erro em inventario vazio, preservando o comportamento fail-closed. Usa apenas o cliente Supabase server-side autenticado, sem service role.

Motivo: manter a separacao entre autenticacao, autorizacao e contexto ativo, tratando o RLS como fonte unica de verdade da autorizacao, sem ampliar grants ou politicas sem necessidade comprovada e sem exibir instituicoes nao autorizadas. Exibir o nome da organization para usuario hospital-only, que exigiria nova politica de leitura, fica adiado para uma decisao futura especifica caso a necessidade se confirme.

### DEC-050 - Contexto institucional ativo como cookie ponteiro revalidado sob RLS na Sprint 03D3

O contexto institucional ativo da Sprint 03D3 sera persistido no cookie `ghi_active_context`, com payload minimo `organizationId`, `hospitalId` e `v: 1`, sem papel, permissao, nome institucional ou dado clinico. O cookie sera `httpOnly`, `SameSite=Lax`, `Secure` apenas em producao, com `path` `/painel` e `maxAge` de 12 horas (`60 * 60 * 12`), alinhado ao plantao de urgencia e emergencia. A versao `v` sera acrescentada internamente pelo modulo, nunca pelo chamador.

O cookie sera apenas um ponteiro da selecao atual e nunca a fonte de autorizacao. O parsing usara Zod strict, aceitando somente UUIDs validos e `v` igual a 1, rejeitando JSON invalido e campos extras; a escrita tambem validara a selecao antes de gravar e lancara erro generico, sem expor IDs ou conteudo, quando a entrada for invalida. O conteudo do cookie, UUIDs, tokens, sessao e erros sensiveis nunca serao registrados em log.

Todo acesso que exija contexto ativo revalidara a selecao no servidor sob RLS, consultando `hospitals` com filtros de `id`, `organization_id` e `status = 'active'` via `maybeSingle()`, usando somente o cliente Supabase server-side autenticado, sem service role. A leitura de `hospitals` ja exige, de forma transitiva pelo RLS da Sprint 03A, organization ativa, hospital ativo, vinculo e papel ativos e acesso real; por isso a validacao confia no RLS como barreira definitiva e nao reconstroi joins de autorizacao na aplicacao.

O resultado sera discriminado em quatro estados que nunca se colapsam e nunca devolvem contexto parcial: `active`, `absent`, `invalid` e `error`. Erro tecnico permanece `error` e nao apaga automaticamente o contexto; contexto ausente e distinto de contexto invalido; contexto invalido nao e tratado como erro tecnico. O `logoutAction` limpa o cookie sempre, no inicio da acao, antes de qualquer redirect e antes de qualquer erro do `signOut`, mesmo sem usuario autenticado.

Um teste pgTAP de contexto ativo confirmou sob RLS que papel hospitalar revogado com vinculo ativo e sem papel organizacional retorna 0 linhas, porque `current_user_has_hospital_permission` exige papel ativo e nao revogado. Nenhuma correcao em TypeScript, migration ou RLS foi necessaria.

Motivo: manter a separacao entre autenticacao, autorizacao e contexto ativo, garantindo que nenhum contexto valha apenas por estar em cookie e que a revalidacao no banco bloqueie vinculo revogado, hospital ou organizacao suspensos e acesso cruzado, sem ampliar RLS, grants, roles ou permissions e sem criar UI, seletor ou migration nesta etapa.

### DEC-051 - Seletor visual de contexto institucional na Sprint 03D2

A selecao de contexto institucional tera uma rota protegida `/painel/selecionar-contexto`, dentro da area do painel, com ponto de entrada por link simples "Selecionar hospital" no painel. A rota e um Server Component `force-dynamic` protegido pelo Proxy existente e recebe o cookie no `path` `/painel`.

O formulario sera um Client Component com `useActionState`, apresentando os hospitais autorizados em um radiogroup. Nao havera selecao automatica, mesmo com um unico hospital: a confirmacao explicita por botao e obrigatoria. O caso hospital-only e suportado: com `organizations` vazio o hospital continua selecionavel, sem inventar nome de organizacao e sem exibir nenhum UUID como texto.

A pagina consome `getAuthorizedContextInventory()` sob RLS, na ordem `requirePortalAccess()` e depois inventario, e renderiza estados distintos: selecao, inventario vazio e falha tecnica, tratando inventario vazio como diferente de erro tecnico.

A Server Action `selectActiveContextAction` sera co-localizada na rota, validara `organizationId:hospitalId` com Zod e revalidara obrigatoriamente por `validateActiveContext`. O cookie so sera gravado quando o resultado for `active`, usando os IDs vindos do banco, seguido de `redirect("/painel")` fixo. Os estados `invalid` e `error` sao separados, com mensagens genericas, e nenhum destino de redirect vindo do navegador e aceito.

Nenhuma migration, RLS, grant, role ou permission foi criada ou alterada. Nao ha dashboard contextual nesta sprint: a exibicao do hospital ativo no painel e a revisao do texto antigo do painel sobre ainda nao existir contexto ativo ficam para a Sprint 03D4.

Validacao real registrada: login real aprovado; rota protegida aprovada; dois hospitais autorizados visiveis; hospital de outro tenant oculto; caso hospital-only funcionando; selecao repetida entre dois hospitais aprovada; logout e novo login aprovados; troca de contexto aprovada. A validacao usou um fixture ficticio efemero em ambiente local, removido integralmente ao final.

Motivo: dar ao usuario autenticado uma forma segura de escolher o hospital de trabalho, mantendo a autorizacao no RLS e no servidor, sem confiar no inventario renderizado, sem ampliar permissoes e sem antecipar o dashboard contextual da Sprint 03D4.

### DEC-052 - Painel exibe contexto hospitalar ativo revalidado sob RLS na Sprint 03D4

O painel `/painel` passa a resolver o contexto institucional ativo apos o gate de acesso: a ordem obrigatoria e `requirePortalAccess()` e somente entao `resolveActiveContext()`. O painel nao consulta o Supabase diretamente, nao usa `createClient` nem service role, nao le cookies diretamente, nao redireciona e nunca exibe UUIDs.

`resolveActiveContext` permanece com os quatro estados discriminados `active`, `absent`, `invalid` e `error`, herdados da Sprint 03D3. O tipo `ActiveContext` foi enriquecido com `hospitalCode` e `hospitalDisplayName`, alem de `organizationId` e `hospitalId`. Nome e codigo do hospital vem exclusivamente da linha de `hospitals` revalidada sob RLS, nunca do cookie e nunca de fallback com IDs.

`validateActiveContext` continua usando uma unica consulta a tabela `hospitals`, agora selecionando `id, organization_id, code, display_name`, com os mesmos filtros `id`, `organization_id` e `status = 'active'` via `maybeSingle()` e sob o cliente Supabase server-side autenticado. Nenhuma segunda consulta, join de autorizacao ou leitura de `organizations`/memberships foi adicionada; o RLS da Sprint 03A permanece a barreira definitiva.

O cookie `ghi_active_context` continua contendo somente `organizationId`, `hospitalId` e `v`; nome e codigo nunca sao persistidos no cookie.

Comportamento por estado no painel:

- `active`: exibe "Plantao ativo", o nome e o codigo do hospital e o link "Trocar hospital".
- `absent`: tratado inline, sem redirect automatico, com titulo "Selecione um hospital" e link "Selecionar hospital".
- `invalid`: tratado inline, orientando nova selecao, sem ser confundido com erro tecnico.
- `error`: permanece distinto, com mensagem generica, sem apagar o cookie e oferecendo "Tentar novamente".
- Logout permanece disponivel em todos os estados.

Nenhuma organizacao e exigida ou exibida para usuario hospital-only; nenhum UUID e exibido. Nenhuma migration, RLS, grant, role, permission ou Proxy foi alterada. Nenhum modulo clinico, paciente, protocolo, medicamento, estoque ou dado assistencial foi criado. Os estados `invalid` e `error` foram validados por testes automatizados, nao forcados manualmente em execucao real.

Validacao E2E real registrada, com fixture ficticio efemero em ambiente local removido integralmente ao final: login aprovado; estado `absent` aprovado; Hospital Alfa E2E exibido como ativo com nome e codigo corretos; hospital de outro tenant (Hospital Gama E2E) oculto; troca de Alfa para Beta aprovada, com Alfa deixando de permanecer como ativo apos a troca; logout aprovado; novo login retornou ao estado `absent`.

Motivo: entregar o dashboard contextual minimo que faltava na serie 03D, exibindo o hospital de trabalho ao usuario autenticado com nome e codigo confiaveis vindos do banco sob RLS, sem transformar o cookie em fonte de verdade, sem ampliar autorizacao e sem antecipar modulos clinicos.

### DEC-053 - Sprint 03D5 como checkpoint de encerramento tecnico

A Sprint 03D5 nao introduz nova funcionalidade. Nao existia escopo oficial previamente definido para a 03D5 na documentacao: ela era um slot remanescente da numeracao emergente das subfases da Sprint 03D. Os criterios de aceite da Sprint 03D ja haviam sido cumpridos pelas etapas 03D1 (inventario autorizado), 03D2 (seletor visual de contexto), 03D3 (cookie e revalidacao de contexto) e 03D4 (painel contextual com hospital ativo). Portanto, a 03D5 e redefinida como checkpoint que consolida e encerra tecnicamente a Sprint 03, com escopo exclusivamente documental.

Nesta etapa:

- Nao sera criado `src/lib/auth/capabilities.ts`.
- Nao havera nova migration.
- Nao havera alteracao de RLS, grants, roles, permissions ou cookie.
- Nao havera alteracao de codigo, testes, Proxy ou paginas.

A resolucao de capacidades efetivas do usuario sera planejada e implementada na Sprint 04, e nao aqui. Essa resolucao devera considerar a uniao dos tres escopos de autorizacao, nao apenas o escopo hospitalar:

- plataforma (`platform_role_assignments`);
- organizacao (`organization_membership_roles`);
- hospital (`hospital_membership_roles`).

Consultar somente `hospital_membership_roles` seria incompleto, pois ignoraria permissoes efetivas provenientes dos escopos de plataforma e organizacao; por isso a resolucao correta e maior e mais delicada do que caberia nesta etapa de encerramento.

Principios preservados para a Sprint 04:

- Nenhuma permissao ou capacidade sera persistida em cookie; o cookie `ghi_active_context` permanece um ponteiro minimo `{organizationId, hospitalId, v}`.
- O RLS continuara sendo a barreira final de autorizacao.
- A interface nunca sera a unica fonte de autorizacao; capacidades serao sempre revalidadas no servidor sob RLS.

Motivo: encerrar formalmente a Sprint 03 com honestidade de escopo, evitando implementar uma camada de autorizacao granular incompleta sob pressao de numeracao, e transferindo a resolucao de capacidades efetivas para a sprint correta (Sprint 04), onde a uniao dos tres escopos podera ser modelada, testada e documentada com o cuidado necessario.

### DEC-054 - Capacidades efetivas do hospital ativo sob SECURITY INVOKER

A Sprint 04A introduz uma camada de capacidades semanticas resolvida no servidor, a partir do modelo relacional de papeis e permissoes da Sprint 03A. A resolucao considera os tres escopos de autorizacao, relativamente ao hospital ativo: plataforma (`platform_role_assignments`), organizacao (`organization_membership_roles`, na organizacao proprietaria do hospital) e hospital (`hospital_membership_roles`, no hospital alvo).

Composicao e semantica:

- A combinacao entre escopos e monotonica por OR (uniao): uma capacidade e verdadeira quando qualquer escopo qualificante possui a permissao correspondente. Nao existe negacao nem precedencia nesta etapa; duplicidade entre escopos nao altera o resultado.
- A capacidade so nasce de permissao explicitamente atribuida por `role_permissions`. Nomes de papeis nao concedem privilegios por si.
- `platform_admin` NAO recebe automaticamente todas as capacidades: recebe apenas as derivadas de permissoes de escopo plataforma explicitamente atribuidas (hoje, `hospitals.read` mapeia para `canReadHospital`).

Contrato tecnico:

- Funcao `public.get_effective_hospital_capabilities(target_hospital_id uuid)`, `language sql`, `stable`, **SECURITY INVOKER**, `set search_path = ''`, retornando exatamente cinco booleanos semanticos e sempre uma unica linha: `can_read_hospital`, `can_read_memberships`, `can_manage_memberships`, `can_read_audit`, `can_switch_context`.
- Por ser SECURITY INVOKER, o RLS da Sprint 03A permanece aplicavel a cada tabela lida; nao foi usado `service_role`. `EXECUTE` e revogado de PUBLIC e de `anon` e concedido apenas a `authenticated`. Nenhuma policy, RLS ou grant de tabela foi alterado; nenhuma role ou permission semeada foi modificada.
- No escopo hospital-only, o gate de organizacao ativa e garantido de forma transitiva pela visibilidade do hospital sob RLS (a policy de `public.hospitals` delega a `app_private.current_user_has_hospital_permission`, que exige organizacao ativa), evitando que a funcao precise ler `public.organizations` para esse caso.

Consumidor server-side:

- `resolveActiveHospitalCapabilities()` (`src/lib/auth/capabilities.ts`) nao recebe argumentos. O hospital alvo vem exclusivamente do contexto ativo revalidado por `resolveActiveContext()`; envia a RPC somente `target_hospital_id`, nunca `organizationId`, e devolve o mesmo `ActiveContext` revalidado.
- A resposta da RPC e validada com Zod estrito (`.strict()`, exatamente cinco booleanos) e exige array de tamanho exatamente 1. Retorno malformado (erro, ausencia de linha, mais de uma linha, campo ausente/nulo/nao booleano ou propriedade inesperada) falha fechado como `{ status: "error" }`, sem capacidade parcial nem fallback permissivo.
- Nenhum codigo cru de permissao, papel ou scope e exposto ao consumidor: o TypeScript recebe somente cinco booleanos semanticos (`canReadHospital`, `canReadMemberships`, `canManageMemberships`, `canReadAudit`, `canSwitchContext`). Nenhuma permissao, papel ou capacidade e armazenada no cookie, que permanece o ponteiro minimo `{organizationId, hospitalId, v}`.

Limite consciente:

- O consumo visual das capacidades (painel, gates de UI) foi adiado; o painel ainda nao consome capacidades nesta etapa.
- SECURITY DEFINER nao foi adotado. Uma funcao `security definer` (que permitiria um gate de organizacao ativa explicito e uniforme nos tres escopos) so podera ser avaliada futuramente mediante necessidade comprovada e nova decisao.

Motivo: entregar a fundacao de autorizacao granular por capacidade de forma segura e testavel, mantendo o RLS como barreira final, sem expor o modelo interno de permissoes, sem confiar na interface e sem ampliar privilegios, preparando os gates de modulo e a administracao das proximas subfases da Sprint 04.

### DEC-055 - Consumo visual de capacidades nunca substitui gate server-side

A Sprint 04B introduz o primeiro consumo das capacidades efetivas entregues pela Sprint 04A. A regra central desta decisao: ocultar um link na interface e somente comportamento de interface; o acesso direto a rota deve continuar sendo avaliado no servidor, a cada requisicao. A ausencia do link nunca e a protecao.

Gate server-side reutilizavel:

- O helper `evaluateHospitalCapability(capability)` (`src/lib/auth/capability-gate.ts`) avalia UMA capacidade do hospital ativo e retorna um resultado discriminado: `allowed` e `denied` (ambos com o mesmo `ActiveContext` revalidado), `absent`, `invalid` e `error` propagados do resolver.
- O argumento e restrito em TypeScript a `keyof HospitalCapabilities`; nenhuma string generica e aceita.
- O helper nao redireciona, nao chama `notFound`, nao consulta o Supabase diretamente (sem `createClient`, RPC ou tabelas), nao le cookie, nao recebe `hospitalId`/`organizationId` e nao interpreta papel, scope ou codigo cru de permissao.
- `allowed`/`denied` devolvem apenas o contexto: o mapa completo de capacidades nunca e retornado pelo gate, evitando que consumidores acumulem conhecimento de autorizacao alem do necessario.

Painel:

- O painel usa `resolveActiveHospitalCapabilities()` como fonte unica de contexto e capacidades, numa unica chamada apos `requirePortalAccess()`; nao chama mais `resolveActiveContext()` diretamente.
- `canManageMemberships` controla apenas a visibilidade do link "Gerenciar equipe" (para `/painel/admin/equipe`). Quando falso, o link simplesmente nao existe: sem botao desabilitado e sem explicacao de permissao interna.
- "Trocar hospital" NAO e condicionado a `canSwitchContext` nesta etapa: permanece disponivel para todo contexto `active`, pois a barreira da troca continua no servidor sob RLS. Condicionar a troca a capacidade fica para decisao futura especifica.

Rota administrativa demonstrativa:

- `/painel/admin/equipe` e Server Component `force-dynamic` que aplica `requirePortalAccess()` e entao `evaluateHospitalCapability("canManageMemberships")`, renderizando cinco estados: `allowed`, `denied`, `absent`, `invalid` e `error`.
- `denied` e diferente de acesso negado institucional: o usuario tem acesso ao portal e contexto ativo valido, apenas nao possui esta capacidade; a mensagem e generica e nao revela papel, scope ou nome de capacidade.
- A rota e demonstrativa e nao possui CRUD, formulario administrativo, Server Action de mutacao ou consulta direta a Supabase. Qualquer CRUD da equipe pertence a Sprint 04C.

Invariantes preservados:

- Nenhum papel ou codigo cru de permissao e exposto na interface.
- Nenhuma capacidade e armazenada no cookie, que permanece o ponteiro minimo `{organizationId, hospitalId, v}`.
- O RLS permanece a barreira final para operacoes de dados; os gates de pagina protegem navegacao e renderizacao, nao substituem o banco.

Evidencia E2E:

- E2E assistido comprovou o usuario `member` negado por URL direta (estado `denied` renderizado sem o conteudo autorizado, mesmo sem o link existir no painel) e o `hospital_admin` autorizado (link visivel e rota `allowed` com o hospital do contexto).
- O E2E foi realizado por fluxo HTTP real contra o Next.js e o Supabase locais, com sessoes isoladas por usuario e formularios submetidos por progressive enhancement, sem navegador grafico.
- Validacao visual (screenshots) e hidratacao client-side permanecem fora desta evidencia; as assercoes cobrem o HTML renderizado no servidor, onde vivem todas as garantias da 04B.

Motivo: estabelecer desde o primeiro consumo visual que capacidade e assunto do servidor. A interface apenas reflete a autorizacao ja decidida sob RLS; nenhuma rota administrativa presente ou futura pode confiar na ausencia de link, em estado visual, em URL ou em cookie como protecao.

### DEC-056 - Listagem da equipe por RPC SECURITY DEFINER com validacao interna

A Sprint 04C.1 entrega a listagem somente leitura da equipe do hospital ativo. A auditoria da 04C comprovou a necessidade prevista na DEC-054: a leitura da equipe e estruturalmente bloqueada sob RLS para o `hospital_admin`, porque a policy de SELECT de `public.organization_memberships` exige permissao ORGANIZACIONAL (`organization_memberships.read`), que o papel hospitalar nao possui; sem ler `organization_memberships` nao ha como ligar o vinculo hospitalar ao `profile`. **SECURITY INVOKER herdaria exatamente esse bloqueio e nao atende ao hospital_admin.** Afrouxar a RLS de `organization_memberships` ampliaria a visibilidade de vinculos organizacionais alem da necessidade e foi rejeitado.

Decisao:

- SECURITY DEFINER e autorizado SOMENTE para esta RPC estreita de leitura: `public.get_hospital_team(target_hospital_id uuid)`, `language sql`, `stable`, `set search_path = ''`, objetos totalmente qualificados, sem SQL dinamico e sem `service_role`.
- A autorizacao e validada EXPLICITAMENTE dentro da funcao, antes de qualquer linha, reproduzindo a semantica de `canReadMemberships` da 04A: perfil atual ativo, organizacao proprietaria ativa, hospital alvo ativo e permissao explicita `hospital_memberships.read` por papel hospitalar ativo/nao revogado no hospital alvo OU papel organizacional ativo/nao revogado na organizacao proprietaria. Fail-closed: sem permissao, zero linhas.
- A identidade e resolvida pelas funcoes `app_private` existentes (`current_profile_is_active`, `current_user_has_hospital_permission`, `current_user_has_organization_permission`), que ja sao SECURITY DEFINER desde a Sprint 03A. Nenhum acesso por nome de papel e nenhum bypass automatico para `platform_admin`.
- Retorno minimo por integrante: `display_name`, `membership_status` e `role_labels` (apenas `roles.display_name`, nunca `role.code`). Nenhuma leitura de `auth.users`, nenhum e-mail, nenhum UUID no retorno. `EXECUTE` revogado de PUBLIC e `anon`, concedido apenas a `authenticated`.
- Regras da lista: somente o hospital alvo e a organizacao proprietaria; perfil inativo, vinculo organizacional nao ativo e vinculo hospitalar `revoked` sao excluidos; `suspended` e `pending` aparecem com o proprio status; papeis somente de escopo hospital, ativos e nao revogados; ordenacao deterministica; uma pessoa por linha.
- A RLS permanece INALTERADA: nenhuma policy, grant de tabela, role ou permission foi modificada. A listagem e somente leitura; qualquer mutacao (suspender, reativar, atribuir/revogar papel, criar vinculo) pertence a 04C.2+ e exigira decisao propria, com invariantes de ultimo administrador e trilha de auditoria.

Consumo:

- O resolver `resolveActiveHospitalTeam()` nao recebe argumentos: o hospital vem exclusivamente do contexto ativo revalidado; o gate semantico `canReadMemberships` decide `denied` no servidor sem chamar a RPC; a resposta e validada com Zod estrito e falha fechada.
- O painel exibe "Ver equipe" por `canReadMemberships` (auditor enxerga; member nao); `canManageMemberships` deixou de controlar a visibilidade da listagem.

Motivo: destravar a administracao da equipe sem afrouxar RLS nem confiar na interface, abrindo a excecao SECURITY DEFINER prevista na DEC-054 de forma minima, explicita, testada por pgTAP (24 verificacoes no arquivo 008) e restrita a leitura.

### DEC-057 - Mutacoes de vinculos hospitalares por RPC transacional auditada

A Sprint 04C.2 entrega as primeiras mutacoes administrativas reais: suspensao e reativacao de vinculos hospitalares, restritas a `active <-> suspended`. `pending` e `revoked` ficam fora do escopo (`revoked` permanece terminal). Nenhuma exclusao, revogacao, alteracao de papel, convite ou criacao de conta e possivel nesta etapa.

Referencia opaca:

- `hospital_memberships.management_ref` e uma referencia publica opaca de 128 bits (32 hex, `gen_random_bytes`, unique + check de formato). O UUID interno do vinculo NUNCA trafega no HTML nem no FormData.
- A referencia opaca NAO autoriza: e apenas um endereco de alvo. A RPC revalida integralmente a autorizacao, o escopo e o estado antes de qualquer alteracao; referencia inexistente e referencia fora do escopo retornam o mesmo resultado, sem enumeracao.

RPC unica de mutacao:

- `public.change_hospital_membership_status(target_hospital_id uuid, target_management_ref text, requested_status text)`, `plpgsql`, `volatile`, **SECURITY DEFINER** restrito, `set search_path = ''`, objetos totalmente qualificados, sem SQL dinamico, sem `service_role` e sem leitura de `auth.users`.
- Autorizacao explicita fail-closed: perfil ativo e `hospital_memberships.manage` por papel hospitalar OU organizacional (ativo, nao revogado), via funcoes `app_private` existentes; sem acesso por nome de papel e sem bypass de `platform_admin`.
- Lock por hospital (`SELECT ... FOR UPDATE`) serializa mutacoes administrativas concorrentes no mesmo hospital; a checagem de ultimo administrador ocorre DEPOIS do lock, enxergando o estado consolidado. O lock foi comprovado estruturalmente; teste real de concorrencia nao foi executado.
- Invariantes: auto-suspensao bloqueada (`self_suspension_forbidden`); o ultimo `hospital_admin` ativo nao pode ser suspenso (`last_admin_forbidden`); transicoes invalidas retornam `invalid_transition`.

Auditoria transacional:

- `public.administrative_audit_events` e append-only e SEM acesso direto da aplicacao: RLS habilitado sem policy permissiva e zero grants para `anon`/`authenticated`. A insercao ocorre exclusivamente dentro da RPC, na MESMA transacao da alteracao: qualquer falha reverte ambas; cancelamento e falha nao geram evento.
- Constraint cruzada `administrative_audit_events_transition_consistency_check`: cada `event_type` aceita somente a transicao que descreve (`hospital_membership_suspended`: active->suspended; `hospital_membership_reactivated`: suspended->active). Qualquer outra combinacao falha, mesmo vinda de codigo privilegiado.

Hardening RPC-only:

- O `UPDATE (status)` direto de `authenticated` em `hospital_memberships`, concedido na Sprint 03A antes da existencia da RPC, foi REVOGADO, e a policy `hospital_memberships_update_allowed` foi REMOVIDA (migration complementar `20260714030000`).
- A RPC e o UNICO caminho de alteracao de status de vinculo hospitalar. Nenhum grant novo foi concedido; SELECT/INSERT existentes, policies de leitura, RLS de outras tabelas, `organization_memberships` e as tabelas de papeis permanecem intocados.

Interface:

- `get_hospital_team` foi estendida com metadados de acao (`management_ref`, `can_suspend`, `can_reactivate`) expostos APENAS a quem possui manage; auditor recebe referencia nula e indicadores falsos. Indicadores sao orientacao de interface e nunca autorizam; a RPC revalida tudo.
- A Server Action recebe do navegador SOMENTE `managementRef` e `requestedStatus` (Zod estrito); o hospital vem exclusivamente do contexto ativo revalidado. O componente cliente exige confirmacao explicita inline (Confirmar suspensao/reativacao + Cancelar) antes de qualquer envio; nenhuma mutacao ocorre sem confirmacao.
- Nenhum e-mail, UUID, papel, permissao ou codigo cru trafega ou e exibido; mensagens de resultado sao genericas.

Evidencia:

- 59 verificacoes pgTAP no arquivo 009 (198 no total), incluindo: privilegios UPDATE zerados (tabela e coluna), ausencia de policy de UPDATE, rejeicao de INSERT incoerente na auditoria, RPC executavel somente por `authenticated` e auditoria sem privilegios diretos.
- E2E em navegador real (Chromium headless via CDP, JavaScript e hidratacao reais): 35 verificacoes aprovadas, incluindo FormData minimo, cancelamento sem efeito, protecao do ultimo administrador refletida na interface, UPDATE direto via PostgREST negado (HTTP 403) e auditoria exata (1 evento por mutacao bem-sucedida, zero por cancelamento/falha, zero combinacoes inconsistentes).

Motivo: permitir a primeira mutacao administrativa com o menor privilegio possivel e trilha de auditoria inviolavel, eliminando o caminho de escrita direta que dispensaria as invariantes (auto-suspensao, ultimo administrador, auditoria), sem confiar na interface, sem expor identificadores internos e sem antecipar as mutacoes mais sensiveis (papeis, revogacao, convites), que pertencem a 04C.3+ sob decisao propria.

### DEC-058 - Gestao de papeis hospitalares por RPC auditada e deferimento da administracao de identidade

O fechamento da Sprint 04 entrega a gestao de papeis hospitalares EXISTENTES: atribuir, revogar e reatribuir papeis de escopo hospital a vinculos do hospital ativo. Nenhum papel ou permissao e criado ou editado; papeis organizacionais e de plataforma ficam fora do escopo.

Referencias opacas:

- `roles.management_ref` e uma referencia publica opaca de 128 bits (32 hex, default `gen_random_bytes`, unique + check de formato), no mesmo padrao de `hospital_memberships.management_ref` (DEC-057). Nenhum id interno de papel, `role.code` ou `permission.code` trafega no navegador; a referencia nunca autoriza.

Hardening RPC-only de papeis:

- A auditoria previa comprovou que `authenticated` possuia INSERT (colunas) e UPDATE (`status`, `revoked_at`) diretos em `hospital_membership_roles`, com policies correspondentes da Sprint 03A — um caminho que contornaria invariantes e auditoria. Esses privilegios foram REVOGADOS (tabela e colunas, incluindo DELETE) e as policies `hospital_membership_roles_insert_allowed` e `hospital_membership_roles_update_allowed` foram REMOVIDAS. O SELECT legitimo foi preservado.
- `organization_membership_roles`, `platform_role_assignments` e os catalogos `roles`/`permissions` permanecem intocados (dados, grants e policies): a mutacao de papeis organizacionais e de plataforma pertence a decisao futura propria.

RPC unica de mutacao de papeis:

- `public.change_hospital_membership_role(target_hospital_id uuid, target_membership_ref text, target_role_ref text, requested_action text)`: `plpgsql`, `volatile`, **SECURITY DEFINER** restrito, `set search_path = ''`, objetos qualificados, sem SQL dinamico, sem `service_role`, sem `auth.users`.
- Acoes fechadas `assign`/`revoke` com resultados estruturados: `updated`, `not_allowed`, `invalid_transition`, `self_admin_role_forbidden`, `last_admin_forbidden`.
- Autorizacao identica a DEC-057: perfil ativo + `hospital_memberships.manage` por escopo hospitalar OU organizacional, fail-closed, sem bypass de `platform_admin`. Lock por hospital antes de qualquer decisao; alvo (vinculo nao revogado, org membership e perfil ativos) e papel (scope hospital) resolvidos por referencia opaca, com o MESMO resultado para inexistente e fora de escopo (anti-enumeracao).
- Assign: bloqueia duplicata de atribuicao ativa; quando existe atribuicao revogada, REATIVA a linha existente (`status active`, `revoked_at` null, `granted_by` atualizado), respeitando a unicidade vinculo/papel. Revoke: somente atribuicao ativa; o ator nunca revoga o proprio `hospital_admin`; o ultimo `hospital_admin` ativo qualificado (vinculo hospitalar ativo, org membership ativo, perfil ativo, papel ativo nao revogado) nao pode ser revogado — administrador com multiplos papeis continua administrador.

Auditoria estendida (sem tabela paralela):

- `administrative_audit_events` suporta os novos eventos de forma coerente: `hospital_role_assigned` e `hospital_role_revoked`, coluna opcional `target_role_id` (FK `roles`) e constraint cruzada ampliada — eventos de vinculo exigem `target_role_id` nulo; eventos de papel exigem o papel e apenas as transicoes `none|revoked -> active` (assigned) e `active -> revoked` (revoked). Append-only, RLS fechado, zero grants, insercao exclusivamente pela RPC na mesma transacao; falha e cancelamento nao geram evento.

Leitura para a interface:

- `get_hospital_team` ganhou `assigned_roles` (jsonb com `label`, `roleRef`, `canRevoke`), exposto SOMENTE a quem possui manage; o indicador `canRevoke` reflete as invariantes (self/ultimo admin) e e apenas orientacao de interface — a RPC revalida tudo. Nova RPC `get_hospital_assignable_roles(uuid)` (manage-only) devolve o catalogo hospitalar minimo (rotulo + referencia opaca).
- Server Action `changeMembershipRoleAction`: Zod estrito com apenas `membershipRef`, `roleRef` e `requestedAction`; hospital exclusivamente do contexto ativo revalidado; revalidacao somente em sucesso; mensagens genericas. Componente `TeamRoleControls`: select do catalogo (excluindo papeis ja ativos), confirmacao explicita inline e cancelamento sem mutacao.

Deferimentos registrados (nao bloqueiam o fechamento da Sprint 04):

- **Administracao de identidade e convites diferida para Sprint propria.** Convites, criacao de contas e recuperacao de senha exigem Supabase Admin API/service_role, secrets server-side novos e envio de e-mail — arquitetura privilegiada que nao sera improvisada no runtime normal. A aplicacao continua sem service_role e sem ler `auth.users`.
- **Vinculo de perfil ja existente ao hospital diferido.** Nao existe hoje mecanismo seguro de descoberta/selecao de perfis sob RLS (o proprio 04C.1 comprovou que hospital_admin nao le `organization_memberships`); qualquer atalho criaria pesquisa global por e-mail ou diretorio de usuarios, ampliando exposicao. Sera tratado junto da administracao de identidade.
- **Governanca visual avancada** (painel de leitura de auditoria, relatorios, workspaces por perfil, design system autenticado) permanece trilha futura; `canReadAudit` ja existe como capacidade para quando essa leitura for entregue.

Motivo: concluir funcionalmente a governanca da equipe hospitalar — listagem, status de vinculo e papeis — com um unico padrao de seguranca (referencias opacas, RPC-only, SECURITY DEFINER restrito, lock, invariantes e auditoria transacional), fechando todos os caminhos diretos de mutacao administrativa sem inventar arquitetura de identidade fora de decisao propria.
