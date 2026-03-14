# tRPC API Layer + Next.js App Router

## Objective

Definir a camada de API/back-end typesafe do Devroast com tRPC 11, usando a integracao oficial com TanStack React Query e cobrindo o uso em:

- client components via `/api/trpc`
- server components e SSR no App Router
- queries e mutations tipadas para homepage, leaderboard e pagina de roast
- reuso do `db` do Drizzle que ja existe no projeto

Este documento e especificacao de arquitetura e implementacao. Nao e para implementar cegamente sem a etapa de execucao.

## Fontes consideradas

- docs oficiais do tRPC 11:
  - `https://trpc.io/docs/client/tanstack-react-query/server-components`
  - `https://trpc.io/docs/client/tanstack-react-query/setup`
- `package.json` confirma Next.js `16.1.6`, React `19.2.3`, Drizzle e Postgres ja instalados
- `src/app/layout.tsx` mostra o ponto natural para montar providers globais
- `src/app/page.tsx` mostra homepage server-first com `HomeHero` client
- `src/app/leaderboard/page.tsx` mostra pagina server-side hoje alimentada por mock
- `src/app/roasts/[id]/page.tsx` mostra pagina de resultado ainda mockada e baseada em UUID
- `src/db/client.ts` e `src/db/schema/*` mostram que a camada de dados ja existe
- `src/components/home/home-hero.tsx` mostra o fluxo atual de submit no cliente
- `src/components/home/editor-snippet-constraints.ts` mostra a regra atual de tamanho maximo do snippet

## Current project context

- O projeto e um monolito Next.js com App Router.
- A UI ainda e majoritariamente estatica e baseada em mocks.
- Nao existe rota de API em `src/app/api/` hoje.
- Nao existe React Query no projeto hoje.
- As paginas em `src/app/` ja sao server components por padrao.
- A homepage tem interacao cliente em `src/components/home/home-hero.tsx` e `src/components/home/home-code-editor.tsx`.
- O banco e o schema inicial ja existem com `roasts` e `roast_findings`.
- O modelo de dados ja usa `publicSlug`, mas a pagina de resultado ainda esta em `src/app/roasts/[id]/page.tsx`.

## Requirements

### Functional

- Expor uma camada de API typesafe unica para front e back.
- Validar inputs com `zod` nas bordas da API.
- Suportar queries para leaderboard preview, leaderboard completo e roast por slug.
- Suportar mutation para submissao de roast na homepage.
- Funcionar bem tanto em client components quanto em server components.
- Permitir prefetch + hydration quando um client component precisar dos dados que comecam no servidor.
- Permitir server caller direto quando os dados forem usados apenas no servidor.
- Reutilizar `db` do Drizzle no contexto do tRPC.

### Non-functional

- Seguir o padrao oficial do tRPC 11 com `@trpc/tanstack-react-query`.
- Nao usar a integracao classica `@trpc/react-query` nem `@trpc/next` neste ciclo.
- Criar `QueryClient` novo por request no server e singleton no browser.
- Configurar `staleTime > 0` para evitar refetch imediato apos hydration.
- Usar helpers server-side com `cache()` para estabilidade por request.
- Evitar double fetch entre server caller, prefetch e client query.
- Manter a renderizacao server-first das paginas do App Router.

## Recommendation

Usar tRPC 11 como contrato unico da camada de API do app, com dois modos de consumo:

1. `HTTP /api/trpc` para client components
2. server caller/proxy para server components e SSR dentro do proprio app

Decisao importante:

- dentro deste projeto, o contrato principal e o `appRouter`, nao o transporte HTTP
- client components passam pelo route handler
- server components nao devem fazer `fetch` interno para o proprio `/api/trpc` so para ler dados
- quando o dado so for usado no server, preferir `caller`
- quando o dado for prefetchado no server para um client component consumir, usar `trpc.<procedure>.queryOptions()` + `prefetchQuery()` + hydration

Essa abordagem segue o que a documentacao oficial recomenda para React Server Components e evita desperdicarmos o modelo server-first do Next.js.

Tambem recomendo adicionar `superjson` desde o inicio, porque o projeto ja tem timestamps vindos do banco e logo vai trafegar dados que nao sao JSON puro com conforto.

## Packages recomendados

Instalar neste ciclo:

- `@trpc/server`
- `@trpc/client`
- `@trpc/tanstack-react-query`
- `@tanstack/react-query`
- `zod`
- `superjson`

Alinhado com a doc oficial, `client-only` e `server-only` podem entrar se quisermos seguir o setup ao pe da letra. O projeto ja usa `server-only` em `src/db/client.ts`.

## Implementation shape

### Estrutura sugerida

