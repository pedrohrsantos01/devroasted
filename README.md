# devroast

## EN-US

devroast is a playful web app that turns bad code into public shame.

Instead of presenting feedback like a boring static analyzer, the experience leans into a terminal-inspired visual style, a roast-mode toggle, and a leaderboard of the most cursed snippets on the internet.

### What the app does

- lets people paste code into a dark editor-like input
- creates a roast, redirects to a public result page, and keeps processing in the background
- shows processing, completed, and failed roast states on the result route

### Current experience

- `/` - homepage with editable code input, roast mode toggle, and roast submission flow
- `/roasts/[slug]` - public roast result page with async status updates

### Current status

The roast creation flow now uses persisted async processing.

Submitting from the homepage creates a roast record, redirects immediately to `/roasts/[slug]`, and lets the result page reflect `processing`, `completed`, or `failed` based on the saved backend state.

### Environment variables

Create a local `.env` file with:

```bash
ROAST_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3-flash-preview
DATABASE_URL=postgresql://user:password@localhost:5432/devroast
```

- `ROAST_PROVIDER` - selects the roast analysis provider; defaults to `gemini`, can be set to `openai` as a fallback
- `GEMINI_API_KEY` - credential used by the default Gemini roast analysis pipeline
- `GEMINI_MODEL` - optional Gemini model override; defaults to `gemini-3-flash-preview`
- `DATABASE_URL` - PostgreSQL connection string used by the app and Drizzle

Optional OpenAI fallback:

```bash
ROAST_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

- `OPENAI_API_KEY` - credential used when `ROAST_PROVIDER=openai`
- `OPENAI_MODEL` - optional OpenAI model override used for the fallback provider

### Running locally

```bash
corepack pnpm install
corepack pnpm dev
```

Then open `http://localhost:3000`.

## PT-BR

devroast e um app web divertido que transforma codigo ruim em vergonha publica.

Em vez de apresentar feedback como um analisador estatico sem graca, a experiencia aposta em uma interface inspirada em terminal, um toggle de roast mode e um leaderboard com os snippets mais absurdos da internet.

### O que o app faz

- permite colar codigo em uma entrada com visual de editor escuro
- cria um roast, redireciona para uma pagina publica e continua o processamento em background
- mostra estados de processamento, sucesso e falha na pagina de resultado

### Experiencia atual

- `/` - homepage com editor de codigo, toggle de roast mode e fluxo de envio de roast
- `/roasts/[slug]` - pagina publica de resultado com atualizacao assincrona de status

### Estado atual

O fluxo de criacao de roast agora usa processamento assincrono persistido.

Ao enviar um snippet pela homepage, o app cria o registro do roast, redireciona imediatamente para `/roasts/[slug]` e deixa a pagina de resultado refletir `processing`, `completed` ou `failed` com base no estado salvo no backend.

### Variaveis de ambiente

Crie um arquivo local `.env` com:

```bash
ROAST_PROVIDER=gemini
GEMINI_API_KEY=sua_gemini_api_key
GEMINI_MODEL=gemini-3-flash-preview
DATABASE_URL=postgresql://user:password@localhost:5432/devroast
```

- `ROAST_PROVIDER` - seleciona o provedor da analise do roast; o padrao e `gemini`, com `openai` disponivel como fallback
- `GEMINI_API_KEY` - credencial usada pelo pipeline Gemini padrao
- `GEMINI_MODEL` - override opcional do modelo Gemini; o padrao e `gemini-3-flash-preview`
- `DATABASE_URL` - string de conexao PostgreSQL usada pela app e pelo Drizzle

Fallback opcional com OpenAI:

```bash
ROAST_PROVIDER=openai
OPENAI_API_KEY=sua_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

- `OPENAI_API_KEY` - credencial usada quando `ROAST_PROVIDER=openai`
- `OPENAI_MODEL` - override opcional do modelo OpenAI usado no provedor de fallback

### Rodando localmente

```bash
corepack pnpm install
corepack pnpm dev
```

Depois abra `http://localhost:3000`.
