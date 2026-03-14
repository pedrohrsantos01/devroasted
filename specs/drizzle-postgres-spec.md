# Drizzle ORM + Postgres Spec

## Objective

Definir a primeira especificacao de persistencia do Devroast com:

- Drizzle ORM como camada de acesso a dados
- PostgreSQL rodando localmente via Docker Compose
- schema inicial suficiente para homepage, pagina de resultado e leaderboard publico
- plano de rollout para sair do estado 100% mockado sem supermodelar o produto

Este documento e especificacao de arquitetura e implementacao. Nao e para copiar e colar cegamente sem a etapa de execucao.

## Fontes consideradas

- `README.md` confirma que o produto ainda e um prototipo estatico, com homepage, leaderboard publico e UI reutilizavel
- `src/components/home/home-code-editor.tsx` mostra que hoje o input principal e um editor de codigo simples com `textarea`
- `src/components/home/leaderboard-data.ts` mostra o shape atual do leaderboard mockado: `rank`, `score`, `code[]`, `lang`
- `src/components/home/leaderboard-preview.tsx` e `src/app/leaderboard/page.tsx` mostram que o leaderboard exibe score, snippet e linguagem
- Layout inspecionado via Pencil mostra 4 telas relevantes:
  - `Screen 1 - Code Input`
  - `Screen 2 - Roast Results`
  - `Screen 3 - Shame Leaderboard`
  - `Screen 4 - OG Image`

## O que o layout pede para persistir

Pelo README e pelo layout do Pencil, o modelo minimo precisa suportar estes dados:

- submissao de codigo original
- linguagem do snippet
- modo de analise (`honest` vs `roast`)
- status do processamento (`queued`, `processing`, `completed`, `failed`)
- score final mostrado na tela de resultado e no leaderboard
- resumo curto/quote do roast
- codigo sugerido para o bloco de diff
- lista ordenada de findings para a secao `detailed_analysis`
- publicacao no leaderboard publico
- slug publico para share/OG image

## Recomendacao tecnica

Usar a stack abaixo:

- `drizzle-orm`
- `pg`
- `drizzle-kit`
- `dotenv`
- PostgreSQL em `docker-compose.yml`

Motivo da escolha do driver:

- `node-postgres` (`pg`) encaixa bem no runtime Node do Next.js local
- a documentacao oficial do Drizzle para PostgreSQL cobre muito bem `pg`, `drizzle.config.ts`, schema e migrations
- nao existe necessidade clara, neste momento, de um driver serverless-especifico

## Estrategia de migrations

Seguir fluxo code-first com Drizzle Kit:

1. definir schema em TypeScript
2. gerar migration com `drizzle-kit generate`
3. aplicar migration com `drizzle-kit migrate`

`drizzle-kit push` pode existir como apoio de desenvolvimento local, mas nao deve ser o fluxo principal versionado do projeto.

## Modelo recomendado

### Enums necessarios

#### `code_language`

Usar enum para o subconjunto inicial de linguagens que o produto deve suportar primeiro. Isso fica alinhado com a direcao do editor e com os mocks atuais.

Valores sugeridos:

- `javascript`
- `typescript`
- `jsx`
- `tsx`
- `sql`
- `python`
- `bash`
- `json`
- `html`
- `css`
- `go`
- `rust`
- `java`
- `php`
- `yaml`
- `markdown`
- `plaintext`

#### `roast_mode`

Representa o toggle atual da homepage.

- `honest`
- `roast`

#### `roast_status`

Necessario para suportar criacao da submissao antes da analise terminar.

- `queued`
- `processing`
- `completed`
- `failed`

#### `roast_visibility`

Melhor do que um boolean simples, porque abre espaco para moderacao sem quebrar schema depois.

- `private`
- `public`
- `hidden`

#### `finding_kind`

O layout de resultados tem observacoes negativas e positivas.

- `issue`
- `strength`

#### `finding_severity`

Mantem alinhamento com a linguagem visual dos badges/componentes do produto.

- `critical`
- `warning`
- `good`

### Tabelas necessarias

#### 1. `roasts`

Tabela principal do dominio. Cada clique em `roast_my_code` cria um registro aqui.

Colunas recomendadas:

| Coluna | Tipo | Regra | Motivo |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | identificador interno |
| `public_slug` | `varchar(64)` | unique, not null | URL publica para resultado/share |
| `original_code` | `text` | not null | codigo submetido pelo usuario |
| `improved_code` | `text` | nullable | codigo sugerido para gerar o diff |
| `language` | `code_language` | not null | linguagem exibida no resultado e leaderboard |
| `mode` | `roast_mode` | not null, default `roast` | estado do toggle de analise |
| `status` | `roast_status` | not null, default `queued` | controle do ciclo de vida |
| `visibility` | `roast_visibility` | not null, default `public` | publicacao/moderacao |
| `score` | `numeric(3,1)` | nullable | nota final de `0.0` a `10.0` |
| `verdict_label` | `text` | nullable | label curta do badge, ex.: `needs_serious_help` |
| `summary` | `text` | nullable | quote/resumo principal do roast |
| `line_count` | `integer` | not null | usado no resultado e leaderboard |
| `meta` | `jsonb` | nullable | provider, modelo, versao de prompt, confianca da deteccao etc. |
| `created_at` | `timestamp with time zone` | not null, default now | auditoria |
| `updated_at` | `timestamp with time zone` | not null, default now | auditoria |
| `completed_at` | `timestamp with time zone` | nullable | fim da analise |
| `published_at` | `timestamp with time zone` | nullable | momento em que entra no ranking publico |

