# Devroast

- Product: playful code-roasting app with a dark terminal-inspired interface.
- Stack: Next.js App Router, TypeScript, Tailwind v4, Biome, Base UI, Shiki (`vesper`).
- Layout: shared navbar lives in `src/app/layout.tsx`; page sections stay outside `src/components/ui`.
- UI: reusable primitives live in `src/components/ui`; multi-part components prefer composition over prop slots.
- Styling: use Tailwind theme tokens from `src/app/globals.css`; prefer `font-sans` for normal text and `font-mono` for technical text.
- Data: keep content static/mock unless API work is explicitly requested.
