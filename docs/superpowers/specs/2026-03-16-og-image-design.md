# OG Image for Roast Results

## Objective

- Generate dynamic OpenGraph images for shareable roast result links (`/roasts/[slug]`).
- Use Takumi (`@takumi-rs/image-response`) to render JSX into a 1200x630 PNG on the server.
- Replicate the Pencil design (Screen 4 - OG Image) faithfully: dark terminal aesthetic, score ring, verdict, summary quote.
- Provide a generic fallback image for non-completed roasts (processing, failed, not found).
- Leverage HTTP cache headers for efficient delivery to social crawlers.

## Sources Considered

- `AGENTS.md`
- `specs/AGENTS.md`
- `specs/roast-creation-spec.md`
- `src/app/roasts/[slug]/page.tsx`
- `src/app/layout.tsx`
- `src/server/roasts/queries/get-roast-by-slug.ts`
- `src/components/roast-result/roast-result-types.ts`
- `src/db/schema/roasts.ts`
- `next.config.ts`
- Pencil design: `devroast.pen`, frame `4J5QT` (Screen 4 - OG Image)
- Takumi docs: `https://takumi.kane.tw/docs/migration/image-response`
- Takumi GitHub: `https://github.com/kane50613/takumi`

## Current Project Context

- The app has shareable public URLs at `/roasts/[slug]` for completed roast results.
- There is zero OG image implementation today: no `opengraph-image.tsx`, no image generation libraries, no `openGraph`/`twitter` metadata fields.
- `metadataBase` is not set in the root layout.
- The `generateMetadata` on the roast page only sets `title`, `description`, and `robots`.
- The Pencil design includes a "Screen 4 - OG Image" (1200x630) that was planned from the start but never implemented.
- The data needed for the OG image (score, verdictLabel, summary, language, originalCode) is available from the `completed` roast state via `getRoastBySlug`. Line count is derived from `originalCode.split("\n").length` (same approach used by the existing result page UI).

## Requirements

### Product

- When a completed roast link is shared on social platforms (Twitter, Discord, Slack, etc.), the embed must show a rich image with the roast score, verdict, language info, and a summary quote.
- Non-completed roasts (processing, failed) show a generic branded image (logo + tagline).
- The image must match the terminal-dark aesthetic of the app and the Pencil design.

### Scope and Constraints

- This slice covers only the OG image generation and metadata wiring.
- No share button UI is included (remains out of scope).
- No database changes required.
- No new tRPC procedures needed; the existing `getRoastBySlug` query is reused directly.

### Framework and Integration Notes

- Takumi's `ImageResponse` returns a standard `Response` object, compatible with Next.js route handlers.
- `@takumi-rs/core` must be added to `serverExternalPackages` in `next.config.ts` to prevent Next.js from bundling the native binary.
- Takumi ships with Geist/Geist Mono by default; JetBrains Mono must be loaded explicitly for design fidelity.
- The route handler approach (not the `opengraph-image.tsx` file convention) is chosen to avoid compatibility risks with a third-party library and to retain full control over cache headers.

## Approved Approach

Route handler at `src/app/roasts/[slug]/opengraph-image/route.tsx` using Takumi `ImageResponse`.

Why this wins:

- Co-located with the roast page for discoverability.
- Full control over `Cache-Control` headers.
- No dependency on Next.js file convention compatibility with third-party `ImageResponse`.
- The `generateMetadata` on the page explicitly references the image URL.

Alternatives considered:

1. **`opengraph-image.tsx` file convention** — risk of incompatibility with Takumi's `ImageResponse` since the convention was designed for `next/og`.
2. **Separate API route (`/api/og/[slug]`)** — works but adds indirection; the image URL is disconnected from the roast route.

## Architecture

### Route Structure

```
src/app/roasts/[slug]/
  page.tsx                              # existing — updated generateMetadata
  opengraph-image/
    route.tsx                           # NEW — GET handler
src/components/og/
  roast-og-image.tsx                    # NEW — dynamic image JSX (completed state)
  fallback-og-image.tsx                 # NEW — generic image JSX (fallback)
  og-constants.ts                       # NEW — colors, sizes, truncate, font loader
```

### Request Flow

```
Social crawler → GET /roasts/{slug}/opengraph-image
  → route.tsx reads slug from params
  → imports db from "@/db/client"
  → calls getRoastBySlug({ db, slug }) directly (server-only, no tRPC)
  → if completed:
      → renders RoastOgImage JSX via Takumi ImageResponse
      → Cache-Control: public, max-age=31536000, immutable
  → if processing/failed/null:
      → renders FallbackOgImage JSX via Takumi ImageResponse
      → Cache-Control: public, max-age=60
  → if getRoastBySlug throws:
      → returns FallbackOgImage with Cache-Control: no-cache
```

