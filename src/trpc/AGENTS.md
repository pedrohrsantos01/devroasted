# tRPC Patterns

- Standard stack: tRPC 11 + `@trpc/tanstack-react-query` + `superjson`; do not add `@trpc/react-query` or `@trpc/next`.
- `src/trpc/init.ts` owns the shared context and exports `createTRPCRouter`, `publicProcedure`, and `createCallerFactory`.
- `src/trpc/query-client.ts` owns QueryClient defaults; server creates one per request and the browser reuses a singleton through `src/trpc/client.tsx`.
- Client Components go through `/api/trpc`; Server Components prefer `caller`; use prefetch/hydration only when a client component needs the same query.
- Reuse Drizzle `db`, validate inputs with `zod`, and keep routers focused on the requested feature slice.
- Do not add extra procedures or routers ahead of scope.
