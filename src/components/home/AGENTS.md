# Home Patterns

- Keep the homepage server-first; async data should start in server components.
- `HomeHero` is the interactive client shell; pass async server data through children/slots instead of hardcoding request-time values inside it.
- For async metrics or other small sections, use `Suspense` plus a dedicated `*-skeleton.tsx` fallback from the page.
- Use a small client leaf only when animation or browser-only APIs are needed.
- When loaded metrics should animate from zero or a placeholder to the real value, prefer `@number-flow/react` and keep locale/format explicit.
- Expand homepage data integrations one slice at a time.