Route handler skeleton:

```ts
import { ImageResponse } from "@takumi-rs/image-response";
import { db } from "@/db/client";
import { getRoastBySlug } from "@/server/roasts/queries/get-roast-by-slug";
// ... font loading, components

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const roast = await getRoastBySlug({ db, slug });

    if (roast?.status === "completed") {
      return new ImageResponse(<RoastOgImage roast={roast} />, {
        width: 1200, height: 630, fonts,
        headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      });
    }

    return new ImageResponse(<FallbackOgImage />, {
      width: 1200, height: 630, fonts,
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch {
    return new ImageResponse(<FallbackOgImage />, {
      width: 1200, height: 630, fonts,
      headers: { "Cache-Control": "no-cache" },
    });
  }
}
```

### Dynamic Image Layout (completed)

1200x630, dark background (`#0A0A0A`), everything centered vertically and horizontally.

| Element | Font | Size | Color | Notes |
|---------|------|------|-------|-------|
| `>` logo prompt | JetBrains Mono Bold (700) | 24px | `#10B981` (accent-green) | |
| `devroast` logo text | JetBrains Mono Bold (700) | 20px | `#E5E5E5` (text-primary) | Design uses Medium (500) but Bold is close enough; avoids extra font file |
| Score number | JetBrains Mono Bold (700) | 160px | `#F59E0B` (accent-amber) | lineHeight: 1. Display format: `score.toFixed(1)` (e.g. `3.5`, `7.0`) matching existing `RoastScoreRing` |
| `/10` denominator | JetBrains Mono Regular (400) | 56px | `#737373` (text-tertiary) | lineHeight: 1, aligned with score via `alignItems: "flex-end"` |
| Verdict dot | — | 12x12 | Dynamic (see below) | Rendered as a `<div>` with `borderRadius: "50%"` |
| Verdict label | JetBrains Mono Regular (400) | 20px | Dynamic (same as dot) | |
| Language info | JetBrains Mono Regular (400) | 16px | `#737373` (text-tertiary) | Format: `lang: {language} · {lineCount} lines`. Line count derived from `originalCode.split("\n").length` |
| Summary quote | JetBrains Mono Regular (400) | 22px | `#E5E5E5` (text-primary) | Wrapped in curly quotes, centered, max ~120 chars with `...` |

**Verdict color logic** (reuses the same thresholds as `getVerdictTone` in `src/components/roast-result/roast-result-view.tsx:174-184`):
- Score < 4: `#EF4444` (accent-red)
- Score >= 4 and < 7: `#F59E0B` (accent-amber)
- Score >= 7: `#10B981` (accent-green)

**Layout properties:**
- Container: flexbox column, `justifyContent: center`, `alignItems: center`
- Gap between blocks: 28px
- Padding: 64px
- Score row: flexbox horizontal, baseline-aligned
- Verdict row: flexbox horizontal, gap 8px, centered

### Fallback Image Layout (processing/failed/not found)

1200x630, same dark background.

| Element | Font | Size | Color |
|---------|------|------|-------|
| `>` logo prompt | JetBrains Mono Bold (700) | 24px | `#10B981` |
| `devroast` logo text | JetBrains Mono Bold (700) | 20px | `#E5E5E5` |
| Tagline | JetBrains Mono Regular (400) | 24px | `#A3A3A3` (text-secondary) |

Content: `"Paste your code. Get roasted."`

### Font Loading

Two JetBrains Mono `.ttf` files stored in `src/assets/fonts/`:
- `JetBrainsMono-Regular.ttf` (weight 400) — used for denominator, verdict label, language info, summary, tagline
- `JetBrainsMono-Bold.ttf` (weight 700) — used for logo prompt, logo text, score number

Only two weights (Regular + Bold) are used. The Pencil design specifies Medium (500) for logo text and Black (900) for the score, but Bold (700) is a close-enough substitute that avoids shipping two extra font files.

Loaded once at module level via `fs.readFile` and cached in a module-scoped `Promise`:

```ts
import fs from "node:fs/promises";
import path from "node:path";

const fontRegular = fs.readFile(
  path.join(process.cwd(), "src/assets/fonts/JetBrainsMono-Regular.ttf")
);
const fontBold = fs.readFile(
  path.join(process.cwd(), "src/assets/fonts/JetBrainsMono-Bold.ttf")
);
```

