# SPRINT-03.md

## Sprint 03 - Autenticacao, instituicoes e permissoes

## Estado do documento

Sprint 03: Em execucao.

Sprint 03A: Concluida.

Sprint 03B: Concluida tecnicamente e versionada.

Sprint 03C: Concluida e validada localmente.

Sprint 03D: Em execucao. Sprint 03D1 concluida como checkpoint; Sprint 03D2, 03D3, 03D4 e 03D5 nao iniciadas.

Este documento registra o planejamento documental da Sprint 03, as implementacoes controladas das Sprints 03A, 03B e 03C e seus limites. A Sprint 03C criou fluxo visual de login/logout, protecao de rota e acesso negado, sem implementar Sprint 03D, APIs de negocio, novas tabelas, migracoes, usuarios, dados clinicos, dados reais ou Supabase remoto.

## Contexto

A Sprint 00 documentou a Visao Funcional Completa, a Sprint 01 criou a fundacao local da aplicacao e a Sprint 02 criou a fundacao local do banco e das migracoes.

A Sprint 03 devera usar essa base para planejar e, apenas apos novo gate de autorizacao, implementar autenticacao, instituicoes, hospitais, vinculos, papeis, permissoes, contexto institucional ativo, isolamento multi-hospital, RLS, protecao de rotas e auditoria minima de acesso.

## Objetivo

Planejar a fundacao de acesso seguro para uma plataforma SaaS multi-instituicao e multi-hospital, garantindo que nenhum usuario acesse dados apenas por conhecer identificadores e que toda autorizacao relevante seja validada no servidor e no banco.

## Nome canonico aprovado

- `organization` sera o nome tecnico e canonico no banco e no codigo.
- Instituicao sera o termo principal na interface e na documentacao voltada ao usuario.
- `organization` podera representar hospital isolado, rede hospitalar, clinica, organizacao de saude, orgao publico ou grupo empresarial.
- `hospital` continuara sendo entidade subordinada a `organization`.

## Escopo da Sprint 03

- Autenticacao com Supabase Auth.
- Perfil interno vinculado a `auth.users`.
- `organizations` como tenant principal.
- Hospitais pertencentes a uma `organization`.
- Vinculos institucionais e hospitalares.
- Papeis e permissoes iniciais.
- Convites institucionais.
- Confirmacao de e-mail no fluxo de convite.
- Selecao e validacao de contexto institucional ativo.
- Isolamento multi-hospital.
- RLS para tabelas institucionais.
- Protecao de rotas autenticadas.
- Auditoria minima de acesso.
- Testes pgTAP de RLS e testes de aplicacao.
- Documentacao de operacao local.

## Fora do escopo

- Pacientes.
- Episodios assistenciais.
- Historico longitudinal.
- Evolucoes assistenciais.
- Hipoteses ou diagnosticos.
- Protocolos funcionais.
- Exames.
- Medicamentos.
- Insumos.
- Estoque.
- Leitos.
- Indicadores.
- Alertas.
- Prescricao.
- Decisao clinica automatizada.
- Supabase remoto.
- Homologacao publica.
- Producao.
- Dados reais.
- Sprint 03D.

## Principios de seguranca

- Isolamento de dados por padrao.
- Negacao de acesso por padrao.
- Toda tabela institucional exposta ao cliente deve ter RLS habilitada.
- Nenhuma tabela acessivel pelo cliente pode ficar com RLS desabilitada.
- Identidade baseada em `auth.uid()`.
- `organization_id` ou `hospital_id` enviado pelo cliente nao prova autorizacao.
- Autorizacao deve ser validada no banco e no servidor, nao apenas na interface.
- Service role nunca pode ser usado no navegador.
- Nenhuma chave secreta pode usar prefixo `NEXT_PUBLIC_`.
- Administrador tecnico nao recebe acesso clinico automatico.
- Papel administrativo e acesso assistencial sao conceitos separados.
- Uma pessoa podera pertencer a mais de uma instituicao.
- Uma instituicao podera possuir um ou mais hospitais.
- Um usuario podera ter papeis diferentes em hospitais diferentes.
- Acoes sensiveis precisam de autoria e rastreabilidade.
- Nenhum dado real pode ser usado no desenvolvimento local.
- Nenhuma conexao com Supabase remoto nesta sprint.
- Nenhuma decisao clinica automatizada sera criada.

## Separacao de conceitos aprovada

Sao conceitos independentes:

- identidade;
- perfil;
- vinculo;
- papel;
- permissao;
- escopo;
- contexto ativo;
- acesso administrativo;
- acesso clinico.

Proibicoes:

- Nao usar booleano `is_admin` como autorizacao completa.
- Nao colocar acesso clinico implicito em papel administrativo.
- Nao confiar apenas em claims JWT.
- Nao confiar em IDs enviados pelo cliente.
- Nao tornar `platform_admin` membro de todos os tenants.
- Nao conceder permissoes por simples presenca em `profiles`.

## Modelo conceitual aprovado

### Identidade

- `auth.users`: fonte de identidade de autenticacao, gerenciada pelo Supabase Auth.
- `profiles`: perfil interno da aplicacao, com a mesma chave do usuario autenticado.
- Campos previstos: `id`, `display_name`, `status`, `created_at`, `updated_at`.
- `status` previsto: ativo, pendente, suspenso ou desativado.
- O perfil nao deve carregar permissao clinica por si so.

### Estrutura institucional

- `organizations`: tenant principal, usando Instituicao como termo de interface.
- `hospitals`: hospital pertencente a uma `organization`.
- Futuro: `units` e `sectors`, em sprint posterior.
- Campos previstos para `organization` e `hospital`: identificador estavel, nome, codigo institucional opcional, status, datas de criacao e atualizacao.
- Desativacao logica sera usada para `organizations`, `hospitals` e vinculos institucionais; exclusao fisica nao sera usada na primeira implementacao.

### Vinculos

Modelo aprovado: vinculos separados e hierarquicos.

- `organization_memberships`: vincula usuario a `organization`.
- `hospital_memberships`: vincula usuario a `hospital`.
- `hospital_membership` devera depender de hospital pertencente a mesma `organization` do vinculo institucional valido.
- Um usuario podera possuir multiplos vinculos.
- Papeis poderao variar por hospital.
- A perda ou desativacao do vinculo institucional devera invalidar os vinculos hospitalares dependentes.
- RLS devera validar todos os niveis de escopo.
- Nenhuma associacao sera confiada apenas ao cliente.

Motivo: o modelo separado e mais claro para RLS, reduz privilegios excessivos, facilita testes pgTAP e permite que o mesmo usuario tenha papeis diferentes em hospitais diferentes.

## Alternativas analisadas

### Opcao 1 - `organization_memberships` e `hospital_memberships` separadas

- Clareza: alta.
- Integridade referencial: alta.
- RLS: mais simples de auditar.
- Multiplos hospitais: suporte direto.
- Papeis diferentes por hospital: suporte direto.
- Risco de privilegio excessivo: menor, se o vinculo hospitalar nao herdar acesso clinico automaticamente.
- Testes pgTAP: mais objetivos.
- Ponto de atencao: exige cuidado para manter hospital pertencente a mesma organization do vinculo institucional.

### Opcao 2 - Tabela unica de memberships com escopo opcional

- Clareza: media.
- Integridade referencial: exige constraints mais complexas.
- RLS: maior risco de politicas ambiguas com `hospital_id` nulo.
- Multiplos hospitais: possivel, mas menos explicito.
- Papeis diferentes por hospital: possivel, mas mais facil de confundir.
- Risco de privilegio excessivo: maior, especialmente se escopo nulo for interpretado como acesso amplo.
- Testes pgTAP: mais casos de borda.

