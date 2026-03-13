# devroast

## EN-US

devroast is a playful web app that turns bad code into public shame.

Instead of presenting feedback like a boring static analyzer, the experience leans into a terminal-inspired visual style, a roast-mode toggle, and a leaderboard of the most cursed snippets on the internet.

### What the app does

- lets people paste code into a dark editor-like input
- previews a roast flow with a strong terminal aesthetic
- highlights the most embarrassing snippets in a public leaderboard
- includes a reusable UI library and a components showcase page

### Current experience

- `/` - homepage with editable code input, roast mode toggle, and leaderboard preview
- `/leaderboard` - full static leaderboard page
- `/components` - visual playground for the shared UI components

### Current status

This project is currently a static product prototype.

That means the flows, content, scores, and leaderboard entries are mocked for now, but the app structure and UI system are already in place for future integrations.

### Design direction

- dark interface with terminal energy
- strong monospace identity for code-heavy surfaces
- green accent color for actions and system highlights
- reusable composed components instead of one-off page markup

### Running locally

```bash
corepack pnpm dev
```

Then open `http://localhost:3000`.

## PT-BR

devroast e um app web divertido que transforma codigo ruim em vergonha publica.

Em vez de apresentar feedback como um analisador estatico sem graca, a experiencia aposta em uma interface inspirada em terminal, um toggle de roast mode e um leaderboard com os snippets mais absurdos da internet.

### O que o app faz

- permite colar codigo em uma entrada com visual de editor escuro
- apresenta um fluxo de roast com identidade forte de terminal
- destaca os codigos mais vergonhosos em um leaderboard publico
- inclui uma biblioteca de UI reutilizavel e uma pagina de showcase de componentes

### Experiencia atual

- `/` - homepage com editor de codigo, toggle de roast mode e preview do leaderboard
- `/leaderboard` - pagina completa e estatica do leaderboard
- `/components` - playground visual dos componentes compartilhados

### Estado atual

Este projeto atualmente e um prototipo estatico de produto.

Isso significa que os fluxos, conteudos, notas e entradas do leaderboard ainda sao mockados, mas a estrutura do app e o sistema de UI ja estao prontos para futuras integracoes.

### Direcao visual

- interface escura com energia de terminal
- identidade monospaced forte para superficies de codigo
- acento verde para acoes e destaques do sistema
- componentes compostos e reutilizaveis em vez de markup isolado por pagina

### Rodando localmente

```bash
corepack pnpm dev
```

Depois abra `http://localhost:3000`.