Passed to `ImageResponse` via the `fonts` option.

### Metadata Integration

**`src/app/layout.tsx`** — add `metadataBase`:
```ts
metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
```
Note: The root layout uses `"use cache"` with `cacheLife("max")`, but the `metadata` export is evaluated independently from the render function, so there is no conflict.

**`src/app/roasts/[slug]/page.tsx`** — update `generateMetadata`:
```ts
openGraph: {
  images: [{ url: `/roasts/${slug}/opengraph-image`, width: 1200, height: 630 }],
},
twitter: {
  card: "summary_large_image",
  images: [`/roasts/${slug}/opengraph-image`],
},
```

**`next.config.ts`** — add to existing config:
```ts
serverExternalPackages: ["@takumi-rs/core"],
```

**`.env.example`** — add:
```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Caching Strategy

- **Completed roasts:** `Cache-Control: public, max-age=31536000, immutable` — roast data is immutable after completion, so the image never changes.
- **Fallback (processing/failed):** `Cache-Control: public, max-age=60` — short TTL so crawlers pick up the dynamic image once the roast completes.
- **Format:** PNG (best compatibility across social platforms). Takumi's `ImageResponse` sets `Content-Type: image/png` automatically.

### Summary Truncation

Utility in `og-constants.ts`:
```ts
function truncateSummary(summary: string, maxLength = 120): string {
  if (summary.length <= maxLength) return summary;
  return summary.slice(0, maxLength).trimEnd() + "...";
}
```

The truncated summary is wrapped in curly double quotes: `\u201C${text}\u201D`.

## File Impact

| File | Change |
|------|--------|
| `src/app/roasts/[slug]/opengraph-image/route.tsx` | **NEW** — GET handler |
| `src/components/og/roast-og-image.tsx` | **NEW** — dynamic image component |
| `src/components/og/fallback-og-image.tsx` | **NEW** — fallback image component |
| `src/components/og/og-constants.ts` | **NEW** — shared constants and helpers |
| `src/assets/fonts/JetBrainsMono-Regular.ttf` | **NEW** — font file |
| `src/assets/fonts/JetBrainsMono-Bold.ttf` | **NEW** — font file |
| `src/app/layout.tsx` | **MODIFIED** — add `metadataBase` |
| `src/app/roasts/[slug]/page.tsx` | **MODIFIED** — add `openGraph` + `twitter` to metadata |
| `next.config.ts` | **MODIFIED** — add `serverExternalPackages` |
| `.env.example` | **MODIFIED** — add `NEXT_PUBLIC_BASE_URL` |
| `package.json` | **MODIFIED** — add `@takumi-rs/image-response` dependency |

## Risks

- **Takumi native binary on CI/CD:** The `@takumi-rs/core` package includes platform-specific native binaries. CI and deployment environments must support one of the target triples (linux-x64-gnu, darwin-arm64, etc.). Takumi also offers a WASM fallback if needed.
- **Font file size:** JetBrains Mono .ttf files add ~200KB to the repo. Acceptable for this use case.
- **Social platform caching:** Some platforms (Twitter, Slack) cache OG images aggressively on their side. There is no way to force a refresh after a roast completes if the crawler already fetched the fallback. The 60s TTL mitigates this but does not eliminate it.

## Out of Scope

- Share button UI on the roast result page.
- OG image for the homepage or leaderboard page.
- Alternative image formats (WebP, JPEG) — PNG is the universal standard for OG images.
- Image storage/CDN — images are generated on demand with HTTP caching.

## TODO

- [ ] Install `@takumi-rs/image-response`
- [ ] Download JetBrains Mono font files (Regular 400 + Bold 700)
- [ ] Create `src/components/og/og-constants.ts` with colors, sizes, truncation, font loader
- [ ] Create `src/components/og/roast-og-image.tsx` replicating Pencil design
- [ ] Create `src/components/og/fallback-og-image.tsx` with generic branded image
- [ ] Create `src/app/roasts/[slug]/opengraph-image/route.tsx` with GET handler
- [ ] Update `src/app/layout.tsx` with `metadataBase`
- [ ] Update `src/app/roasts/[slug]/page.tsx` with OG/Twitter metadata
- [ ] Update `next.config.ts` with `serverExternalPackages`
- [ ] Update `.env.example` with `NEXT_PUBLIC_BASE_URL`
- [ ] Verify OG image renders correctly by visiting the route directly in a browser
- [ ] Test with social platform debuggers (`https://cards-dev.twitter.com/validator`, Facebook Sharing Debugger `https://developers.facebook.com/tools/debug/`)