### Opcao 3 - Modelo hierarquico com tabelas separadas e dependencia explicita

- Clareza: alta.
- Integridade referencial: alta.
- RLS: clara quando cada tabela tem escopo proprio.
- Multiplos hospitais: suporte direto.
- Papeis diferentes por hospital: suporte direto.
- Manutencao futura: boa.
- Risco de privilegio excessivo: menor.
- Testes pgTAP: claros.

Decisao aprovada: Opcao 3, usando tabelas separadas com dependencia explicita entre vinculo institucional e vinculo hospitalar.

## Papeis, permissoes e escopos

Papel, permissao, escopo, vinculo, acesso clinico e acesso administrativo permanecem separados.

Papeis minimos aprovados para a primeira implementacao:

- `platform_admin`;
- `organization_admin`;
- `hospital_admin`;
- `auditor`;
- `member`.

Definicoes aprovadas:

- `platform_admin`: papel da plataforma; nao e membro automatico das organizations; nao possui acesso clinico automatico.
- `organization_admin`: administracao institucional limitada a propria organization; nao possui acesso clinico automatico.
- `hospital_admin`: administracao limitada ao hospital vinculado; nao possui acesso clinico automatico.
- `auditor`: somente leitura, com escopo explicito e sem acesso clinico automatico.
- `member`: vinculo institucional ou hospitalar basico, sem poderes administrativos por padrao; futuras funcoes clinicas ou operacionais dependerao de permissoes adicionais.

Nao serao adotados ainda como papeis definitivos:

- medico;
- enfermeiro;
- farmaceutico;
- profissional assistencial;
- gestor clinico;
- operador de estoque.

Esses papeis serao definidos junto aos modulos correspondentes.

Solucao recomendada para esta fase:

- `roles`: tabela relacional com papeis canonicos e escopo permitido.
- `permissions`: tabela relacional com permissoes atomicas.
- `role_permissions`: associacao entre papeis e permissoes.
- Constraints para limitar escopos validos.
- Evitar enum PostgreSQL para papeis nesta fase, pois papeis e permissoes ainda podem evoluir.
- Usar textos controlados por constraints ou tabelas de dominio para estados simples.

## Limites aprovados por papel

### `platform_admin`

Podera:

- Criar `organization`.
- Criar `hospital`.
- Vincular o primeiro `organization_admin`.
- Ativar ou suspender `organization` por motivos tecnicos ou contratuais.
- Administrar situacao contratual, configuracao tecnica e suporte.

Nao podera automaticamente:

- Acessar prontuarios.
- Acessar evolucoes.
- Acessar diagnosticos.
- Acessar exames.
- Acessar prescricoes.
- Acessar dados clinicos identificaveis.
- Ser tratado como membro automatico de todos os tenants.

### `organization_admin`

Podera:

- Visualizar a propria `organization`.
- Editar campos institucionais permitidos.
- Visualizar hospitais da propria `organization`.
- Editar campos operacionais permitidos.
- Gerenciar vinculos institucionais e hospitalares dentro do proprio tenant.
- Solicitar ou preparar criacao de novo hospital, sem persistir diretamente nesta fase.

Nao podera:

- Criar diretamente um hospital na primeira implementacao.
- Mover hospital entre organizations.
- Alterar identificadores estruturais.
- Excluir fisicamente `organization` ou `hospital`.
- Alterar situacao contratual da plataforma.
- Conceder `platform_admin`.
- Acessar dados de outra `organization`.
- Receber acesso clinico automatico.

### `hospital_admin`

Podera:

- Administrar somente o hospital ao qual esta vinculado.
- Gerenciar membros dentro das permissoes permitidas.

Nao podera:

- Criar novos hospitais.
- Alterar dados da `organization` fora do escopo hospitalar.
- Receber acesso clinico automatico.

### `auditor`

Papel inicial somente leitura.

Podera, dentro do escopo concedido:

- Visualizar `organization`.
- Visualizar `hospital`.
- Visualizar vinculos.
- Visualizar papeis.
- Visualizar permissoes.
- Visualizar logs de auditoria futuros.

Nao podera:

- Criar ou alterar registros.
- Gerenciar vinculos.
- Alterar papeis.
- Acessar dados clinicos automaticamente.
- Receber acesso clinico apenas por possuir papel de auditor.

Qualquer acesso clinico futuro exigira permissao clinica separada, escopo institucional explicito, finalidade registrada, autoria, data e hora, e trilha de auditoria.

## Convites institucionais aprovados

- Cadastro publico ficara bloqueado na primeira implementacao.
- Nao havera fluxo publico de criacao de conta.
- Usuarios somente poderao entrar por convite ou provisionamento administrativo.
- Qualquer cadastro publico futuro dependera de decisao especifica e nova revisao de seguranca.
- Convite institucional sera obrigatorio para usuarios comuns.
- O primeiro `organization_admin` sera vinculado pelo `platform_admin`.
- Convite devera estar associado a e-mail, `organization`, `hospital` quando aplicavel, papel, remetente, data de criacao, data de expiracao e estado.
- Convite devera ser de uso unico, revogavel, expiravel e auditavel.
- Convite aceito nao podera ser reutilizado.
- Nenhum convite podera conceder papel superior ao do emissor.
- Nesta etapa a decisao esta registrada apenas conceitualmente; nenhuma tabela de convite foi criada.

## Confirmacao de e-mail aprovada

- Confirmacao de e-mail sera obrigatoria no fluxo de convite.
- No ambiente local, o fluxo sera testado com o Mailpit fornecido pelo Supabase.
- Nenhuma confirmacao sera simulada com contas reais.
- Nenhuma configuracao remota sera criada nesta fase.
- O `platform_admin` inicial podera ser provisionado por procedimento administrativo seguro e documentado.

## Estrategia de autenticacao

Integracao planejada:

- `@supabase/supabase-js`.
- `@supabase/ssr`.
- Next.js 16 App Router.
- `createBrowserClient` para componentes cliente.
- `createServerClient` para servidor.
- Cookies gerenciados pelo fluxo SSR.
- `proxy.ts` para atualizacao segura de sessao.
- Login.
- Logout.
- Redirecionamento seguro.
- Protecao de rotas.
- Recuperacao de senha em planejamento.
- Confirmacao de e-mail obrigatoria no fluxo de convite.

Nao usar:

- `@supabase/auth-helpers-nextjs`.
- `middleware.ts` como nova implementacao.
- Armazenamento manual de JWT.
- `localStorage` para sessao SSR.
- Service role no cliente.
- Autenticacao simulada.

Fluxo inicial aprovado:

- Cadastro publico bloqueado.
- Login somente para usuarios previamente vinculados, convidados ou provisionados administrativamente.
- Convite institucional obrigatorio para usuarios comuns.
- Primeiro `organization_admin` vinculado por `platform_admin`.
- Recuperacao de senha planejada sem configuracao remota nesta etapa.

## Contexto institucional ativo

O usuario autenticado devera ter um contexto ativo composto por:

- `organization` ativa.
- `hospital` ativo, quando exigido pelo fluxo.
- Papel no contexto atual.
- Permissoes efetivas.

O contexto nao podera confiar apenas em:

- Query string.
- `localStorage`.
- Cookie editavel sem validacao.
- `hospital_id` enviado por formulario.

Armazenamento recomendado:

- Cookie SSR contendo apenas identificador de contexto selecionado ou referencia curta.
- Validacao obrigatoria no servidor e no banco contra vinculos reais.
- Recalculo de permissoes efetivas a partir dos vinculos ativos.

Regras planejadas:

- Se houver apenas um hospital disponivel, o sistema podera selecionar esse contexto apos validar o vinculo.
- Se houver multiplos hospitais, o usuario devera escolher um contexto.
- A troca de contexto deve invalidar dados carregados do contexto anterior.
- Se o usuario perder vinculo, o contexto deve ser recusado e o usuario redirecionado para selecao ou acesso negado.
- O banco deve bloquear acesso cruzado mesmo se a interface enviar identificador indevido.

## Estrategia de RLS

Diretrizes:

- Habilitar RLS explicitamente em todas as tabelas institucionais.
- Criar politicas separadas por operacao quando isso melhorar a clareza.
- Usar `WITH CHECK` em `INSERT` e `UPDATE`.
- Criar chaves estrangeiras e constraints antes de politicas.
- Criar indices para colunas usadas em politicas.
- Evitar politicas recursivas.
- Usar funcoes `security definer` apenas se indispensavel.
- Se houver funcao `security definer`, definir `search_path` seguro.
- Nao abrir permissoes para `anon`.

### Tabelas e comportamento conceitual

`profiles`:

- Select: proprio perfil; administradores autorizados dentro do escopo.
- Insert: preferencialmente criado por trigger controlada ou fluxo administrativo validado.
- Update: proprio perfil em campos seguros; administradores autorizados em campos administrativos.
- Delete: nao recomendado; usar status.
- Anonimo: negado.
- Autenticado sem vinculo: pode ver apenas o proprio perfil, se ativo.

`organizations`:

- Select: membros da organization; `platform_admin` para administracao contratual.
- Insert: `platform_admin`.
- Update: `platform_admin` ou `organization_admin` apenas em campos permitidos e dentro do escopo.
- Delete: nao permitido; usar desativacao logica.
- Anonimo: negado.
- Autenticado sem vinculo: negado.

`hospitals`:

- Select: membros institucionais ou hospitalares autorizados.
- Insert: `platform_admin` na primeira implementacao.
- Update: `organization_admin` ou `hospital_admin` conforme permissao e campos permitidos.
- Delete: nao permitido; usar desativacao logica.
- Anonimo: negado.
- Autenticado sem vinculo: negado.

`organization_memberships`:

- Select: proprio vinculo; administradores autorizados da organization; `platform_admin` para suporte.
- Insert: `platform_admin` ou `organization_admin` autorizado.
- Update: administrador autorizado, com `WITH CHECK` preservando escopo.
- Delete: nao recomendado; usar desativacao logica.
- Anonimo: negado.
- Autenticado sem vinculo: negado, exceto leitura do proprio estado quando necessario para UX.

`hospital_memberships`:

- Select: proprio vinculo; administradores institucionais/hospitalares autorizados.
- Insert: `organization_admin` ou `hospital_admin` autorizado, limitado ao hospital permitido.
- Update: administrador autorizado, com `WITH CHECK` impedindo troca de escopo.
- Delete: nao recomendado; usar desativacao logica.
- Anonimo: negado.
- Autenticado sem vinculo: negado.

`roles`, `permissions` e `role_permissions`:

- Select: usuarios autenticados vinculados podem consultar o necessario para montar a interface; administradores podem consultar matrizes completas do seu escopo.
- Insert/Update/Delete: restrito a `platform_admin` ou governanca institucional autorizada, conforme decisao futura.
- Anonimo: negado.

## Matriz conceitual de acesso

Legenda: Permitido, Negado, Condicionado, Fora do escopo atual.

| Perfil | Proprio perfil | Atualizar proprio perfil | Ver instituicao | Editar instituicao | Ver hospital | Editar hospital | Listar membros | Criar vinculo | Alterar papel | Remover vinculo | Trocar contexto | Dados clinicos futuros |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Anonimo | Negado | Negado | Negado | Negado | Negado | Negado | Negado | Negado | Negado | Negado | Negado | Fora do escopo atual |
| Autenticado sem vinculo | Condicionado | Condicionado | Negado | Negado | Negado | Negado | Negado | Negado | Negado | Negado | Negado | Negado |
| `member` institucional | Permitido | Condicionado | Permitido | Negado | Condicionado | Negado | Negado | Negado | Negado | Negado | Condicionado | Fora do escopo atual |
| `organization_admin` | Permitido | Condicionado | Permitido | Condicionado | Permitido | Condicionado | Permitido | Condicionado | Condicionado | Condicionado | Condicionado | Negado por padrao |
| `member` hospitalar | Permitido | Condicionado | Condicionado | Negado | Permitido | Negado | Negado | Negado | Negado | Negado | Condicionado | Fora do escopo atual |
| `hospital_admin` | Permitido | Condicionado | Condicionado | Negado | Permitido | Condicionado | Permitido | Condicionado | Condicionado | Condicionado | Condicionado | Negado por padrao |
| `auditor` | Permitido | Condicionado | Condicionado | Negado | Condicionado | Negado | Condicionado | Negado | Negado | Negado | Condicionado | Negado por padrao |
| `platform_admin` | Permitido | Condicionado | Permitido | Condicionado | Condicionado | Condicionado | Condicionado | Condicionado | Condicionado | Condicionado | Condicionado | Negado por padrao |

## Faseamento interno

### Sprint 03A - Modelo institucional e RLS

Objetivo: criar o modelo relacional institucional com RLS e testes de isolamento.

Arquivos previstos:

- Novas migracoes em `supabase/migrations/`.
- Novos testes SQL em `supabase/tests/`.
- Atualizacao futura de `src/types/database.types.ts` apos geracao validada.
- Documentacao da sprint.

Dependencias: Sprint 02 concluida, Docker Desktop disponivel, Supabase local operacional.

Riscos: RLS recursiva, privilegios amplos, constraints incompletas, testes usando privilegios elevados.

Criterios de aceite: migracoes aplicam, reset reconstroi o banco, RLS bloqueia anonimo e acesso cruzado, pgTAP passa, nenhum dado real.

Testes: pgTAP para anonimo, autenticado sem vinculo, membro de outro tenant, `organization_admin`, `hospital_admin`, `auditor` e falsificacao de escopo.

Condicoes de interrupcao: falha de RLS, necessidade de service role no cliente, criacao de tabela clinica, dado real ou segredo.

Proibicoes: modulo clinico, seed real, Supabase remoto, service role no navegador.

Gate: revisao da migracao e dos testes antes de seguir para cliente Supabase.

### Sprint 03B - Clientes Supabase e sessao SSR

Objetivo: preparar clientes Supabase para browser e servidor, variaveis de ambiente e atualizacao segura de sessao.

Arquivos previstos:

- Utilitarios em `src/lib/supabase/`.
- Validacao de ambiente publico e privado.
- `proxy.ts`.
- Testes de configuracao e sessao.

Dependencias: 03A aprovada.

Riscos: segredo com `NEXT_PUBLIC_`, sessao em `localStorage`, uso indevido de service role.

Criterios de aceite: clientes separados, cookies SSR, variaveis validadas, nenhuma chave privada exposta.

Testes: variaveis publicas e privadas, cliente browser sem segredo, cliente servidor com cookies.

Condicoes de interrupcao: dependencia ausente nao autorizada, segredo em arquivo versionado, token manual.