```text
src/
  app/
    api/
      trpc/
        [trpc]/
          route.ts
    providers.tsx
  trpc/
    init.ts
    query-client.ts
    client.tsx
    server.tsx
    routers/
      _app.ts
      leaderboard.ts
      roasts.ts
```

Se os routers crescerem, a logica de banco pode sair para `src/server/services/` ou `src/server/queries/`. Nao precisa nascer assim no primeiro passo.

### `src/trpc/init.ts`

Responsabilidades recomendadas:

- criar o contexto base do tRPC com `db`
- receber headers/request metadata quando fizer sentido
- inicializar o `initTRPC`
- exportar helpers base:
  - `createTRPCRouter`
  - `createCallerFactory`
  - `publicProcedure`

Recomendacao pratica:

- centralizar um builder interno de contexto para nao duplicar a montagem entre route handler e RSC
- deixar um espaco pronto para auth futura, mesmo que por enquanto o contexto so tenha `db`, `headers` e talvez `source`
- configurar `transformer: superjson`

### `src/trpc/query-client.ts`

Seguir o padrao da doc de server components:

- exportar `makeQueryClient()`
- configurar `staleTime` inicial entre `30s` e `60s`
- configurar `shouldDehydrateQuery` para incluir queries `pending`
- se `superjson` estiver ativo no tRPC, configurar serializacao e desserializacao aqui tambem

Isso da suporte a streaming e hydration sem refetch agressivo logo apos o primeiro render.

### `src/trpc/client.tsx`

Seguir a doc de setup com TanStack React Query:

- marcar o arquivo com `"use client"`
- criar o contexto com `createTRPCContext<AppRouter>()`
- exportar `TRPCProvider`, `useTRPC` e opcionalmente `useTRPCClient`
- criar `QueryClient` singleton no browser
- criar `tRPC client` com `createTRPCClient<AppRouter>()`
- usar `httpBatchLink` apontando para `/api/trpc`

O provider client deve ser montado em `src/app/providers.tsx` e consumido por `src/app/layout.tsx`.

### `src/app/providers.tsx`

Criar um wrapper client-side simples para manter `src/app/layout.tsx` enxuto:

- `TRPCReactProvider`
- futuro ponto central para outros providers se o app crescer

### `src/trpc/server.tsx`

Seguir o padrao oficial para RSC:

- marcar com `import "server-only"`
- criar `getQueryClient = cache(makeQueryClient)`
- criar o proxy server-side com `createTRPCOptionsProxy(...)`
- exportar um `caller` para queries puramente server-side
- exportar helpers pequenos como:
  - `prefetch(queryOptions)`
  - `HydrateClient`

Regra de uso:

- `caller` quando o dado so vive no server component
- `prefetch + HydrateClient` quando um client component vai ler a mesma query com React Query

### `src/app/api/trpc/[trpc]/route.ts`

Criar o route handler com `fetchRequestHandler`:

- endpoint `/api/trpc`
- `appRouter` compartilhado
- `createContext` compartilhado
- exportar `GET` e `POST`

Essa rota sera usada por mutations e queries disparadas a partir de client components.

## Routers iniciais recomendados

### `roasts`

Procedures iniciais:

- `submit`
  - mutation
  - input minimo: `code`, `language`, `mode`
  - valida tamanho do snippet
  - cria o roast inicial com status coerente com o pipeline futuro
  - retorna pelo menos `id`, `publicSlug` e `status`
- `bySlug`
  - query
  - le roast + findings
  - retorna shape pronto para a pagina de resultado

Observacao importante:

- o schema de banco ja fala em `publicSlug`
- por isso a API deve preferir `bySlug`, nao `byId`
- se precisarmos manter a rota atual por um tempo, isso pode existir como compatibilidade temporaria, nao como contrato final

### `leaderboard`

Procedures iniciais:

- `preview`
  - query para homepage
  - retorna top 3 + stats resumidos
- `list`
  - query para pagina completa
  - retorna ranking publico ordenado por score

### `health` opcional

Se quisermos um smoke test simples para validar a stack tRPC antes de ligar dados reais, um `health.ping` pode existir temporariamente. Nao e obrigatorio para o produto.

## Regras de uso por tela

### Homepage `/`

- `src/app/page.tsx` pode continuar server component.
- `LeaderboardPreview` pode começar usando `caller.leaderboard.preview()` se continuar 100% server-rendered.
- `HomeHero` continua client component e deve usar `useMutation(trpc.roasts.submit.mutationOptions())`.

Se no futuro o preview do leaderboard virar interativo no cliente, ai sim faz sentido trocar para `prefetch + HydrateClient + useQuery`.

### Leaderboard `/leaderboard`

- enquanto a pagina for essencialmente server-rendered, usar `caller.leaderboard.list()`
- se vier filtro, busca, paginacao ou sort client-side, migrar para `prefetch + HydrateClient`

