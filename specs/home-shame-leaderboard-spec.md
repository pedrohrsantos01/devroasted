# Home Shame Leaderboard

## Objective

- Implementar o `shame_leaderboard` da homepage com dados reais.
- Exibir apenas os 3 piores trechos de codigo publicados.
- Mostrar metricas no rodape no formato `showing top 3 of X public roasts · avg score: Y/10`.
- Manter a homepage server-first com Server Components, `Suspense` e skeleton dedicado durante o carregamento.
- Exibir preview com syntax highlight e permitir expandir cada snippet para ver o codigo completo via collapsible.
- Revalidar os componentes cacheados da homepage em janela de 1 hora usando Cache Components, evitando leitura no banco a cada request.

## Fontes consideradas

- `src/app/page.tsx` ja usa `Suspense` para a secao async de stats da home.
- `src/components/home/home-hero.tsx` e o shell client da homepage e aceita `children` server-rendered.
- `src/components/home/leaderboard-preview.tsx` concentra o preview da homepage e `src/components/home/leaderboard-preview-entry.tsx` concentra o item expansivel.
- `src/components/ui/code-block.tsx` define o bloco server-only de syntax highlight com Shiki (`vesper`).
- `src/components/leaderboard/leaderboard-entry-card.tsx` mostra o padrao visual atual de codigo highlighted na tela de leaderboard.
- `src/trpc/routers/metrics.ts` mostra o padrao atual de query server-side via `caller`.
- `src/db/schema/roasts.ts` define os campos necessarios para ranking publico: `originalCode`, `language`, `status`, `visibility`, `score`, `createdAt`, `publicSlug`.
- `specs/trpc-api-layer-spec.md` ja recomenda `leaderboard.preview()` para a homepage.
- `specs/drizzle-postgres-spec.md` ja define o filtro do leaderboard publico como `status = 'completed'`, `visibility = 'public'`, ordenado por `score ASC, created_at DESC`.
- Next.js App Router docs: `https://nextjs.org/docs/app/getting-started/fetching-data` e `https://nextjs.org/docs/app/api-reference/file-conventions/loading` embasam o uso de async Server Components com `Suspense` e fallback dedicado.
- Next.js caching docs: `https://nextjs.org/docs/app/building-your-application/data-fetching/caching` e `https://nextjs.org/docs/app/getting-started/cache-components` embasam `cacheComponents`, `use cache`, `cacheLife('hours')` e a necessidade de evitar APIs dinamicas para aproveitar o cache.
- Drizzle docs: `https://orm.drizzle.team/docs/select` embasa filtro, ordenacao, `limit`, `count` e agregacoes para a query do ranking.
- Base UI docs: `https://base-ui.com/react/components/collapsible` embasam o uso de `Collapsible.Root`, `Collapsible.Trigger` e `Collapsible.Panel` para expandir o snippet sem reinventar o comportamento.

## Current project context

- A homepage em `src/app/page.tsx` ja e server component por padrao e usa `force-dynamic`.
- `HomeStats` em `src/components/home/home-stats.tsx` ja segue o padrao esperado: async Server Component + `caller` + skeleton separado.
- O leaderboard da homepage precisa manter o contrato real do banco e o comportamento de expansao sem empurrar highlight para o client.
- A pagina completa `/leaderboard` continua mockada e fica fora do recorte desta entrega.
- A rota de resultado ainda usa `src/app/roasts/[id]/page.tsx` com mock baseado em UUID; portanto, links publicos do preview nao entram agora.

## Requirements

### In scope

- Criar a fonte real de dados do leaderboard preview via tRPC server-side.
- Retornar somente os 3 piores roasts publicos e completos com score preenchido.
- Calcular metricas publicas do rodape com o mesmo filtro do ranking.
- Usar async Server Component para o preview da homepage.
- Usar `Suspense` em `src/app/page.tsx` com skeleton proprio do leaderboard.
- Preservar o visual atual da tabela o maximo possivel, trocando apenas a origem dos dados e o rodape.
- Exibir um preview highlighted do codigo na linha da tabela com altura maxima controlada.
- Permitir expandir cada linha para ver o codigo completo highlighted, com line numbers, sem transformar o bloco highlighted em client component.
- Usar Base UI para o primitive de collapsible quando houver interacao.
- Fazer os componentes async da homepage usarem `"use cache"` + `cacheLife('hours')` em vez de revalidacao por constante na rota.

