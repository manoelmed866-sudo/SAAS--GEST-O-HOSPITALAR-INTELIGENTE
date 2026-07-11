# KNOWN_ISSUES.md

## Pendencias e pontos conhecidos

Este documento lista incertezas, pendencias e riscos conhecidos na Sprint 00. Nem todos representam erro; muitos sao decisoes futuras.

## Pendencias funcionais

- Definir quais fluxos entram na Primeira Versao Operacional.
- Definir perfis de usuario e permissoes por modulo.
- Definir quais eventos da jornada serao obrigatorios no primeiro ciclo funcional.
- Definir quais indicadores iniciais serao priorizados.
- Definir quais alertas serao configuraveis na Primeira Versao Operacional.
- Definir nivel de configuracao inicial dos formularios dinamicos.
- Definir como hospitais, unidades, setores e leitos serao modelados no banco em sprint futura.
- Definir escopo inicial do historico longitudinal na Primeira Versao Operacional.
- Definir quais eventos entram na linha do tempo do episodio.
- Definir filtros e buscas iniciais para historico, episodio e evolucoes.
- Definir comportamento de acoes ocultas ou bloqueadas por perfil.
- Detalhar quais itens da Visao Funcional Completa entram no primeiro recorte e quais permanecem planejados para versoes posteriores.

## Pendencias clinicas e institucionais

- Validar nomenclaturas clinicas com profissionais e instituicoes.
- Definir processo de aprovacao institucional de protocolos.
- Definir como excecoes e justificativas serao registradas.
- Definir governanca de alteracoes em protocolos e formularios.
- Definir criterios para diferenciar sugestao, orientacao institucional e decisao profissional na interface.
- Validar categorias profissionais autorizadas a registrar evolucoes.
- Validar tipos de evolucao por categoria profissional.
- Validar regras institucionais de rascunho, finalizacao, complementacao e retificacao.
- Validar regras de assinatura, validade, retencao e correcao com area juridica e institucional.
- Validar escopo de acesso nominal para direcao, gestao, qualidade, responsavel tecnico e auditoria.

## Pendencias tecnicas

- Escolher arquitetura tecnica nas sprints correspondentes.
- Definir stack final de frontend, backend, banco, autenticacao e hospedagem.
- Definir estrategia de testes.
- Definir estrategia de auditoria tecnica.
- Definir estrategia para anexos privados.
- Definir padrao de migracoes versionadas.
- Definir implementacao futura de matriz de acesso por funcao, hospital, unidade, setor e vinculo assistencial.
- Definir estrategia para impedir sobrescrita silenciosa de evolucoes finalizadas.
- Definir estrategia de auditoria para consultas sensiveis e exportacoes.

## Achados de seguranca em dependencias

### CVE-2026-41305 / GHSA-qx2v-qp2m-jg93

- Severidade: moderada.
- Pacote afetado: PostCSS abaixo de 8.5.10.
- Origem no projeto: dependencia privada/transitiva em `node_modules/next/node_modules/postcss`, incluida pelo Next.js 16.2.10.
- Estado atual: nao ha correcao estavel segura disponivel no conjunto de versoes utilizado nesta Sprint 01.
- A vulnerabilidade nao esta resolvida.
- E proibido executar `npm audit fix --force` para este achado, pois a correcao forçada tentaria instalar Next.js 9.3.3, causando downgrade incompativel e destrutivo.
- O risco atual e reduzido porque a Sprint 01 nao aceita CSS controlado por usuario e nao implementa modulos clinicos, APIs, banco, autenticacao ou hospedagem publica.
- O achado deve ser reavaliado a cada atualizacao estavel do Next.js.
- Homologacao publica ou producao ficam bloqueadas caso a vulnerabilidade continue sem mitigacao adequada.

## Aprofundamentos futuros de seguranca

Os topicos abaixo serao detalhados em sprints futuras e nao estao sendo implementados na Sprint 00:

- adequacao detalhada a LGPD;
- politica de retencao e descarte;
- criptografia em transito e em repouso;
- backup e restauracao;
- resposta a incidentes;
- segregacao entre desenvolvimento, homologacao e producao;
- revisao juridica e institucional.

## Riscos conhecidos

- Risco de confundir organizacao de protocolo com decisao clinica automatica.
- Risco de modelar hipotese como diagnostico confirmado.
- Risco de acoplamento excessivo entre regras institucionais e codigo.
- Risco de vazamento de dados caso isolamento institucional seja implementado de forma incompleta.
- Risco de a Primeira Versao Operacional ficar ampla demais e perder foco operacional.
- Risco de confundir Primeira Versao Operacional com limite funcional final do produto.
- Risco de confundir historico longitudinal com cadastro do paciente.
- Risco de confundir linha do tempo do episodio com evolucao assistencial.
- Risco de conceder acesso clinico indevido por nome de perfil.
- Risco de administrador receber acesso clinico automatico se a matriz de permissoes nao for implementada corretamente.
- Risco de evolucao finalizada ser sobrescrita caso complementacao e retificacao nao sejam modeladas adequadamente.

## Nao resolvido na Sprint 00

- Nenhum fluxo de produto foi implementado.
- Nenhuma tela foi criada.
- Nenhum banco foi criado.
- Nenhuma API foi criada.
- Nenhuma regra clinica especifica foi validada.
- Nenhuma regra juridica definitiva de assinatura, validade, retencao ou correcao foi aprovada.
- Nenhuma matriz de permissoes foi implementada.
- Nenhuma area de trabalho por perfil foi implementada.
