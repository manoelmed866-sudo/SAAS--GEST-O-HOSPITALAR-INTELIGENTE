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

O arquivo `.env.example` pode ser versionado e contem apenas variaveis publicas:

```env
NEXT_PUBLIC_APP_NAME="Plataforma de Inteligencia Hospitalar"
NEXT_PUBLIC_APP_ENV="development"
```

A aplicacao funciona sem `.env.local`, usando valores padrao seguros.

Nao versionar segredos, tokens, credenciais, URLs privadas, `.env.local` ou dados reais.

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

- Nao ha banco de dados.
- Nao ha Supabase.
- Nao ha migracoes.
- Nao ha APIs.
- Nao ha autenticacao.
- Nao ha usuarios ou permissoes implementados.
- Nao ha pacientes, episodios, historico clinico, evolucoes, protocolos, exames, medicamentos, estoque ou leitos.
- Nao ha dados reais.
- Nao ha integracao com servicos externos.
