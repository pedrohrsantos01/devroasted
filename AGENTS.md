# Devroast

- Product: playful code-roasting app with a dark terminal-inspired interface.
- Stack: Next.js App Router, TypeScript, Tailwind v4, Biome, Base UI, Shiki (`vesper`).
- Feature flow: for any non-trivial feature, write `specs/<feature>-spec.md` before implementation.
- Scope: implement only the requested slice; do not scaffold extra routes, procedures, or UI ahead of scope.
- App Router: prefer Server Components by default; move to client only for interaction, animation, or browser-only APIs.
- Loading UX: prefer `Suspense` plus dedicated skeleton components for async sections.
- Layout: shared navbar lives in `src/app/layout.tsx`; page sections stay outside `src/components/ui`.
- UI: reusable primitives live in `src/components/ui`; multi-part components prefer composition over prop slots.
- Styling: use Tailwind theme tokens from `src/app/globals.css`; prefer `font-sans` for normal text and `font-mono` for technical text.
- Data: keep content static/mock unless backend work is explicitly requested; when it is, use the tRPC + Drizzle patterns in `src/trpc` instead of ad-hoc fetch layers.