Proibicoes: `@supabase/auth-helpers-nextjs`, `middleware.ts` novo, service role cliente.

Gate: revisao de seguranca antes de login visual.

### Sprint 03C - Login, logout e rotas protegidas

Objetivo: implementar fluxo inicial de autenticacao e bloqueio de rotas.

Arquivos previstos:

- Rotas de login e logout.
- Pagina de acesso negado.
- Protecao de areas autenticadas.
- Testes unitarios e de integracao.

Dependencias: 03B aprovada.

Riscos: redirecionamento aberto, sessao expirada mal tratada, usuario sem vinculo acessando area interna.

Criterios de aceite: login valido, login invalido, logout, rota publica, rota protegida, sessao ausente e sessao expirada tratados.

Testes: login valido/invalido, logout, rota publica, rota protegida, redirecionamento seguro e confirmacao de e-mail via Mailpit local.

Condicoes de interrupcao: cadastro publico aberto sem decisao, autenticacao simulada, dados reais.

Proibicoes: API clinica, usuario real, bypass de RLS.

Gate: revisao de autenticacao antes de contexto ativo.

### Sprint 03D - Contexto ativo e area institucional minima

Objetivo: permitir selecao validada de organization/hospital e acesso inicial a area institucional minima.

Arquivos previstos:

- Seletor de contexto.
- Area institucional minima sem modulo clinico.
- Utilitarios de permissao efetiva.
- Testes de contexto.
- Documentacao final da sprint.

Dependencias: 03C aprovada.

Riscos: contexto obsoleto, troca de hospital sem invalidar dados, confiar em cookie sem validar no banco.

Criterios de aceite: usuario com um hospital entra no contexto valido, usuario com multiplos hospitais escolhe, usuario sem vinculo e bloqueado, perda de vinculo revoga acesso.

Testes: um hospital, multiplos hospitais, contexto invalido, remocao de vinculo, redirecionamento seguro.

Condicoes de interrupcao: acesso cruzado, tela exibindo dados de outro hospital, permissao excessiva.

Proibicoes: paciente, episodio, protocolo, exame, dado real.

Gate: auditoria final antes de encerrar Sprint 03.

## Migracoes futuras previstas

Ordem recomendada:

1. Tipos ou constraints indispensaveis para estados simples.
2. `profiles`.
3. `organizations`.
4. `hospitals`.
5. `roles`, `permissions` e `role_permissions`.
6. `organization_memberships`.
7. `hospital_memberships`.
8. Convites institucionais.
9. Funcoes auxiliares estritamente necessarias para RLS.
10. RLS habilitada explicitamente.
11. Politicas por tabela e operacao.
12. Indices para chaves estrangeiras e colunas usadas em politicas.
13. Triggers de `updated_at`, se justificadas.
14. Testes pgTAP.
15. Regeneracao de tipos TypeScript.

Evitar migracao gigantesca se a separacao melhorar auditoria, revisao e rollback.

## Estrategia de testes futura

### Banco e RLS

- Usuario anonimo sem acesso.
- Usuario autenticado sem vinculo sem acesso.
- Acesso permitido apenas ao proprio tenant.
- Bloqueio entre hospitais.
- Bloqueio entre organizations.
- Atualizacao proibida fora do escopo.
- `WITH CHECK` impedindo inserts indevidos.
- `organization_admin` limitado ao seu tenant.
- `hospital_admin` limitado ao seu hospital.
- `auditor` somente leitura.
- Remocao ou inativacao de vinculo revogando acesso.
- Tentativa de falsificar `organization_id`.
- Tentativa de falsificar `hospital_id`.
- Convite de uso unico, revogavel e expiravel.
- Convite sem permissao superior ao emissor.
- Testes sem depender de privilegios elevados que mascarem falhas.

### Aplicacao

- Login valido.
- Login invalido.
- Logout.
- Rota publica.
- Rota protegida.
- Sessao ausente.
- Sessao expirada.
- Usuario sem vinculo.
- Usuario com um hospital.
- Usuario com multiplos hospitais.
- Contexto invalido.
- Redirecionamento seguro.
- Confirmacao de e-mail via Mailpit local.
- Aliases TypeScript.
- Variaveis publicas e privadas.

## Riscos e mitigacoes

### Criticos

- Vazamento entre hospitais: RLS obrigatoria, testes cruzados e indices de escopo.
- Escalonamento de privilegio: permissoes atomicas, `WITH CHECK`, separacao entre papel e permissao.
- Service role exposta: proibir service role no cliente, validar ambiente e revisar diffs.
- Confianca indevida no cliente: validar contexto no servidor e no banco.
- Administrador tecnico com acesso clinico: separar administracao global de acesso assistencial.

### Altos

- Politicas RLS recursivas: preferir predicates simples e funcoes auxiliares auditadas apenas se indispensaveis.
- Criacao automatica de perfil inconsistente: trigger ou fluxo administrativo com constraints e testes.
- Usuario sem vinculo: redirecionar para estado bloqueado, sem acesso a areas internas.
- Perfil orfao: FK com `auth.users` e testes de consistencia.
- Perda de acesso durante sessao ativa: revalidar contexto a cada acesso sensivel.
- Contexto ativo obsoleto: invalidar cookie/referencia quando vinculo nao estiver ativo.
- Dependencia excessiva de claims JWT: usar claims apenas como apoio, nao como fonte unica de autorizacao.
- Testes com privilegios elevados mascarando falhas: simular roles `anon` e `authenticated` nos testes SQL.
- Convite concedendo papel acima do emissor: validar papel, escopo e emissor com RLS e constraints.

### Medios

- Convite expirado: registrar status e expiracao, bloquear uso tardio.
- Migracao irreversivel: separar migracoes e evitar transformacoes destrutivas.
- Configuracao local divergente do futuro remoto: documentar diferencas e validar antes de homologacao.
- Redirecionamento inseguro: allow-list de destinos internos.

### Baixos

- Usuario com muitos hospitais tendo experiencia confusa: seletor claro e contexto visivel.
- Mensagens de erro tecnicas: manter mensagens genericas para usuario final.
- Avisos externos de Git: registrar que estao fora do repositorio.

## Arquivos previstos para implementacao futura

- `supabase/migrations/*`.
- `supabase/tests/*`.
- `src/types/database.types.ts`.
- `src/lib/supabase/*`.
- `src/lib/auth/*`.
- `src/lib/permissions/*`.
- `src/app/(auth)/*`.
- `src/app/(authenticated)/*`.
- `src/app/acesso-negado/*`.
- `proxy.ts`.
- Testes em `tests/unit/` e, se necessario, `tests/integration/`.
- Documentacao da Sprint 03.

## Dependencias

- Sprint 00 concluida.
- Sprint 01 concluida.
- Sprint 02 concluida.
- Branch `sprint/03-autenticacao-instituicoes-permissoes`.
- Docker Desktop disponivel apenas quando a implementacao de banco for autorizada.
- Supabase local da Sprint 02.
- Supabase CLI 2.109.1.
- Autorizacao explicita antes de instalar `@supabase/supabase-js` e `@supabase/ssr`, se ainda ausentes.

## Implementacao escrita da Sprint 03A

### Estado

