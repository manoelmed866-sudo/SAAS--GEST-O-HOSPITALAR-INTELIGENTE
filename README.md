# Plataforma de Inteligencia Hospitalar

Fundacao local da aplicacao da Plataforma de Inteligencia Hospitalar.

## Objetivo do produto

A plataforma pretende apoiar a organizacao assistencial, operacional e gerencial de hospitais, preservando a decisao profissional e respeitando isolamento institucional, rastreabilidade e seguranca.

## Visao Funcional Completa

A Visao Funcional Completa inclui, em sprints futuras, capacidades relacionadas a pacientes, episodios assistenciais, historico longitudinal, linha do tempo, evolucoes, protocolos, exames, medicamentos, insumos, operacao hospitalar, indicadores, alertas, auditoria, areas por perfil e integracoes.

A Sprint 01 nao implementa essas capacidades. Ela cria apenas a fundacao tecnica local para que elas possam ser construidas posteriormente.

## Escopo da Sprint 01

- Aplicacao Next.js com App Router em `src/app`.
- TypeScript em modo estrito.
- Tailwind CSS via PostCSS.
- ESLint com configuracao flat.
- Zod para validacao estrutural publica.
- Vitest, React Testing Library e jsdom.
- Layout institucional basico.
- Pagina inicial provisoria.
- Loading, erro, erro global e not-found.
- Scripts npm para desenvolvimento, lint, typecheck, testes e build.

## Tecnologias

- Node.js 24 LTS.
- npm.
- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- Zod.
- ESLint.
- Vitest.
- React Testing Library.
- jsdom.

## Pre-requisito

Use Node.js 24 LTS.

```bash
node --version
npm --version
```

Para a Sprint 02, a fundacao local do banco depende tambem do Docker Desktop ou runtime Docker compativel. Mantenha o Docker Desktop aberto enquanto usar os comandos de banco.

A Supabase CLI e dependencia de desenvolvimento do projeto, instalada localmente em `devDependencies`. Nao e necessario instalar a CLI globalmente.

## Instalacao

```bash
npm install
```

## Execucao local

```bash
npm run dev
```

A aplicacao deve abrir em:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:watch
npm run check
```

Scripts de banco para ambiente local:

```bash
npm run db:start
npm run db:stop
npm run db:status
npm run db:migrate
npm run db:reset
npm run db:lint
npm run db:test
npm run db:types
```

Uso esperado dos scripts de banco:

- `npm run db:start`: inicia o Supabase local.
- `npm run db:status`: consulta os servicos locais sem copiar chaves para arquivos.
- `npm run db:migrate`: aplica migracoes locais pendentes.
- `npm run db:reset`: reconstroi o banco local a partir das migracoes e seed.
- `npm run db:lint`: executa lint local do schema.
- `npm run db:test`: executa testes SQL locais.
- `npm run db:types`: gera `src/types/database.types.ts` a partir do banco local.
- `npm run db:stop`: encerra os servicos locais.

O ambiente local nao deve ser exposto publicamente. Durante a execucao, os servicos locais do Supabase podem abrir portas na maquina, portanto devem ser usados apenas em desenvolvimento local controlado.

O uso do Supabase nesta etapa e exclusivamente local. Nao executar `supabase login`, nao executar `supabase link` e nao vincular o projeto a ambiente remoto.

## Estrutura de diretorios

```text
src/
  app/
  components/
  config/
  lib/
tests/
  setup.ts
  unit/
docs/
  sprints/
public/
```

## Variaveis publicas

O arquivo `.env.example` pode ser versionado e contem apenas placeholders seguros para variaveis publicas da integracao Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=replace_with_local_publishable_key
```

Para desenvolvimento local, copie `.env.example` para `.env.local` apenas na sua maquina e preencha os valores manualmente. Nao copie valores reais para documentacao, mensagens, commits ou arquivos versionados.

Nunca versionar `.env.local`.

Nunca usar secret key, service role, senha de banco, JWT secret, connection string ou chaves privadas com prefixo `NEXT_PUBLIC_`.

Nao copiar chaves locais exibidas pela Supabase CLI para arquivos versionados.

Lint, typecheck, testes unitarios e build nao exigem Docker ou Supabase ativos. A aplicacao atual tambem deve compilar sem `.env.local`, porque os clientes Supabase nao sao chamados durante a geracao estatica atual.

## Roteiro de validacao

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
npm run dev
```

Depois, validar:

- pagina inicial em `http://localhost:3000`;
- rota inexistente exibindo not-found;
- ausencia de erros no terminal;
- ausencia de modulos clinicos simulados;
- responsividade estrutural basica.

## Limitacoes atuais

- A infraestrutura local do Supabase foi preparada e validada na Sprint 02.
- O banco local foi iniciado apenas para desenvolvimento e testes, a baseline foi aplicada, o reset reconstruiu o estado limpo, os testes SQL foram executados e os tipos TypeScript foram gerados.
- Os servicos locais foram desligados apos a validacao; para novos ciclos locais, o Docker Desktop deve estar aberto.
- A Sprint 03A implementou o modelo institucional local, RLS e testes SQL.
- A Sprint 03B implementou e validou tecnicamente a infraestrutura Supabase SSR com clientes tipados, cookies e Proxy de renovacao de sessao.
- A aplicacao Next.js ainda nao possui login funcional.
- A aplicacao Next.js ainda nao executa consultas funcionais ao banco durante a interface atual.
- Autenticacao visual, login, logout, protecao de rotas e pagina de acesso negado ainda nao existem.
- Contexto institucional ativo sera implementado somente em fase futura autorizada.
- Nao existe vinculo com projeto Supabase remoto nesta fase.
- Nao ha API conectada ao banco.
- Nao ha APIs.
- Nao ha usuarios criados pela aplicacao, login funcional ou gestao visual de permissoes.
- Nao ha pacientes, episodios, historico clinico, evolucoes, protocolos, exames, medicamentos, estoque ou leitos.
- Nao ha dados reais.
- Nao ha integracao com servicos externos.
