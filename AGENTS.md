# AGENTS.md

## Regras permanentes para agentes do projeto

Este arquivo define regras obrigatorias para qualquer agente humano ou de IA que trabalhe na Plataforma de Inteligencia Hospitalar.

## Antes de alterar arquivos

- Ler a documentacao permanente do projeto antes de qualquer alteracao.
- Conferir o escopo da sprint atual em `SPRINT_STATUS.md` e no documento correspondente em `docs/sprints/`.
- Nao trabalhar fora do escopo aprovado para a sprint.
- Nao fazer commits sem autorizacao explicita de Manoel Neto.
- Registrar decisoes relevantes em `DECISIONS.md`.
- Atualizar a documentacao sempre que houver mudanca de escopo, regra, arquitetura ou comportamento esperado.

## Visao funcional completa

- O projeto possui uma Visao Funcional Completa documentada.
- Nenhuma sprint isolada define o limite final do produto.
- A Primeira Versao Operacional e somente um recorte utilizavel, integrado e validavel da plataforma.
- Decisoes tecnicas devem preservar expansao para os modulos e relacionamentos documentados.
- O agente nao deve remover funcionalidades planejadas apenas para simplificar uma sprint.
- Qualquer proposta de reducao permanente de escopo deve ser apresentada antes e depender de autorizacao explicita.
- Pendencias devem ser registradas como planejadas ou sujeitas a validacao, nao apagadas da Visao Funcional Completa.

## Regras clinicas e assistenciais

- Nao inventar regras clinicas.
- Nao transformar hipotese diagnostica em diagnostico confirmado.
- Nao criar diagnostico automatico.
- Nao criar prescricao automatica.
- Preservar a decisao profissional em todos os fluxos assistenciais.
- Protocolos institucionais podem organizar a assistencia, mas nao substituem a avaliacao e a decisao de profissionais habilitados.
- Sugestoes do sistema devem ser claramente separadas de decisoes profissionais registradas.
- Toda conduta deve ser atribuida a um profissional, quando aplicavel.

## Dados e seguranca

- Preservar isolamento entre hospitais.
- Utilizar somente dados ficticios durante desenvolvimento, testes, demonstracoes e documentacao.
- Nao inserir, copiar ou expor dados reais de pacientes, hospitais, profissionais ou terceiros.
- Validar entradas no cliente, no servidor e no banco de dados quando essas camadas existirem.
- Aplicar autorizacao no servidor e no banco de dados.
- Registrar operacoes sensiveis em trilhas de auditoria.
- Nao expor segredos, chaves, tokens, credenciais ou variaveis privadas em codigo, documentacao, commits ou logs.
- Anexos e documentos clinicos devem ser privados por padrao quando essa funcionalidade existir.

## Banco de dados e evolucao tecnica

- Usar migracoes versionadas para futuras alteracoes no banco.
- Nao criar tabelas, migracoes ou configuracoes de banco fora da sprint correspondente.
- Manter separacao clara entre entidades conceituais, modelos persistidos e implementacao tecnica.
- Evitar acoplamento entre regras institucionais e codigo fixo quando a regra precisar ser configuravel por hospital.

## Qualidade

- Criar testes para funcionalidades implementadas nas sprints de codigo.
- Executar lint, typecheck, testes e build nas sprints de codigo antes de solicitar validacao.
- Reportar claramente qualquer teste que nao tenha sido executado.
- Corrigir problemas dentro do escopo da sprint antes de avancar.

## Restricoes da Sprint 00

- Nao criar arquivos de codigo-fonte.
- Nao instalar pacotes.
- Nao criar `package.json`.
- Nao configurar Supabase.
- Nao criar tabelas.
- Nao criar migracoes.
- Nao criar telas.
- Nao criar APIs.
- Nao fazer commit.
- Nao avancar para a Sprint 01.
