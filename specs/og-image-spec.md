# OG Image

## Objective

- Gerar imagens OpenGraph dinamicas para links compartilhaveis de roasts (`/roasts/[slug]`).
- Usar Takumi (`@takumi-rs/image-response`) para renderizar JSX em PNG 1200x630 no servidor.
- Replicar o design do Pencil (Screen 4 - OG Image) fielmente: estetica terminal escura, score, verdict, summary.
- Fornecer imagem generica de fallback para roasts nao-completed.
- Cachear via HTTP headers.

## Fontes consideradas

- `AGENTS.md`
- `specs/AGENTS.md`
- `src/app/roasts/[slug]/page.tsx`
- `src/app/layout.tsx`
- `src/server/roasts/queries/get-roast-by-slug.ts`
- `src/components/roast-result/roast-result-types.ts`
- `next.config.ts`
- Pencil design: frame `4J5QT` (Screen 4 - OG Image)
- Takumi docs: `https://takumi.kane.tw/docs/migration/image-response`
- Takumi GitHub: `https://github.com/kane50613/takumi`

## Current project context

- O app tem URLs publicas em `/roasts/[slug]` para resultados de roast.
- Nao existe implementacao de OG image: sem `opengraph-image.tsx`, sem libs de geracao de imagem, sem campos `openGraph`/`twitter` no metadata.
- `metadataBase` nao esta definido no root layout.
- O design do Pencil inclui "Screen 4 - OG Image" (1200x630) planejado mas nunca implementado.
- Todos os dados necessarios (score, verdictLabel, summary, language, lineCount) ja estao disponiveis no estado `completed` do roast.

## Requirements

### Product

- Ao compartilhar link de roast completed em plataformas sociais, o embed deve mostrar imagem rica com score, verdict, info de linguagem e quote do summary.
- Roasts nao-completed mostram imagem generica do devroast (logo + tagline).
- A imagem deve seguir a estetica terminal escura do app e do design do Pencil.

### Scope and constraints

- Este recorte cobre apenas geracao de OG image e wiring de metadata.
- Sem botao de share na UI (fora do escopo).
- Sem mudancas no banco de dados.
- Sem novos procedures tRPC; reutiliza `getRoastBySlug` diretamente.

### Framework and integration notes

- `ImageResponse` do Takumi retorna `Response` padrao, compativel com route handlers do Next.js.
- `@takumi-rs/core` deve ser adicionado a `serverExternalPackages` no `next.config.ts`.
- JetBrains Mono carregado explicitamente (Takumi vem com Geist/Geist Mono por padrao).
- Route handler (nao `opengraph-image.tsx` file convention) para evitar riscos de compatibilidade.

## Recommendation

Route handler em `src/app/roasts/[slug]/opengraph-image/route.tsx` usando Takumi `ImageResponse`.

- Co-localizado com a pagina do roast.
- Controle total sobre `Cache-Control` headers.
- Sem dependencia de compatibilidade da file convention com lib third-party.
- `generateMetadata` referencia a URL explicitamente.

## Implementation shape

### Novos arquivos

- `src/app/roasts/[slug]/opengraph-image/route.tsx` — GET handler
- `src/components/og/roast-og-image.tsx` — componente JSX da imagem dinamica
- `src/components/og/fallback-og-image.tsx` — componente JSX da imagem generica
- `src/components/og/og-constants.ts` — cores, tamanhos, truncamento, font loader
- `src/assets/fonts/JetBrainsMono-Regular.ttf` — font file
- `src/assets/fonts/JetBrainsMono-Bold.ttf` — font file

### Arquivos modificados

- `src/app/layout.tsx` — adicionar `metadataBase`
- `src/app/roasts/[slug]/page.tsx` — adicionar `openGraph` + `twitter` ao metadata
- `next.config.ts` — adicionar `serverExternalPackages`
- `.env.example` — adicionar `NEXT_PUBLIC_BASE_URL`
- `package.json` — adicionar `@takumi-rs/image-response`

### Cache

- Completed: `Cache-Control: public, max-age=31536000, immutable`
- Fallback: `Cache-Control: public, max-age=60`

### Cor do verdict

- Score < 4: `#EF4444` (red)
- Score 4-6: `#F59E0B` (amber)
- Score > 6: `#10B981` (green)

### Summary

- Truncado em ~120 chars com `...`
- Envolto em aspas curvas

## Risks

- Native binary do Takumi precisa de suporte no ambiente de deploy.
- Plataformas sociais cacheiam OG images agressivamente no lado delas; se o crawler buscar o fallback antes do roast completar, nao ha como forcar refresh.

## TODO

- [ ] Instalar `@takumi-rs/image-response`
- [ ] Baixar font files JetBrains Mono (Regular + Bold)
- [ ] Criar componentes OG em `src/components/og/`
- [ ] Criar route handler em `src/app/roasts/[slug]/opengraph-image/route.tsx`
- [ ] Atualizar metadata no layout e na pagina do roast
- [ ] Atualizar `next.config.ts` e `.env.example`
- [ ] Verificar renderizacao visitando a rota diretamente
- [ ] Testar com debuggers de plataformas sociais