### Out of scope

- Refatorar a pagina `/leaderboard` para dados reais.
- Ligar cada item do preview para a pagina publica do roast.
- Alterar schema, migration ou seed.
- Adicionar filtros, busca, paginacao ou interacao client-side no preview.

## Recommendation

- Criar `src/trpc/routers/leaderboard.ts` com um procedure `preview` focado apenas neste slice.
- Consumir a query pela homepage via `caller.leaderboard.preview()` dentro de um async Server Component.
- Manter a secao como server-first, sem `use client` e sem `fetch('/api/trpc')`.
- Criar um skeleton dedicado que reutilize a estrutura visual da tabela para evitar layout shift.
- Retornar `originalCode` completo e usar um pequeno client leaf apenas para controlar o abre/fecha do painel.
- Renderizar o syntax highlight com `CodeBlock` no server e passar os blocos renderizados como `children`/slots para o componente client do item.
- Usar o preview highlighted com `max-height` no resumo e o bloco completo dentro do `Collapsible.Panel`.

## Implementation shape

### Data contract

- `entries`
  - `rank: number`
  - `score: number`
  - `language: string`
  - `originalCode: string`
  - `lineCount: number`
  - `publicSlug: string` reservado para evolucao futura
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
- Limite:
  - `3`

### File impact

- Criar `src/trpc/routers/leaderboard.ts`.
- Atualizar `src/trpc/routers/_app.ts` para registrar o router.
- Criar `src/components/ui/collapsible.tsx` e exportar em `src/components/ui/index.ts`.
- Criar `src/components/home/leaderboard-preview-entry.tsx` como client leaf do collapsible.
- Atualizar `src/components/home/leaderboard-preview.tsx` para async Server Component com dados reais.
- Criar `src/components/home/leaderboard-preview-skeleton.tsx`.
- Atualizar `src/app/page.tsx` para envolver o preview em `Suspense`.
- Ajustar o caminho server-side do tRPC para nao marcar a homepage como dinamica sem necessidade e permitir Cache Components nos trechos async.
- Remover o uso de `src/components/home/leaderboard-data.ts`; se ficar sem uso, apagar o arquivo.

## Risks

- O footer nao deve reaproveitar `metrics.home()`, porque hoje ele inclui roasts nao publicos.
- `score` e nullable no schema; a query precisa filtrar `score` nulo para evitar ranking inconsistente.
- Como `/leaderboard` ainda esta mockada, a homepage passara a refletir dados reais antes da pagina completa.
- Como a pagina de detalhe ainda nao le por `publicSlug`, nao devemos introduzir links quebrados no preview.
- `CodeBlock` e server-only; a interacao do collapsible precisa ficar isolada em um componente client pequeno, recebendo o conteudo renderizado do server.
- O preview highlighted e o painel expandido podem duplicar a renderizacao do snippet, mas isso fica aceitavel neste slice porque a home renderiza apenas 3 entradas.

## TODO

- [ ] Criar `leaderboard.preview()` no tRPC.
- [ ] Registrar o router em `src/trpc/routers/_app.ts`.
- [ ] Criar o primitive compartilhado de collapsible com Base UI.
- [ ] Criar item expansivel do preview da homepage.
- [ ] Trocar o preview mockado da home por leitura real no server.
- [ ] Criar skeleton dedicado do leaderboard preview.
- [ ] Adicionar `Suspense` para a secao na homepage.
- [ ] Remover o mock local se ele nao tiver mais uso.
- [ ] Validar `pnpm lint` e `pnpm build`.