- Modelo institucional escrito em migracoes versionadas.
- RLS, grants e funcoes privadas escritos em migracoes versionadas.
- Testes pgTAP escritos e aprovados na validacao local controlada.
- Validacao local da Sprint 03A concluida.
- Docker Desktop 29.6.1 operacional durante a validacao.
- Docker Compose 5.2.0 operacional durante a validacao.
- Supabase CLI 2.109.1 utilizada como devDependency exata.
- Supabase local iniciado, consultado e encerrado apos a validacao.
- Migracoes da Sprint 03A aplicadas e reconstruidas por reset local.
- Testes SQL executados e aprovados.
- `src/types/database.types.ts` regenerado pela Supabase CLI.
- Nenhuma migracao foi alterada apos a primeira validacao local.

### Schema privado

- Criado schema privado `app_private`.
- O schema nao deve ser exposto pela Data API.
- Nenhuma tabela foi criada em `app_private`.
- Criada funcao tecnica `app_private.set_updated_at()` para triggers `updated_at`.
- Criadas funcoes booleanas privadas de autorizacao:
  - `current_profile_is_active()`;
  - `current_user_is_platform_admin()`;
  - `current_user_has_organization_permission(uuid, text)`;
  - `current_user_has_hospital_permission(uuid, text)`;
  - `current_user_can_view_profile(uuid)`.

### Tabelas criadas

Foram escritas migracoes para criar somente:

1. `public.profiles`;
2. `public.organizations`;
3. `public.hospitals`;
4. `public.roles`;
5. `public.permissions`;
6. `public.role_permissions`;
7. `public.platform_role_assignments`;
8. `public.organization_memberships`;
9. `public.organization_membership_roles`;
10. `public.hospital_memberships`;
11. `public.hospital_membership_roles`.

Nenhuma tabela clinica, convite, contexto ativo, auditoria, paciente, episodio, protocolo, exame, medicamento, estoque, setor, faturamento ou assinatura foi criada.

### Estados canonicos implementados

- `profiles.status`: `pending`, `active`, `suspended`, `deactivated`.
- `organizations.status`: `active`, `suspended`, `inactive`.
- `hospitals.status`: `active`, `suspended`, `inactive`.
- `organization_memberships.status`: `pending`, `active`, `suspended`, `revoked`.
- `hospital_memberships.status`: `pending`, `active`, `suspended`, `revoked`.
- Atribuicoes de papel: `active`, `revoked`.

Todos foram modelados com `text` e `CHECK constraints`, sem enums PostgreSQL.

### Papeis e permissoes estruturais

Papeis estruturais inseridos por migracao:

- `platform.platform_admin`;
- `organization.organization_admin`;
- `organization.auditor`;
- `organization.member`;
- `hospital.hospital_admin`;
- `hospital.auditor`;
- `hospital.member`.

Permissoes estruturais inseridas por migracao:

- Platform: `organizations.read`, `organizations.create`, `organizations.update`, `hospitals.read`, `hospitals.create`, `hospitals.update`, `platform_assignments.read`.
- Organization: `organization.read`, `hospitals.read`, `organization_memberships.read`, `organization_memberships.manage`, `hospital_memberships.read`, `hospital_memberships.manage`, `audit.read`, `context.switch`.
- Hospital: `hospital.read`, `hospital_memberships.read`, `hospital_memberships.manage`, `audit.read`, `context.switch`.

O mapeamento `role_permissions` foi escrito como dado estrutural da aplicacao, em migracao, sem usar `seed.sql`.

Nenhum `platform_admin`, usuario inicial, organization, hospital ou membership real/ficticio foi inserido por migracao.

### RLS e grants escritos

- RLS habilitada explicitamente nas 11 tabelas publicas da Sprint 03A.
- Nenhuma politica foi criada para `anon`.
- Grants de `anon` foram revogados nas tabelas da Sprint 03A.
- `authenticated` recebeu grants explicitos e minimos.
- `profiles` permite `UPDATE` somente na coluna `display_name`.
- Tabelas de memberships e atribuicoes permitem `UPDATE` somente em colunas de estado/revogacao necessarias.
- Nenhum `DELETE` foi concedido.
- Politicas foram separadas por operacao.
- Politicas de `INSERT` e `UPDATE` possuem `WITH CHECK`.

### Indices escritos

Foram escritos indices para foreign keys, colunas de escopo, `user_id`, `organization_id`, `hospital_id`, memberships, atribuicoes de papel e combinacoes de `status` usadas pelas funcoes de autorizacao e RLS.

### Migracoes criadas

- `supabase/migrations/20260712010000_sprint_03a_identity_institutional_model.sql`;
- `supabase/migrations/20260712010100_sprint_03a_roles_permissions_mappings.sql`;
- `supabase/migrations/20260712010200_sprint_03a_private_authorization_functions.sql`;
- `supabase/migrations/20260712010300_sprint_03a_rls_policies_grants.sql`.

### Testes pgTAP criados

- `supabase/tests/001-sprint-03a-structure.test.sql`;
- `supabase/tests/002-sprint-03a-integrity.test.sql`;
- `supabase/tests/003-sprint-03a-rls.test.sql`.

Os testes foram escritos com transacao, plano explicito, dados ficticios transacionais e `rollback`. A validacao local final aprovou 4 arquivos SQL e 70 verificacoes pgTAP.

### Validacao local concluida

Resultado final confirmado da validacao local da Sprint 03A:

- Docker Desktop 29.6.1 operacional.
- Docker Compose 5.2.0 operacional.
- Supabase CLI 2.109.1 instalada como devDependency exata.
- Supabase local iniciado com sucesso.
- Status local consultado sem registrar chaves, tokens, senhas ou connection strings no repositorio.
- Quatro migracoes da Sprint 03A aplicadas.
- Reset local aprovado.
- Seed vazio executado sem inserir registros.
- Lint SQL aprovado para os schemas `app_private`, `extensions` e `public`.
- 4 arquivos SQL executados.
- 70 verificacoes pgTAP aprovadas.
- `src/types/database.types.ts` regenerado pela Supabase CLI.
- Typecheck aprovado.
- Lint da aplicacao aprovado.
- 6 arquivos de testes da aplicacao aprovados.
- 14 testes da aplicacao aprovados.
- Build aprovado.
- Check completo aprovado.
- Supabase local encerrado apos a validacao.
- `docker ps` validado sem conteineres em execucao.
- Nenhuma tabela de dominio clinico criada.
- Nenhum dado inserido.
- Nenhum dado real utilizado.
- Nenhum projeto remoto vinculado.
- Nenhuma chave ou credencial versionada.
- Vulnerabilidade moderada transitiva ja conhecida de PostCSS permanece acompanhada em `KNOWN_ISSUES.md`, sem nova vulnerabilidade alta ou critica registrada.

### Primeira validacao local da Sprint 03A

Resultado confirmado da primeira validacao local:

- `db:reset` aprovado.
- Quatro migracoes da Sprint 03A aplicadas.
- `db:lint` aprovado.
- Teste estrutural `001-sprint-03a-structure.test.sql` aprovado.
- Teste `000-baseline.test.sql` falhou por pressupostos obsoletos da Sprint 02 sobre banco vazio.
- Teste `002-sprint-03a-integrity.test.sql` falhou por uso incorreto da assinatura de `throws_ok`.
- Teste `003-sprint-03a-rls.test.sql` falhou por uso incorreto de `throws_ok`, por CTE modificadora aninhada invalida e por fixture que concedia permissao institucional adicional ao usuario `hospital_admin`.
- Resultado total da primeira execucao: FAIL, por falhas nos testes e pressupostos de baseline, sem indicar problema estrutural nas migracoes.

Correcoes preparadas:

- Teste 000 reformulado para validar ausencia de tabelas clinicas/demonstrativas proibidas, ausencia de dados de negocio e ausencia de atribuicao automatica de `platform_admin`.
- Teste 002 ajustado para usar `throws_ok(sql, SQLSTATE, null, descricao)` com SQLSTATEs `23503`, `23505` e `23514`.
- Teste 003 ajustado para usar `throws_ok(sql, '42501', null, descricao)` nas operacoes bloqueadas.
- CTE modificadora aninhada removida do teste RLS.
- Fixture do `hospital_admin` ajustada para manter organization membership ativo sem papel institucional com `hospitals.read`, preservando a expectativa de visualizar apenas 1 hospital. Essa fixture e exclusivamente de teste pgTAP e nao representa dado real, dado semeado ou regra de RLS.

Apos as correcoes, nova validacao local foi executada e aprovada: `db:reset`, `db:lint`, `db:test`, geracao de tipos, lint, typecheck, testes da aplicacao, build e check completo passaram.

### Limites preservados apos a Sprint 03A

Permanecem nao implementados e reservados para as proximas fases da Sprint 03:

- Sprint 03C: login, logout, rotas protegidas e fluxo visual de autenticacao.
- Sprint 03D: contexto institucional ativo e area institucional minima.

Tambem permanecem fora da Sprint 03A:

- APIs funcionais.
- Telas autenticadas.
- Autenticacao visual.
- Convites institucionais persistidos.
- Auditoria funcional de acesso.
- Modulos clinicos.
- Pacientes, episodios, protocolos, exames, prescricoes, estoque ou faturamento.
- Dados reais.
- Vinculo com projeto Supabase remoto.

## Implementacao da Sprint 03B

### Estado

- Sprint 03 permanece em execucao.
- Sprint 03A permanece concluida.
- Sprint 03B esta em validacao tecnica.
- Sprint 03C permanece nao iniciada.
- Sprint 03D permanece nao iniciada.

Esta fase cria somente a infraestrutura tecnica para Supabase SSR, validacao publica de ambiente, clientes tipados, cookies e Proxy de renovacao de sessao. Login, logout, protecao de rotas, redirecionamentos, convites, usuarios, contexto ativo, APIs de negocio, novas tabelas e novas migracoes permanecem fora desta etapa.

### Dependencias instaladas

- `@supabase/supabase-js` em versao exata `2.110.2`.
- `@supabase/ssr` em versao exata `0.12.0`.

As versoes exatas ficam registradas em `package.json` e `package-lock.json`. `@supabase/auth-helpers-nextjs`, bibliotecas de UI de autenticacao, ORM, bibliotecas adicionais de cookies, estado global, formularios ou autenticacao alternativa nao foram adotadas.

### Variaveis publicas adotadas

A Sprint 03B adota somente:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Nao sao adotadas variaveis de service role, secret key, senha de banco, JWT secret, connection string, access key de Storage ou secret key de Storage.

Foi criado `.env.example` apenas com placeholders seguros. `.env.local` nao foi criado e nao deve ser versionado. Nenhuma chave real deve ser copiada de `supabase status` para documentacao, codigo ou commit.

### Arquivos criados

- `.env.example`;
- `src/lib/env/public.ts`;
- `src/lib/supabase/client.ts`;
- `src/lib/supabase/server.ts`;
- `src/lib/supabase/proxy.ts`;
- `src/proxy.ts`;
- testes unitarios da Sprint 03B para ambiente, cliente browser, cliente server, Proxy e revisao estatica de seguranca.

### Validacao de ambiente

`src/lib/env/public.ts` usa Zod para validar as variaveis publicas do Supabase apenas quando a funcao e chamada. A validacao:

- aceita URL valida;
- exige chave publicavel nao vazia;
- rejeita chave privada com prefixo reservado;
- rejeita valor que indique service role;
- retorna objeto imutavel e tipado;
- produz erro claro sem imprimir o valor recebido;
- nao acessa variaveis privadas;
- nao falha no carregamento do modulo.

Essa estrategia permite lint, typecheck, testes e build sem `.env.local`, desde que clientes Supabase nao sejam chamados durante geracao estatica.

### Cliente do navegador

`src/lib/supabase/client.ts` exporta `createClient()` usando `createBrowserClient` de `@supabase/ssr`, tipos `Database` gerados em `src/types/database.types.ts` e variaveis validadas por `getPublicEnv()`.

O cliente do navegador:

- nao usa service role;
- nao manipula JWT manualmente;
- nao acessa `localStorage` diretamente;
- nao implementa login;
- nao implementa redirecionamento;
- nao cria cliente durante import do modulo.

### Cliente do servidor

`src/lib/supabase/server.ts` exporta `async createClient()` usando `createServerClient` de `@supabase/ssr`, tipos `Database`, `cookies()` de `next/headers`, `getAll` para leitura e `setAll` para escrita quando o contexto permitir.

Server Components podem ter cookies somente leitura; nesse caso, apenas o erro esperado de escrita e tratado. Erros desconhecidos continuam sendo propagados. O Proxy fica responsavel pela renovacao regular da sessao.

O cliente do servidor:

- nao usa chave privada;
- nao chama autenticacao automaticamente;
- nao chama `getSession`;
- nao decide autorizacao;
- nao consulta `profiles`, memberships ou qualquer tabela institucional;
- nao reutiliza cliente global entre requisicoes.

### Atualizacao de sessao no Proxy

`src/lib/supabase/proxy.ts` exporta `updateSession(request)`.

O Proxy:

- valida as variaveis publicas;
- cria resposta inicial com `NextResponse.next()`;
- cria cliente SSR tipado;
- le cookies da requisicao;
- aplica cookies retornados pelo Supabase na requisicao e na resposta;
- copia headers retornados pelo Supabase;
- chama `supabase.auth.getClaims()`;
- retorna a resposta final.

O Proxy nao usa `getSession`, nao confia no conteudo bruto do cookie, nao consulta tabelas institucionais, nao redireciona, nao define rota publica ou protegida, nao implementa autorizacao, nao registra cookies, nao registra claims e nao apaga cookies externos ao Supabase.

### Proxy do Next.js

`src/proxy.ts` exporta a funcao nomeada `proxy(request)` e delega exclusivamente para `updateSession(request)`.

Nao foi criado `middleware.ts`. O matcher exclui ativos estaticos essenciais como `_next/static`, `_next/image`, `favicon.ico`, `robots.txt`, `sitemap.xml` e arquivos comuns de imagem ou assets, sem excluir prematuramente paginas futuras de login ou areas internas.

### Limites preservados na Sprint 03B

- Protecao de rotas fica reservada para Sprint 03C.
- Login visual fica reservado para Sprint 03C.
- Logout fica reservado para Sprint 03C.
- Pagina de acesso negado fica reservada para Sprint 03C.
- Contexto institucional ativo fica reservado para Sprint 03D.
- Seletor de hospital ou organization fica reservado para Sprint 03D.
- Nenhuma API, Route Handler ou Server Action de negocio foi criada.
- Nenhuma nova tabela ou migracao foi criada.
- RLS, grants, papeis e permissoes nao foram alterados.
- `src/types/database.types.ts` nao deve ser alterado manualmente nesta fase.

### Validacao da Sprint 03B

A implementacao escrita da Sprint 03B foi auditada tecnicamente e validada por:

- lint aprovado;
- typecheck aprovado;
- 11 arquivos de testes unitarios aprovados;
- 43 testes aprovados;
- build aprovado sem `.env.local`;
- check completo aprovado;
- `npm audit --omit=dev` e `npm audit` executados sem vulnerabilidade alta ou critica nova;
- auditorias npm retornaram apenas a vulnerabilidade moderada ja conhecida de PostCSS via Next.js;
- revisao estatica confirmou ausencia de `getSession` nos arquivos de codigo da Sprint 03B;
- revisao estatica confirmou uso de `getClaims` no Proxy;
- revisao estatica confirmou ausencia de redirect;
- revisao estatica confirmou ausencia de login funcional;
- revisao estatica confirmou ausencia de dados reais, segredos e credenciais;
- revisao confirmou ausencia de Docker, Supabase local, migracoes, testes SQL e geracao de tipos nesta etapa de auditoria.

A Sprint 03B permanece sem autenticar usuarios, sem proteger rotas e sem definir contexto ativo. A Sprint 03C e a Sprint 03D permanecem nao iniciadas.

## Implementacao da Sprint 03C

### Estado

- Sprint 03 permanece em execucao.
- Sprint 03A permanece concluida.
- Sprint 03B permanece concluida tecnicamente e versionada.
- Sprint 03C foi implementada e esta pronta para validacao local.
- Sprint 03D permanece nao iniciada.

Esta fase implementa exclusivamente login, logout, validacao segura de usuario, protecao de rota, redirecionamento seguro e pagina de acesso negado. Nao cria contexto institucional ativo, selecao de instituicao, selecao de hospital, convites, cadastro publico, recuperacao de senha, confirmacao de e-mail funcional, MFA, APIs de negocio, novas tabelas, novas migracoes, trigger em `auth.users`, usuarios, dados reais ou vinculo com Supabase remoto.

### Rotas criadas

- `/login`: rota publica de entrada para contas previamente provisionadas ou vinculadas.
- `/painel`: rota protegida inicial.
- `/acesso-negado`: rota publica para usuario autenticado sem vinculo ativo autorizado.

As rotas foram organizadas em route groups:

- `src/app/(auth)/login/`;
- `src/app/(auth)/acesso-negado/`;
- `src/app/(protected)/painel/`.

### Acoes de autenticacao

- `loginAction` valida e-mail, senha e destino de retorno com Zod.
- E-mail e normalizado para minusculas antes de chamar `signInWithPassword`.
- Erros de credenciais retornam mensagem generica, sem expor detalhe interno do Supabase.
- `logoutAction` valida usuario atual com `getUser()` antes de chamar `signOut({ scope: "local" })`.
- Nao ha cadastro publico, recuperacao de senha, convite, criacao de perfil, trigger em `auth.users` ou uso de `getSession()`.

### Redirecionamento seguro

- `src/lib/auth/redirects.ts` restringe `next` a `/painel` e subcaminhos de `/painel`.
- URLs externas, caminhos relativos inseguros, `//`, barras invertidas, `/login` e `/acesso-negado` retornam para `/painel`.
- O Proxy redireciona usuario anonimo de `/painel` para `/login?next=%2Fpainel`.
- O Proxy redireciona usuario ja autenticado que acessar `/login` para `/painel`.

### Validacao de acesso ao painel

`src/lib/auth/access.ts` valida no servidor:

- usuario autenticado por `supabase.auth.getUser()`;
- `profiles.status = active`;
- papel ativo de plataforma, ou vinculo institucional ativo com papel ativo, ou vinculo hospitalar ativo com papel ativo.

Resultado sem usuario redireciona para login. Resultado sem vinculo ativo redireciona para `/acesso-negado`. Falha inesperada retorna erro generico. A validacao nao seleciona instituicao, nao seleciona hospital, nao grava cookie de contexto ativo e nao expõe identificadores institucionais para a tela.

### Proxy apos Sprint 03C

`src/lib/supabase/proxy.ts` passou a expor `refreshSession(request)`, mantendo `updateSession(request)` para compatibilidade. A renovacao continua usando `getClaims()` e cookies SSR, sem `getSession()` e sem consultas a tabelas institucionais no Proxy.

`src/proxy.ts` passou a usar os claims apenas para distinguir presenca de sessao no redirecionamento inicial. A autorizacao institucional continua no servidor, em `requirePortalAccess()`, e no banco por RLS.

### Limites preservados na Sprint 03C

- Sprint 03D nao foi iniciada.
- Nenhum contexto institucional ativo foi implementado.
- Nenhum seletor de instituicao ou hospital foi criado.
- Nenhuma tabela, migracao, RLS, grant, papel, permissao ou tipo gerado foi alterado.
- Nenhuma dependencia foi instalada, removida ou atualizada.
- Nenhum `.env.local` foi criado.
- Nenhum segredo, token, senha, connection string completa ou dado real foi adicionado.
- Nenhuma API, Route Handler de negocio ou modulo clinico foi criado.
- Nenhum dado de paciente, episodio, evolucao, protocolo, exame, medicamento, estoque, leito ou faturamento foi criado.

### Validacao preparada da Sprint 03C

A implementacao local ja possui cobertura para:

- normalizacao segura de `next`;
- login com `signInWithPassword`;
- logout local com `signOut({ scope: "local" })`;
- bloqueio de uso de `getSession`;
- ausencia de cadastro publico e recuperacao de senha;
- rota protegida anonima redirecionando para login;
- login autenticado redirecionando para painel;
- preservacao de cookies renovados no redirecionamento;
- validacao de perfil ativo e vinculo ativo;
- acesso negado generico para usuario autenticado sem vinculo;
- painel sem contexto institucional ativo.

Resultados tecnicos desta implementacao deverao ser confirmados na validacao final da Sprint 03C.

### Validacao final e correcao da Sprint 03C

Estado: Sprint 03C concluida e validada localmente. Sprint 03D permanece nao iniciada.

Defeito encontrado na validacao local:

- O gate hospitalar em `src/lib/auth/access.ts` embutia `organizations!inner(id, status)` dentro de `organization_memberships` e filtrava `organization_memberships.organizations.status`.
- A tabela `public.organizations` so libera `SELECT` para `platform_admin` ou para quem tem permissao de escopo organizacao `organization.read`.
- Um usuario com vinculo hospitalar valido, mas sem papel organizacional, nao possui essa permissao; o RLS negava a linha de `organizations` e, por ser join interno, o vinculo hospitalar inteiro era descartado.
- Resultado: usuario hospital-only autenticado, com profile ativo, organization membership ativo, hospital membership ativo e papel `hospital`/`member` ativo, era redirecionado indevidamente para `/acesso-negado`.

Correcao aplicada, sem ampliar permissoes:

- Removido apenas o embed `organizations!inner` da consulta hospitalar.
- Removido apenas o filtro `organization_memberships.organizations.status`.
- Preservada a ordem dos gates `platform`, `organization` e `hospital`.
- Nenhuma politica RLS, grant, papel, permissao, migracao existente ou banco foi alterado.
- A exigencia de organization ativa permanece garantida de forma transitiva pela funcao privada `current_user_has_hospital_permission`, que ja valida organization e hospital ativos ao autorizar a leitura de `hospitals`.

Decisao registrada em `DECISIONS.md` como DEC-048.

Investigacao com diagnostico temporario:

- Foi adicionado diagnostico temporario e seguro em `src/lib/auth/access.ts`, registrando por gate apenas `code`, `message`, `details` e `hint` do erro, sem cookies, tokens, JWT, sessao, UUID, e-mail ou dados pessoais.
- Apos a confirmacao da validacao manual, o diagnostico temporario foi removido integralmente e nao permaneceu no codigo final.

Testes ajustados e adicionados:

- `tests/unit/auth-access.test.ts` ajustado para o novo formato da consulta, com comentario esclarecendo que a suite cobre a logica de gates e nao o comportamento real do RLS.
- `supabase/tests/004-sprint-03c-hospital-access.test.sql` adicionado como regressao para usuario hospital-only sem papel organizacional, validando acesso hospitalar liberado sob RLS como `authenticated`, trava de regressao do embed de organizations e bloqueio por organization suspensa.

Higienizacao de residuos:

- Removida a pasta local `supabase/snippets/`, gerada pelo Supabase Studio, contendo apenas uma consulta ad hoc com e-mails ficticios `@example.test`, sem senhas, tokens, chaves, JWT ou service role. A pasta nao estava versionada.

Validacao manual end-to-end aprovada:

- Usuario hospital-only autenticado por e-mail e senha.
- URL final `/painel`, sem redirecionamento para `/acesso-negado` e sem tela de erro.
- Bloqueio por profile inativo, bloqueio por vinculo invalido, acesso institucional valido e acesso hospitalar valido confirmados, todos apoiados por RLS no banco.

Resultado tecnico confirmado da Sprint 03C:

- Lint aprovado.
- Typecheck aprovado.
- 76 testes unitarios aprovados.
- Build aprovado.
- `db:lint` aprovado.
- 73 verificacoes pgTAP aprovadas em banco local reconstruido por `db:reset`.
- `git diff --check` sem erros de espaco em branco ou conflito.
- Confirmado que as migracoes existentes nao foram alteradas.
- Confirmado que `.env.local` permanece ignorado e que nenhum segredo, token, JWT, service role, senha ou URL com credencial foi versionado.
- Confirmado que nenhum usuario ficticio ou dado de validacao permanente foi versionado; o `seed.sql` continua vazio e as fixtures pgTAP sao transacionais com `rollback`.
- Vulnerabilidade moderada transitiva ja conhecida de PostCSS via Next.js permanece acompanhada em `KNOWN_ISSUES.md`; `npm audit fix --force` permanece proibido por causar downgrade forcado do Next.js.

### Implementacao e validacao da Sprint 03D1 - Inventario de acessos

Estado: Sprint 03D1 concluida como checkpoint independente. Sprint 03D2, 03D3, 03D4 e 03D5 permanecem nao iniciadas.

Escopo entregue:

- Criada a camada server-side de inventario em `src/lib/auth/context.ts`, funcao `getAuthorizedContextInventory`, que lista as organizations e hospitals ativos e autorizados ao usuario atual.
- Nenhuma UI, nenhum seletor, nenhuma persistencia de contexto e nenhum papel ativo resolvido nesta etapa. Papeis ficam reservados para a revalidacao de contexto das etapas 03D3 e 03D4, evitando joins adicionais e duplicacao da autorizacao.

Arquitetura e seguranca:

- O RLS da Sprint 03A e o filtro definitivo. As consultas selecionam apenas `status = 'active'` e delegam a autorizacao ao banco, sem reconstruir joins de permissao no TypeScript.
- Opcao A sem migration: nenhuma migration, politica RLS, grant, papel ou permissao foi criada ou alterada.
- Uso exclusivo do cliente Supabase server-side autenticado, sem service role.
- Consultas com campos explicitos, sem `select("*")`, com ordenacao deterministica por `display_name` e depois `id`.
- Usuario hospital-only sem papel organizacional pode receber `organizations` vazio e `hospitals` preenchido, refletindo o menor privilegio ja garantido pelo RLS.

Contrato de retorno:

- Sucesso: `{ status: "success", inventory: { organizations, hospitals, hospitalCount } }`, com `hospitalCount` igual a `hospitals.length`.
- Erro em qualquer consulta: `{ status: "error" }`, sem dados parciais e sem converter erro em inventario vazio.
- Inventario vazio legitimo retorna `success` com listas vazias e `hospitalCount` zero.
- Decisao registrada em `DECISIONS.md` como DEC-049.

Testes adicionados:

- `tests/unit/auth-context.test.ts`: Supabase mockado, cobre normalizacao snake_case para camelCase, conversao de `organization_id` para `organizationId`, derivacao de `hospitalCount`, organizations vazio com hospitals preenchido, inventario totalmente vazio e fail-closed em erro. A suite nao valida RLS.
- `supabase/tests/005-sprint-03d-context-inventory.test.sql`: sob `authenticated`, transacional com `rollback`, cobrindo usuario institucional, papel organizacional visualizando hospitais da organizacao, usuario hospital-only sem leitura de organizations, usuario multi-hospital, hospital suspenso, organization suspensa, hospital de outro tenant e vinculo hospitalar revogado.

Resultado tecnico confirmado da Sprint 03D1:

- Lint aprovado.
- Typecheck aprovado.
- 84 testes unitarios aprovados.
- Build aprovado.
- `db:lint` aprovado.
- 83 verificacoes pgTAP aprovadas.
- `git diff --check` sem erros de espaco em branco ou conflito.
- Confirmado que nenhuma migration, RLS, grant, papel ou permissao foi alterada.
- Confirmado que `.env.local` permanece ignorado e que nenhuma chave, token, JWT, service role, senha ou URL com credencial foi versionada, incluindo qualquer saida do `db:start`.

## Decisoes aprovadas incorporadas

- Nome canonico tecnico: `organization`.
- Termo principal para usuario: Instituicao.
- `organization` representa hospital isolado, rede hospitalar, clinica, organizacao de saude, orgao publico ou grupo empresarial.
- Cadastro publico bloqueado na primeira implementacao.
- Usuarios comuns entram por convite institucional.
- Primeiro `organization_admin` vinculado por `platform_admin`.
- Convite com e-mail, organization, hospital quando aplicavel, papel, remetente, criacao, expiracao e estado.
- Convite de uso unico, revogavel, expiravel e auditavel.
- Confirmacao de e-mail obrigatoria no fluxo de convite.
- Mailpit local para testes de e-mail.
- `platform_admin`, `organization_admin`, `hospital_admin`, `auditor` e `member` como papeis minimos.
- Auditor inicial somente leitura.
- Desativacao logica para organizations, hospitals e vinculos.
- Conceitos de identidade, perfil, vinculo, papel, permissao, escopo, contexto ativo, acesso administrativo e acesso clinico separados.
- Modelo de vinculos com `organization_memberships` e `hospital_memberships` separados.

## Questoes ainda abertas para implementacao tecnica futura

- Definir procedimento administrativo seguro para provisionar o primeiro `platform_admin`.
- Definir persistencia e regras completas de convites institucionais.
- Definir clientes Supabase SSR e browser na Sprint 03B.
- Validar tecnicamente o fluxo visual de login e logout implementado na Sprint 03C.
- Definir selecao e validacao de contexto ativo na Sprint 03D.
- Definir formato minimo dos logs de auditoria funcional em etapa autorizada.

## Gate apos Sprint 03A

A Sprint 03A esta tecnicamente validada e encerrada documentalmente, mas a Sprint 03 permanece em execucao. Nenhuma fase seguinte deve iniciar sem autorizacao explicita de Manoel Neto.

Antes de iniciar Sprint 03B, confirmar:

- Proibicao de dados reais.
- Proibicao de Supabase remoto.
- Proibicao de `supabase login`.
- Proibicao de `supabase link`.
- Proibicao de expor service role no cliente.
- Proibicao de criar modulo clinico.
- Manutencao da Sprint 03B restrita a clientes Supabase, sessao SSR, proxy e configuracao segura.
