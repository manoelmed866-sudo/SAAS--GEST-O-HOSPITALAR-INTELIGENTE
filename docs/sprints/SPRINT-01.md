# SPRINT-01.md

## Sprint 01 - Fundacao local da aplicacao

## Objetivo

Criar a fundacao tecnica local da aplicacao sem implementar modulos clinicos, banco de dados, autenticacao real, APIs hospitalares ou regras assistenciais.

## Escopo

- Aplicacao Next.js com App Router em `src/app`.
- React e TypeScript em modo estrito.
- Tailwind CSS com `@tailwindcss/postcss`.
- ESLint com configuracao flat.
- Zod para validacao estrutural publica.
- Vitest, React Testing Library e jsdom.
- Layout institucional basico.
- Pagina inicial provisoria.
- Loading global.
- Tratamento de erro de rota.
- Tratamento de erro global.
- Pagina not-found.
- `.env.example` sem credenciais.
- README com instrucoes de instalacao e execucao.

## Itens implementados

- Estrutura inicial da aplicacao em `src/app`.
- Componentes basicos de layout e interface.
- Validacao de configuracao publica com Zod.
- Testes automatizados da fundacao.
- Scripts npm para desenvolvimento, lint, typecheck, teste, build e verificacao completa.

## Itens nao implementados

- Pacientes.
- Episodios assistenciais.
- Historico clinico.
- Evolucoes.
- Protocolos.
- Exames.
- Medicamentos.
- Estoque.
- Leitos.
- Usuarios.
- Autenticacao.
- Permissoes.
- APIs.
- Banco de dados.
- Supabase.
- Migracoes.
- Regras clinicas.
- Integracoes externas.
- Hospedagem em producao.

## Dependencias

Dependencias de producao:

- `next`;
- `react`;
- `react-dom`;
- `zod`.

Dependencias de desenvolvimento:

- `typescript`;
- `@types/node`;
- `@types/react`;
- `@types/react-dom`;
- `eslint`;
- `eslint-config-next`;
- `tailwindcss`;
- `@tailwindcss/postcss`;
- `postcss`;
- `vitest`;
- `@vitejs/plugin-react`;
- `jsdom`;
- `@testing-library/react`;
- `@testing-library/dom`;
- `@testing-library/jest-dom`;
- `@testing-library/user-event`;
- `vite-tsconfig-paths`.

## Estrutura criada

```text
src/
  app/
    globals.css
    layout.tsx
    page.tsx
    loading.tsx
    error.tsx
    global-error.tsx
    not-found.tsx
  components/
    layout/
    ui/
  config/
  lib/
    validation/
tests/
  setup.ts
  unit/
docs/
  sprints/
public/
```

## Testes

Foram criados testes para:

- pagina inicial;
- cabecalho;
- loading;
- not-found;
- estado de erro;
- configuracao publica com Zod.

## Comandos executados

```bash
git status
git branch --show-current
git log -1 --oneline
git remote -v
node --version
npm --version
npm install
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
npm run dev
curl -i http://localhost:3000
curl -i http://localhost:3000/rota-inexistente
git status --short
git diff --check
git diff --name-only
git diff --stat
git status
```

## Riscos

- Mudancas de versao do Next.js, ESLint ou Tailwind podem exigir ajuste futuro de configuracao.
- O caminho local do projeto contem espacos, exigindo cuidado em comandos manuais.
- A validacao visual no navegador pode depender do ambiente local do usuario.
- O aviso externo de Git sobre `C:\Users\neto/.config/git/ignore` permanece fora do repositorio.

## Criterios de conclusao

- `npm install` funciona.
- `npm run lint` passa.
- `npm run typecheck` passa.
- `npm run test` passa.
- `npm run build` passa.
- `npm run check` passa.
- A aplicacao responde localmente.
- A rota inexistente exibe not-found.
- Nenhum modulo clinico foi implementado.
- Nenhum segredo foi versionado.
- Nenhum dado real foi usado.

## Validacoes executadas

- `npm run lint` passou.
- `npm run typecheck` passou.
- `npm run test` passou com 6 arquivos de teste e 14 testes aprovados.
- `npm run build` passou.
- `npm run check` passou, executando lint, typecheck, testes e build em sequencia.
- Pagina inicial respondeu com HTTP 200.
- Rota inexistente respondeu com HTTP 404 e exibiu a interface de not-found.
- Servidor local foi encerrado e a porta 3000 foi liberada apos a validacao.
- Nenhuma API, banco de dados, autenticacao ou modulo clinico foi criado.
- A Sprint 02 nao foi iniciada.
- Inspecao visual completa no navegador permanece pendente para revisao do usuario.

## Correcao da revisao tecnica

- Corrigido o aninhamento potencial de landmarks `<main>` nas telas de erro e not-found.
- `ErrorState` passou a ser componente estrutural neutro, sem renderizar `main`.
- `global-error.tsx` manteve estrutura propria com `html`, `body` e um unico `main`.
- O achado medio da revisao tecnica foi fechado sem alterar dependencias.

## Ressalva de seguranca documentada

- A auditoria npm identificou CVE-2026-41305 / GHSA-qx2v-qp2m-jg93.
- Severidade: moderada.
- Pacote afetado: PostCSS abaixo de 8.5.10.
- Origem no projeto: dependencia privada/transitiva em `node_modules/next/node_modules/postcss`, incluida pelo Next.js 16.2.10.
- A vulnerabilidade nao esta resolvida nesta sprint.
- Nao foi executado `npm audit fix` nem `npm audit fix --force`.
- A correcao forçada foi rejeitada porque tentaria instalar Next.js 9.3.3, causando downgrade incompativel com a fundacao tecnica atual.
- O risco atual e reduzido porque a Sprint 01 nao aceita CSS controlado por usuario.
- Antes de homologacao publica ou producao, sera necessario atualizar para versao estavel corrigida do Next.js ou obter mitigacao adequada.

## Estado da sprint

Concluida.

## Condicao para homologacao publica ou producao

- Homologacao publica ou producao permanece condicionada ao tratamento adequado da vulnerabilidade transitiva documentada em `KNOWN_ISSUES.md`.
- A Sprint 02 deve ser iniciada somente apos autorizacao explicita.