Observacoes:

- `verdict_label` deve ser `text`, nao enum. Esse copy de produto tende a mudar mais que os enums tecnicos.
- `improved_code` e suficiente para a tela de diff; nao precisamos persistir diff linha a linha no v1.
- `meta` em `jsonb` evita criar colunas prematuras para detalhes operacionais.

Indices recomendados:

- unique em `public_slug`
- index composto para leaderboard: `visibility`, `status`, `score`, `created_at`
- index em `language`
- index em `created_at`

Checks recomendados:

- `score >= 0 and score <= 10`
- `line_count > 0`

#### 2. `roast_findings`

Tabela para a secao `detailed_analysis` da tela de resultados.

Colunas recomendadas:

| Coluna | Tipo | Regra | Motivo |
| --- | --- | --- | --- |
| `id` | `uuid` | PK | identificador interno |
| `roast_id` | `uuid` | FK -> `roasts.id`, not null | vincula finding ao roast |
| `kind` | `finding_kind` | not null | distingue `issue` de `strength` |
| `severity` | `finding_severity` | not null | define tom visual do card/badge |
| `title` | `varchar(160)` | not null | titulo curto do finding |
| `description` | `text` | not null | explicacao do finding |
| `sort_order` | `integer` | not null | ordem de exibicao na UI |
| `line_start` | `integer` | nullable | linha inicial afetada, se existir |
| `line_end` | `integer` | nullable | linha final afetada, se existir |
| `created_at` | `timestamp with time zone` | not null, default now | auditoria |

Indices recomendados:

- index composto em `roast_id`, `sort_order`

Checks recomendados:

- `sort_order >= 0`
- se `line_end` existir, ele deve ser `>= line_start`

#### 3. `__drizzle_migrations`

Essa tabela sera criada/gerenciada pelo proprio Drizzle para o historico de migrations. Nao modelar manualmente, mas considerar sua existencia no banco.

### Relacionamentos

- `roasts` 1:N `roast_findings`
- leaderboard publico = query sobre `roasts`, nao tabela propria
- OG image = leitura de um `roast` publicado, sem tabela extra no v1

## O que nao criar agora

Para o estado atual do produto, estas tabelas seriam overengineering:

- `users`
- `leaderboard_entries`
- `languages`
- `share_links`
- `diff_lines`
- `roast_runs`

Motivos:

- o README deixa claro que ainda nao existe auth
- o leaderboard pode ser derivado de `roasts`
- linguagens suportadas cabem melhor em enum neste momento
- o share publico cabe em `public_slug`
- o diff pode ser calculado a partir de `original_code` e `improved_code`

## Query shape esperada

### Homepage stats

Derivar de `roasts` com `status = 'completed'`:

- total de codigos roasted
- media de score

### Leaderboard

Consultar `roasts` com:

- `status = 'completed'`
- `visibility = 'public'`
- ordenacao por `score ASC, created_at DESC`

O preview da homepage pode reaproveitar a mesma query com `limit 3`.

### Pagina de resultado

Ler um roast por `public_slug` e carregar os findings ordenados por `sort_order`.

## Schema sketch em Drizzle

O objetivo deste trecho e guiar a implementacao, nao fechar o nome exato de todos os arquivos.

```ts
import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const codeLanguageEnum = pgEnum("code_language", [
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "sql",
  "python",
  "bash",
  "json",
  "html",
  "css",
  "go",
  "rust",
  "java",
  "php",
  "yaml",
  "markdown",
  "plaintext",
]);

export const roastModeEnum = pgEnum("roast_mode", ["honest", "roast"]);
export const roastStatusEnum = pgEnum("roast_status", [
  "queued",
  "processing",
  "completed",
  "failed",
]);
export const roastVisibilityEnum = pgEnum("roast_visibility", [
  "private",
  "public",
  "hidden",
]);
export const findingKindEnum = pgEnum("finding_kind", ["issue", "strength"]);
export const findingSeverityEnum = pgEnum("finding_severity", [
  "critical",
  "warning",
  "good",
]);

export const roasts = pgTable(
  "roasts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publicSlug: varchar("public_slug", { length: 64 }).notNull(),
    originalCode: text("original_code").notNull(),
    improvedCode: text("improved_code"),
    language: codeLanguageEnum("language").notNull(),
    mode: roastModeEnum("mode").notNull().default("roast"),
    status: roastStatusEnum("status").notNull().default("queued"),
    visibility: roastVisibilityEnum("visibility").notNull().default("public"),
    score: numeric("score", { precision: 3, scale: 1 }),
    verdictLabel: text("verdict_label"),
    summary: text("summary"),
    lineCount: integer("line_count").notNull(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("roasts_public_slug_idx").on(table.publicSlug),
    index("roasts_leaderboard_idx").on(
      table.visibility,
      table.status,
      table.score,
      table.createdAt,
    ),
    index("roasts_language_idx").on(table.language),
    index("roasts_created_at_idx").on(table.createdAt),
  ],
);

export const roastFindings = pgTable(
  "roast_findings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roastId: uuid("roast_id")
      .notNull()
      .references(() => roasts.id, { onDelete: "cascade" }),
    kind: findingKindEnum("kind").notNull(),
    severity: findingSeverityEnum("severity").notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull(),
    sortOrder: integer("sort_order").notNull(),
    lineStart: integer("line_start"),
    lineEnd: integer("line_end"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("roast_findings_roast_idx").on(table.roastId, table.sortOrder)],
);
```

