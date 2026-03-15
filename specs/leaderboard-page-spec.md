# Leaderboard Page

## Objective

- Implementar a pagina `/leaderboard` com dados reais via tRPC + Drizzle.
- Exibir no maximo os 20 piores trechos de codigo publicos.
- Manter a tela server-first com Server Components, `Suspense` e skeleton dedicado.
- Reaproveitar o visual de cards da pagina atual e adicionar `Collapsible` com Base UI para expandir o snippet completo.
- Corrigir o controle `leaderboard` do header para navegar corretamente para `/leaderboard`.
- Revalidar o conteudo cacheado da pagina completa a cada 1 hora com Cache Components para reduzir leituras repetidas no banco.

## Fontes consideradas

- `src/app/leaderboard/page.tsx` mostra a estrutura atual da pagina, ainda mockada.
- `src/components/leaderboard/leaderboard-entry-card.tsx` mostra o card full-width com `CodeBlock` da tela de leaderboard.
- `src/components/home/leaderboard-preview.tsx` e `src/components/home/leaderboard-preview-entry.tsx` mostram o padrao server-first + `Collapsible` ja usado na home.
- `src/components/ui/code-block.tsx` define o highlight server-only com Shiki (`vesper`).
- `src/components/ui/collapsible.tsx` encapsula os primitives do Base UI.
- `src/trpc/routers/leaderboard.ts` ja contem o `preview()` com filtro e stats reais do ranking publico.
- `src/components/layout/site-header.tsx` contem o controle do topo que precisa virar link.
- `specs/trpc-api-layer-spec.md` recomenda `caller.leaderboard.list()` para a pagina completa enquanto ela for essencialmente server-rendered.
- `specs/home-shame-leaderboard-spec.md` registra a regra publica do ranking e deixa a pagina completa fora do escopo daquele slice.
- tRPC docs: `https://trpc.io/docs/client/tanstack-react-query/server-components` embasam o uso de `caller` em Server Components.
- Next.js docs: `https://nextjs.org/docs/app/getting-started/fetching-data` e `https://nextjs.org/docs/app/api-reference/file-conventions/loading` embasam o uso de componentes async com `Suspense` e fallback dedicado.
- Next.js caching docs: `https://nextjs.org/docs/app/building-your-application/data-fetching/caching` e `https://nextjs.org/docs/app/getting-started/cache-components` embasam `cacheComponents`, `use cache`, `cacheLife('hours')` e o impacto de APIs dinamicas como `headers()` no cache.
- Base UI docs: `https://base-ui.com/react/components/collapsible` embasam `Collapsible.Root`, `Collapsible.Trigger` e `Collapsible.Panel`.
- Drizzle docs: `https://orm.drizzle.team/docs/select` embasam filtro, ordenacao, `limit`, `count` e agregacoes para o ranking.

## Current project context

- A homepage ja usa dados reais do ranking publico em `src/trpc/routers/leaderboard.ts`.
- A pagina `/leaderboard` ainda depende de `src/components/leaderboard/leaderboard-data.ts` e nao conversa com o banco.
- O router de leaderboard ainda nao tem `list()`, apenas `preview()`.
- O header global ainda mostra `leaderboard` como texto estatico, sem navegacao.
- A rota publica de detalhe do roast ainda nao esta alinhada com `publicSlug`, entao links de cada card seguem fora do escopo.

## Requirements

### In scope

- Adicionar `leaderboard.list()` no tRPC usando a mesma regra publica do preview.
- Limitar a resposta da pagina aos 20 piores roasts publicos completos com score preenchido.
- Retornar stats reais do ranking publico para o header da pagina.
- Implementar a pagina com shell server + async section + `Suspense` + skeleton.
- Reaproveitar os cards da pagina, mas com preview highlighted recolhido e expansao via `Collapsible`.
- Corrigir o controle `leaderboard` do header para usar `Link` para `/leaderboard`.
- Remover a dependencia do mock antigo da pagina.
- Fazer o componente async da rota `/leaderboard` usar `"use cache"` + `cacheLife('hours')` em vez de `revalidate` na pagina.

### Out of scope

- Adicionar filtros, busca, paginacao ou ordenacao client-side.
- Ligar os cards para a pagina publica do roast.
- Alterar schema, migrations ou seed.
- Unificar agora a pagina `/leaderboard` com o layout compacto da tabela da homepage.

## Recommendation

- Expandir `src/trpc/routers/leaderboard.ts` com helpers compartilhados para o filtro publico e para as agregacoes de stats, evitando divergencia entre `preview()` e `list()`.
- Manter `src/app/leaderboard/page.tsx` enxuto, usando `Suspense` para um novo async Server Component `LeaderboardPageContent`.
- Criar `LeaderboardPageSkeleton` para o loading state.
- Transformar `LeaderboardEntryCard` em um wrapper server-side que passa preview highlighted e codigo completo highlighted para um client leaf responsavel apenas pela interacao do `Collapsible`.
- Continuar usando `CodeBlock` apenas no server.

## Implementation shape

### Data contract

- `entries`
  - `rank: number`
  - `score: number`
  - `language: string`
  - `originalCode: string`
  - `lineCount: number`
  - `publicSlug: string`
- `stats`
  - `totalPublicRoasts: number`
  - `averageScore: number`

### Query rules

- Filtro base:
  - `status = 'completed'`
  - `visibility = 'public'`
  - `score is not null`
- Ordenacao:
  - `score ASC`
  - `createdAt DESC`
- Limite da pagina:
  - `20`

### File impact

- Atualizar `src/trpc/routers/leaderboard.ts`.
- Atualizar `src/app/leaderboard/page.tsx`.
- Criar `src/components/leaderboard/leaderboard-page-content.tsx`.
- Criar `src/components/leaderboard/leaderboard-page-skeleton.tsx`.
- Atualizar `src/components/leaderboard/leaderboard-entry-card.tsx`.
- Criar `src/components/leaderboard/leaderboard-entry-card-shell.tsx` ou equivalente client leaf do `Collapsible`.
- Atualizar `src/components/layout/site-header.tsx`.
- Ajustar o contexto server-side do tRPC para permitir Cache Components nas paginas publicas que usam `caller`.
- Remover `src/components/leaderboard/leaderboard-data.ts` se ficar sem uso.

## Risks

- `CodeBlock` e server-only; o `Collapsible` precisa continuar isolado em um componente client pequeno.
- Preview highlighted e painel expandido duplicam a renderizacao do snippet, mas o limite de 20 itens mantem esse custo controlado neste slice.
- As stats da pagina nao podem usar apenas os 20 itens exibidos; precisam refletir todo o ranking publico valido.
- Enquanto a rota de roast continuar em `src/app/roasts/[id]/page.tsx`, cada card deve continuar sem link publico.

## TODO

- [ ] Criar `leaderboard.list()` com limite 20.
- [ ] Compartilhar filtro/stats entre `preview()` e `list()`.
- [ ] Implementar shell async da pagina com `Suspense` e skeleton.
- [ ] Levar o `Collapsible` para os cards da pagina com preview highlighted + codigo completo.
- [ ] Trocar o header mockado da pagina por stats reais.
- [ ] Corrigir o link `leaderboard` do header global.
- [ ] Remover o mock antigo se ele nao tiver mais uso.
- [ ] Validar `pnpm lint` e `pnpm build`.