Isso evita colocar React Query onde ainda nao ha ganho real.

### Roast result `/roasts/[id]`

O contrato recomendado da API e `roasts.bySlug`, entao o ideal e alinhar a rota para:

- `src/app/roasts/[slug]/page.tsx`

No rollout inicial, existe duas opcoes validas:

1. renomear a rota junto com a entrada do tRPC
2. manter `[id]` por pouco tempo e adaptar a leitura ate a mudanca de URL

Minha recomendacao e a opcao 1, porque ela alinha a UI com o schema que ja foi definido no banco.

## Validacao e limites

- Reaproveitar a regra de `MAX_SNIPPET_CHARACTERS = 3000` no input do `roasts.submit`.
- Antes de usar essa constante no router, tirar ela de `src/components/home/` e mover para um lugar neutro de dominio ou lib.
- Validar `mode` e `language` com enums/`zod` alinhados ao schema do banco.
- Nao devolver erros brutos do Postgres para o cliente.

## Decisoes de integracao com RSC

Seguindo a documentacao oficial, este deve ser o criterio padrao do projeto:

- dado so para server render -> `caller`
- dado prefetchado no server para client component -> `prefetch` + `HydrateClient`
- dado iniciado no cliente -> `useQuery` ou `useMutation`

Importante:

- `caller` e `useQuery` nao compartilham cache automaticamente
- se a mesma informacao precisar aparecer no server e no client com a mesma busca, preferir `fetchQuery` ou um fluxo unico de hydration
- evitar misturar `caller` e `prefetch` para a mesma query no mesmo render sem motivo

## O que nao criar agora

- nao usar `@trpc/react-query`
- nao usar `@trpc/next`
- nao transformar server actions na camada principal de API neste ciclo
- nao criar middleware de auth/protected procedure sem uma necessidade real
- nao duplicar a mesma regra de negocio em page, route handler e router

## Proposed file impact

Arquivos provaveis de criacao:

- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/providers.tsx`
- `src/trpc/init.ts`
- `src/trpc/query-client.ts`
- `src/trpc/client.tsx`
- `src/trpc/server.tsx`
- `src/trpc/routers/_app.ts`
- `src/trpc/routers/leaderboard.ts`
- `src/trpc/routers/roasts.ts`

Arquivos provaveis de ajuste:

- `package.json`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/leaderboard/page.tsx`
- `src/app/roasts/[id]/page.tsx` ou futuro `src/app/roasts/[slug]/page.tsx`
- `src/components/home/home-hero.tsx`
- `src/components/home/editor-snippet-constraints.ts` ou novo arquivo compartilhado para essa regra

## Risks

- confundir `caller` com `prefetch/hydration` e acabar fazendo double fetch
- serializacao incompleta sem `superjson` quando os dados do banco comecarem a circular entre server e client
- manter `[id]` enquanto o dominio real fala em `publicSlug` pode gerar retrabalho de URL
- tentar colocar React Query em toda leitura logo de cara pode complicar um app que ainda e server-first
- a mutation `submit` ainda depende da decisao final sobre o pipeline real de processamento do roast

## Final decision

Para o Devroast, o melhor caminho e:

- tRPC 11 com `@trpc/tanstack-react-query`
- `appRouter` como contrato unico da camada de API
- route handler `/api/trpc` para o cliente
- `caller` e `prefetch/hydration` para o App Router server-side, conforme a necessidade da tela
- `superjson` desde o inicio

Isso nos da uma camada de API typesafe, moderna e alinhada com o uso de server components no Next.js sem abrir mao de uma experiencia boa no cliente.

## TODO

- [ ] instalar os pacotes de tRPC, TanStack Query, `zod` e `superjson`
- [ ] criar `src/trpc/init.ts` com contexto, router helpers e transformer
- [ ] criar `src/trpc/query-client.ts`
- [ ] criar `src/trpc/client.tsx` e `src/app/providers.tsx`
- [ ] criar `src/trpc/server.tsx` com `caller`, `prefetch` e `HydrateClient`
- [ ] criar `src/app/api/trpc/[trpc]/route.ts`
- [ ] criar `src/trpc/routers/_app.ts`, `leaderboard.ts` e `roasts.ts`
- [ ] mover `MAX_SNIPPET_CHARACTERS` para um lugar compartilhado fora de `src/components/home/`
- [ ] ligar `HomeHero` na mutation `roasts.submit`
- [ ] ligar homepage preview e pagina `/leaderboard` a queries reais
- [ ] alinhar a pagina de resultado para `bySlug` e idealmente renomear a rota para `[slug]`
- [ ] documentar no codigo quando usar `caller` vs `prefetch/hydration`