## Estrutura de arquivos sugerida

- `docker-compose.yml`
- `.env.example`
- `drizzle.config.ts`
- `src/db/client.ts`
- `src/db/schema/index.ts`
- `src/db/schema/enums.ts`
- `src/db/schema/roasts.ts`
- `src/db/schema/roast-findings.ts`
- `drizzle/` para migrations geradas

## Docker Compose recomendado

Exemplo de composicao local:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: devroast-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: devroast
      POSTGRES_USER: devroast
      POSTGRES_PASSWORD: devroast
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devroast -d devroast"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

## Variaveis de ambiente

`DATABASE_URL` deve virar a fonte unica para Drizzle Kit e para o client da aplicacao.

Exemplo local:

```bash
DATABASE_URL=postgresql://devroast:devroast@localhost:5432/devroast
```

## `drizzle.config.ts` recomendado

Baseado no fluxo documentado pelo Drizzle para PostgreSQL:

```ts
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## `src/db/client.ts` recomendado

```ts
import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({ client: pool, schema });
```

## Scripts sugeridos no `package.json`

```json
{
  "db:up": "docker compose up -d postgres",
  "db:down": "docker compose down",
  "db:logs": "docker compose logs -f postgres",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

## Plano de implantacao

### Fase 1 - Infra local

- adicionar dependencias do Drizzle e do Postgres
- criar `docker-compose.yml`
- criar `.env.example` com `DATABASE_URL`
- subir Postgres localmente e validar conexao

### Fase 2 - Base de dados

- criar `drizzle.config.ts`
- criar `src/db/client.ts`
- modelar enums e tabelas iniciais em `src/db/schema/`
- gerar migration inicial
- aplicar migration no banco local

### Fase 3 - Dados mock -> dados reais

- criar seed inicial a partir dos exemplos de `src/components/home/leaderboard-data.ts`
- trocar `leaderboardRows` por query real no preview da homepage
- trocar a pagina `src/app/leaderboard/page.tsx` por query real
- preparar rota/pagina de resultados para leitura por `public_slug`

### Fase 4 - Endpoints / server actions

- criar fluxo de criacao de roast
- persistir submissao com `status = 'queued'`
- atualizar para `processing` e depois `completed`/`failed`
- persistir findings e `improved_code`

## TODO

- [ ] instalar `drizzle-orm`, `pg`, `drizzle-kit`, `dotenv` e `@types/pg`
- [ ] criar `docker-compose.yml` com Postgres local persistente
- [ ] adicionar `.env.example` com `DATABASE_URL`
- [ ] criar `drizzle.config.ts`
- [ ] criar `src/db/client.ts` protegido para uso server-side
- [ ] criar enums em `src/db/schema/enums.ts`
- [ ] criar tabela `roasts`
- [ ] criar tabela `roast_findings`
- [ ] gerar migration inicial versionada em `drizzle/`
- [ ] aplicar migration localmente com `drizzle-kit migrate`
- [ ] adicionar seed inicial com os 3 itens atuais do leaderboard mockado
- [ ] substituir `src/components/home/leaderboard-data.ts` por leitura real do banco
- [ ] ligar homepage stats (`codes roasted`, `avg score`) em agregacoes SQL reais
- [ ] criar leitura por `public_slug` para a futura pagina de resultados
- [ ] definir regra de publicacao no leaderboard (`public` por padrao ou opt-in)
- [ ] decidir se `updated_at` sera mantido pela app ou por trigger SQL

## Decisoes importantes

- manter o schema enxuto no v1
- usar `roasts` como agregado principal do dominio
- usar `roast_findings` para qualquer card de analise, positivo ou negativo
- nao criar tabela separada para leaderboard, diff ou share neste primeiro ciclo
- guardar dados operacionais flexiveis em `meta jsonb`

## Resultado esperado apos a implementacao

Quando essa especificacao for executada, o projeto deve sair de um leaderboard estatico para um fluxo com base real que suporta:

- criacao de roasts
- leitura de resultados por slug publico
- leaderboard alimentado do banco
- suporte limpo para futuras integracoes de IA sem refatorar o schema principal
