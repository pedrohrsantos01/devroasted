# devroast

devroast is a playful web app that turns bad code into public shame.

Instead of presenting feedback like a boring static analyzer, the experience leans into a terminal-inspired visual style, a roast-mode toggle, and a leaderboard of the most cursed snippets on the internet.

## What the app does

- lets people paste code into a dark editor-like input
- previews a roast flow with a strong terminal aesthetic
- highlights the most embarrassing snippets in a public leaderboard
- includes a reusable UI library and a components showcase page

## Current experience

- `/` - homepage with editable code input, roast mode toggle, and leaderboard preview
- `/leaderboard` - full static leaderboard page
- `/components` - visual playground for the shared UI components

## Current status

This project is currently a static product prototype.

That means the flows, content, scores, and leaderboard entries are mocked for now, but the app structure and UI system are already in place for future integrations.

## Design direction

- dark interface with terminal energy
- strong monospace identity for code-heavy surfaces
- green accent color for actions and system highlights
- reusable composed components instead of one-off page markup

## Running locally

```bash
corepack pnpm dev
```

Then open `http://localhost:3000`.
