# App Router Patterns

- Pages and layouts stay server-first by default.
- Keep shared client providers in `src/app/providers.tsx` and keep `src/app/layout.tsx` lean.
- For async sections, render an async server component and wrap it with `Suspense` from the page, paired with a dedicated skeleton component.
- Only opt into `force-dynamic` when the route depends on request-time data or uncached database reads.
- If the data source is tRPC, server components should use `caller` or server helpers, not `fetch("/api/trpc")`.
