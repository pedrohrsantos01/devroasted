# Roast Creation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real roast submission flow so users can paste code on the homepage, choose `honest` or `roast` mode, get redirected to `/roasts/[slug]`, and receive a full AI-generated roast that persists to the database and feeds the public leaderboard.

**Architecture:** Keep the homepage and result route server-first, but let the homepage client shell trigger a thin tRPC `roasts.submit` mutation. Move all analysis work into a small async pipeline with a provider-agnostic contract and a first OpenAI-backed adapter, then render `processing`, `completed`, and `failed` states from a single server query by slug.

**Tech Stack:** Next.js App Router, React 19, tRPC 11, TanStack Query, Drizzle ORM, PostgreSQL, Zod, OpenAI Node SDK, Node test runner via `tsx --test`, Biome.

---

## File Map

### New files

- `src/server/roasts/analysis-contract.ts` - Zod schema and types for validated AI output.
- `src/server/roasts/analysis-contract.test.ts` - contract parsing tests.
- `src/server/roasts/create-public-slug.ts` - slug generation helper.
- `src/server/roasts/create-public-slug.test.ts` - slug helper tests.
- `src/server/roasts/submit-roast.ts` - thin domain service that creates a roast row and triggers processing.
- `src/server/roasts/submit-roast.test.ts` - submit service tests with stubs.
- `src/server/roasts/prompts.ts` - prompt builder for `honest` vs `roast` modes.
- `src/server/roasts/providers/provider.ts` - provider interface and adapter factory contract.
- `src/server/roasts/providers/openai-provider.ts` - first concrete AI adapter using structured output.
- `src/server/roasts/pipeline/trigger-roast-processing.ts` - atomic work claimer.
- `src/server/roasts/pipeline/trigger-roast-processing.test.ts` - claim behavior tests.
- `src/server/roasts/pipeline/run-roast-analysis-pipeline.ts` - load roast, analyze, validate, persist, fail safely.
- `src/server/roasts/pipeline/run-roast-analysis-pipeline.test.ts` - pipeline success/failure tests.
- `src/server/roasts/queries/get-roast-by-slug.ts` - server query that maps DB rows to page states.
- `src/server/roasts/queries/get-roast-by-slug.test.ts` - reader mapping tests.
- `src/trpc/routers/roasts.ts` - `submit` and `bySlug` procedures.
- `src/components/roast-result/roast-result-types.ts` - shared UI types for completed/processing/failed states.
- `src/components/roast-result/build-diff-lines.ts` - derive diff lines from `originalCode` and `improvedCode`.
- `src/components/roast-result/build-diff-lines.test.ts` - diff helper tests.
- `src/components/roast-result/roast-result-view.tsx` - completed-state page composition.
- `src/components/roast-result/roast-processing-state.tsx` - processing shell + skeleton state.
- `src/components/roast-result/roast-failed-state.tsx` - failed-state UI.
- `src/components/roast-result/get-poll-interval.ts` - polling interval helper.
- `src/components/roast-result/get-poll-interval.test.ts` - polling helper tests.
- `src/components/roast-result/roast-status-poller.tsx` - tiny client leaf that calls `router.refresh()` while processing.
- `src/app/roasts/[slug]/page.tsx` - new slug-based server route.
- `specs/roast-creation-spec.md` - implementation-facing feature spec required by repo rules.

### Modified files

- `package.json` - add `test` script and first provider dependency.
- `README.md` - document required env vars and the new real roast flow.
- `src/trpc/routers/_app.ts` - register `roastsRouter`.
- `src/components/home/home-code-editor.tsx` - expose selected language to the hero.
- `src/components/home/home-hero.tsx` - wire submit mutation, mode state, redirect, and inline errors.
- `src/components/roast-result/roast-issue-card.tsx` - consume shared result types instead of mock-only types.

### Deleted files

- `src/app/roasts/[id]/page.tsx` - replace the placeholder UUID page.
- `src/components/roast-result/roast-result-data.ts` - remove the mock result dependency.

## Chunk 1: Server Contracts And Async Pipeline

### Task 1: Add a test runner and lock the roast analysis contract

**Files:**
- Modify: `package.json`
- Create: `src/server/roasts/analysis-contract.ts`
- Test: `src/server/roasts/analysis-contract.test.ts`

- [ ] **Step 1: Add the test command before writing feature logic**

```json
{
  "scripts": {
    "test": "tsx --test src/**/*.test.ts"
  }
}
```

- [ ] **Step 2: Write the failing contract tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { parseRoastAnalysis } from "@/server/roasts/analysis-contract";

test("parseRoastAnalysis accepts a full roast payload", () => {
  const result = parseRoastAnalysis({
    score: 2.4,
    verdictLabel: "needs_serious_help",
    summary: "This function fights the language and wins for all the wrong reasons.",
    improvedCode: "const total = items.reduce((sum, item) => sum + item.price, 0);",
    findings: [
      {
        kind: "issue",
        severity: "critical",
        title: "Legacy loop",
        description: "Manual accumulation adds noise.",
        lineStart: 2,
        lineEnd: 5,
      },
    ],
  });

  assert.equal(result.findings.length, 1);
  assert.equal(result.verdictLabel, "needs_serious_help");
});

test("parseRoastAnalysis rejects malformed provider output", () => {
  assert.throws(
    () =>
      parseRoastAnalysis({
        score: 12,
        verdictLabel: "",
        summary: "",
        improvedCode: "",
        findings: [],
      }),
  );
});
```

- [ ] **Step 3: Run the contract tests to verify they fail**

Run: `pnpm exec tsx --test src/server/roasts/analysis-contract.test.ts`
Expected: FAIL with `Cannot find module '@/server/roasts/analysis-contract'`.

- [ ] **Step 4: Implement the validated contract with Zod**

```ts
import { z } from "zod";

const roastFindingSchema = z
  .object({
    kind: z.enum(["issue", "strength"]),
    severity: z.enum(["critical", "warning", "good"]),
    title: z.string().min(1).max(160),
    description: z.string().min(1),
    lineStart: z.number().int().positive().optional(),
    lineEnd: z.number().int().positive().optional(),
  })
  .refine(
    (value) =>
      value.lineStart === undefined ||
      value.lineEnd === undefined ||
      value.lineEnd >= value.lineStart,
    { message: "lineEnd must be greater than or equal to lineStart" },
  );

export const roastAnalysisSchema = z.object({
  score: z.number().min(0).max(10),
  verdictLabel: z.string().min(1),
  summary: z.string().min(1),
  improvedCode: z.string().min(1),
  findings: z.array(roastFindingSchema).min(1),
});

export type RoastAnalysis = z.infer<typeof roastAnalysisSchema>;

export function parseRoastAnalysis(input: unknown) {
  return roastAnalysisSchema.parse(input);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm exec tsx --test src/server/roasts/analysis-contract.test.ts`
Expected: PASS with `2 tests`.

- [ ] **Step 6: Commit the contract work**

```bash
git add package.json src/server/roasts/analysis-contract.ts src/server/roasts/analysis-contract.test.ts
git commit -m "test: add roast analysis contract"
```

### Task 2: Create the submit service and tRPC entry point

**Files:**
- Create: `src/server/roasts/create-public-slug.ts`
- Create: `src/server/roasts/create-public-slug.test.ts`
- Create: `src/server/roasts/submit-roast.ts`
- Test: `src/server/roasts/submit-roast.test.ts`
- Create: `src/trpc/routers/roasts.ts`
- Modify: `src/trpc/routers/_app.ts`

- [ ] **Step 1: Write the failing slug helper tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { createPublicSlug } from "@/server/roasts/create-public-slug";

test("createPublicSlug returns a URL-safe slug", () => {
  const slug = createPublicSlug("typescript");

  assert.match(slug, /^[a-z0-9-]{12,64}$/);
});
```

- [ ] **Step 2: Write the failing submit service tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { submitRoast } from "@/server/roasts/submit-roast";

test("submitRoast stores a public queued roast and triggers processing", async () => {
  let insertedRow: Record<string, unknown> | undefined;
  let triggeredId: string | undefined;

  const db = {
    insert: () => ({
      values: (row: Record<string, unknown>) => ({
        returning: async () => {
          insertedRow = row;
          return [{ id: "roast-id", publicSlug: row.publicSlug, status: "queued" }];
        },
      }),
    }),
  } as never;

  const result = await submitRoast({
    code: "const answer = 42;",
    db,
    language: "typescript",
    mode: "roast",
    triggerProcessing: async (roastId) => {
      triggeredId = roastId;
    },
  });

  assert.equal(result.publicSlug.length > 0, true);
  assert.equal(result.status, "queued");
  assert.equal(triggeredId, "roast-id");
  assert.equal(insertedRow?.visibility, "public");
});

test("submitRoast still returns the roast when trigger startup fails", async () => {
  const db = {
    insert: () => ({
      values: () => ({
        returning: async () => [{ id: "roast-id", publicSlug: "ts-deadbeef", status: "queued" }],
      }),
    }),
  } as never;

  const result = await submitRoast({
    code: "const answer = 42;",
    db,
    language: "typescript",
    mode: "roast",
    triggerProcessing: async () => {
      throw new Error("background trigger offline");
    },
  });

  assert.equal(result.publicSlug, "ts-deadbeef");
  assert.equal(result.status, "queued");
});
```

- [ ] **Step 3: Run the new tests to confirm failure**

Run: `pnpm exec tsx --test src/server/roasts/create-public-slug.test.ts src/server/roasts/submit-roast.test.ts`
Expected: FAIL with missing module errors.

- [ ] **Step 4: Implement the slug helper and submit service**

```ts
import { randomUUID } from "node:crypto";

export function createPublicSlug(language: string) {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  return `${language}-${suffix}`;
}
```

```ts
import { roasts } from "@/db/schema";
import { createPublicSlug } from "@/server/roasts/create-public-slug";

export async function submitRoast(input: {
  code: string;
  db: typeof import("@/db/client").db;
  language: typeof roasts.$inferInsert.language;
  mode: typeof roasts.$inferInsert.mode;
  triggerProcessing: (roastId: string) => Promise<void>;
}) {
  const lineCount = input.code.split("\n").length;

  const [created] = await input.db
    .insert(roasts)
    .values({
      language: input.language,
      lineCount,
      mode: input.mode,
      originalCode: input.code,
      publicSlug: createPublicSlug(input.language),
      status: "queued",
      visibility: "public",
    })
    .returning({
      id: roasts.id,
      publicSlug: roasts.publicSlug,
      status: roasts.status,
    });

  try {
    await input.triggerProcessing(created.id);
  } catch {
    // keep the roast queued so the result page can still render processing
  }

  return created;
}
```

- [ ] **Step 5: Add the `roasts` router and register it**

```ts
import { z } from "zod";

import { submitRoast } from "@/server/roasts/submit-roast";
import { triggerRoastProcessing } from "@/server/roasts/pipeline/trigger-roast-processing";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";

export const roastsRouter = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        code: z.string().trim().min(1).max(3000),
        language: z.enum([
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
        ]),
        mode: z.enum(["honest", "roast"]),
      }),
    )
    .mutation(({ ctx, input }) =>
      submitRoast({
        code: input.code,
        db: ctx.db,
        language: input.language,
        mode: input.mode,
        triggerProcessing: (roastId) => triggerRoastProcessing({ db: ctx.db, roastId }),
      }),
    ),
});
```

- [ ] **Step 6: Run the tests again**

Run: `pnpm exec tsx --test src/server/roasts/create-public-slug.test.ts src/server/roasts/submit-roast.test.ts`
Expected: PASS with `3 tests`.

- [ ] **Step 7: Commit the submit path**

```bash
git add src/server/roasts/create-public-slug.ts src/server/roasts/create-public-slug.test.ts src/server/roasts/submit-roast.ts src/server/roasts/submit-roast.test.ts src/trpc/routers/roasts.ts src/trpc/routers/_app.ts
git commit -m "feat: add roast submission router"
```

### Task 3: Add the OpenAI-backed provider and async pipeline

**Files:**
- Modify: `package.json`
- Create: `src/server/roasts/prompts.ts`
- Create: `src/server/roasts/providers/provider.ts`
- Create: `src/server/roasts/providers/openai-provider.ts`
- Create: `src/server/roasts/pipeline/trigger-roast-processing.ts`
- Test: `src/server/roasts/pipeline/trigger-roast-processing.test.ts`
- Create: `src/server/roasts/pipeline/run-roast-analysis-pipeline.ts`
- Test: `src/server/roasts/pipeline/run-roast-analysis-pipeline.test.ts`

- [ ] **Step 1: Add the provider dependency**

Run: `pnpm add openai`
Expected: `dependencies: + openai`.

- [ ] **Step 2: Write the failing trigger and pipeline tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { triggerRoastProcessing } from "@/server/roasts/pipeline/trigger-roast-processing";

test("triggerRoastProcessing only claims queued roasts", async () => {
  let claimed = false;

  const db = {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => {
            claimed = true;
            return [{ id: "roast-id" }];
          },
        }),
      }),
    }),
  } as never;

  await triggerRoastProcessing({
    db,
    roastId: "roast-id",
    runPipeline: async () => undefined,
  });

  assert.equal(claimed, true);
});

test("triggerRoastProcessing exits quietly when the roast is already claimed", async () => {
  let pipelineStarted = false;

  const db = {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => [],
        }),
      }),
    }),
  } as never;

  await triggerRoastProcessing({
    db,
    roastId: "roast-id",
    runPipeline: async () => {
      pipelineStarted = true;
    },
  });

  assert.equal(pipelineStarted, false);
});

test("triggerRoastProcessing also no-ops for completed or failed roasts", async () => {
  let pipelineStarted = false;

  const db = {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => [],
        }),
      }),
    }),
  } as never;

  await triggerRoastProcessing({
    db,
    roastId: "completed-roast-id",
    runPipeline: async () => {
      pipelineStarted = true;
    },
  });

  assert.equal(pipelineStarted, false);
});
```

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { runRoastAnalysisPipeline } from "@/server/roasts/pipeline/run-roast-analysis-pipeline";

function createFakeDbThatCapturesWrites(writes: Array<string>) {
  return {
    delete: () => ({ where: async () => writes.push("delete-findings") }),
    insert: () => ({ values: async () => writes.push("insert-findings") }),
    query: {
      roasts: {
        findFirst: async () => ({
          id: "roast-id",
          language: "typescript",
          lineCount: 8,
          mode: "roast",
          originalCode: "const answer = items.map((item) => item.price);",
          status: "processing",
        }),
      },
    },
    update: () => ({
      set: (payload: Record<string, unknown>) => ({
        where: async () => {
          writes.push(payload.status === "failed" ? "mark-failed" : "update-roast");
        },
      }),
    }),
  } as never;
}

test("runRoastAnalysisPipeline persists completed output", async () => {
  const writes: Array<string> = [];

  await runRoastAnalysisPipeline({
    db: createFakeDbThatCapturesWrites(writes),
    provider: {
      analyze: async () => ({
        score: 1.9,
        verdictLabel: "architectural_crime_scene",
        summary: "This snippet treats readability as optional.",
        improvedCode: "const total = items.reduce((sum, item) => sum + item.price, 0);",
        findings: [
          {
            kind: "issue",
            severity: "critical",
            title: "Noisy loop",
            description: "The loop obscures the intent.",
          },
        ],
      }),
    },
    roastId: "roast-id",
  });

  assert.deepEqual(writes, ["update-roast", "insert-findings"]);
});

test("runRoastAnalysisPipeline marks the roast failed on malformed findings", async () => {
  const writes: Array<string> = [];

  await runRoastAnalysisPipeline({
    db: createFakeDbThatCapturesWrites(writes),
    provider: {
      analyze: async () => ({
        score: 1.9,
        verdictLabel: "architectural_crime_scene",
        summary: "This snippet treats readability as optional.",
        improvedCode: "const total = items.reduce((sum, item) => sum + item.price, 0);",
        findings: [
          {
            kind: "issue",
            severity: "critical",
            title: "Out-of-range finding",
            description: "This line range should be rejected.",
            lineStart: 99,
            lineEnd: 100,
          },
        ],
      }),
    },
    roastId: "roast-id",
  });

  assert.equal(writes.includes("mark-failed"), true);
});
```

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `pnpm exec tsx --test src/server/roasts/pipeline/trigger-roast-processing.test.ts src/server/roasts/pipeline/run-roast-analysis-pipeline.test.ts`
Expected: FAIL with missing module errors.

- [ ] **Step 4: Implement the provider boundary and the first adapter**

```ts
export interface RoastAnalysisProvider {
  analyze(input: {
    roastId: string;
    code: string;
    language: string;
    lineCount: number;
    mode: "honest" | "roast";
  }): Promise<import("@/server/roasts/analysis-contract").RoastAnalysis>;
}
```

```ts
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

import {
  parseRoastAnalysis,
  roastAnalysisSchema,
} from "@/server/roasts/analysis-contract";
import { buildRoastPrompt } from "@/server/roasts/prompts";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const openAIRoastAnalysisProvider = {
  async analyze(input) {
    const completion = await client.chat.completions.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-2024-08-06",
      messages: buildRoastPrompt(input),
      response_format: zodResponseFormat(roastAnalysisSchema, "roast_analysis"),
    });

    return parseRoastAnalysis(completion.choices[0]?.message.parsed);
  },
};
```

- [ ] **Step 5: Implement the trigger and pipeline executor**

```ts
export async function triggerRoastProcessing(input: {
  db: typeof import("@/db/client").db;
  roastId: string;
  runPipeline?: (roastId: string) => Promise<void>;
}) {
  const runner = input.runPipeline ?? ((roastId) => runRoastAnalysisPipeline({ db: input.db, provider: openAIRoastAnalysisProvider, roastId }));

  const [claimed] = await input.db
    .update(roasts)
    .set({ status: "processing", updatedAt: new Date() })
    .where(and(eq(roasts.id, input.roastId), eq(roasts.status, "queued")))
    .returning({ id: roasts.id });

  if (!claimed) {
    return;
  }

  void runner(input.roastId);
}
```

```ts
export async function runRoastAnalysisPipeline(input: {
  db: typeof import("@/db/client").db;
  provider: RoastAnalysisProvider;
  roastId: string;
}) {
  const roast = await input.db.query.roasts.findFirst({
    where: (roasts, { eq }) => eq(roasts.id, input.roastId),
  });

  if (!roast || roast.status !== "processing") {
    return;
  }

  try {
    const analysis = await input.provider.analyze({
      code: roast.originalCode,
      language: roast.language,
      lineCount: roast.lineCount,
      mode: roast.mode,
      roastId: roast.id,
    });

    const findings = analysis.findings.map((finding, index) => {
      if (finding.lineStart && finding.lineStart > roast.lineCount) {
        throw new Error("lineStart exceeds submitted line count");
      }
      if (finding.lineEnd && finding.lineEnd > roast.lineCount) {
        throw new Error("lineEnd exceeds submitted line count");
      }

      return {
        description: finding.description,
        kind: finding.kind,
        lineEnd: finding.lineEnd,
        lineStart: finding.lineStart,
        roastId: roast.id,
        severity: finding.severity,
        sortOrder: index,
        title: finding.title,
      };
    });

    await input.db.transaction(async (tx) => {
      await tx.delete(roastFindings).where(eq(roastFindings.roastId, roast.id));
      await tx.insert(roastFindings).values(findings);
      await tx
        .update(roasts)
        .set({
          completedAt: new Date(),
          improvedCode: analysis.improvedCode,
          publishedAt: new Date(),
          score: analysis.score.toFixed(1),
          status: "completed",
          summary: analysis.summary,
          updatedAt: new Date(),
          verdictLabel: analysis.verdictLabel,
        })
        .where(eq(roasts.id, roast.id));
    });
  } catch {
    await input.db
      .update(roasts)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(roasts.id, roast.id));
  }
}
```

- [ ] **Step 6: Run the pipeline tests to verify they pass**

Run: `pnpm exec tsx --test src/server/roasts/pipeline/trigger-roast-processing.test.ts src/server/roasts/pipeline/run-roast-analysis-pipeline.test.ts`
Expected: PASS with all pipeline tests green.

- [ ] **Step 7: Commit the async pipeline**

```bash
git add package.json src/server/roasts/prompts.ts src/server/roasts/providers/provider.ts src/server/roasts/providers/openai-provider.ts src/server/roasts/pipeline/trigger-roast-processing.ts src/server/roasts/pipeline/trigger-roast-processing.test.ts src/server/roasts/pipeline/run-roast-analysis-pipeline.ts src/server/roasts/pipeline/run-roast-analysis-pipeline.test.ts
git commit -m "feat: add async roast analysis pipeline"
```

## Chunk 2: Homepage Submit And Slug-Based Result Page

### Task 4: Replace the mock result route with a slug-based reader and real page states

**Files:**
- Create: `src/server/roasts/queries/get-roast-by-slug.ts`
- Test: `src/server/roasts/queries/get-roast-by-slug.test.ts`
- Modify: `src/trpc/routers/roasts.ts`
- Create: `src/components/roast-result/roast-result-types.ts`
- Create: `src/components/roast-result/build-diff-lines.ts`
- Test: `src/components/roast-result/build-diff-lines.test.ts`
- Create: `src/components/roast-result/roast-result-view.tsx`
- Create: `src/components/roast-result/roast-processing-state.tsx`
- Create: `src/components/roast-result/roast-failed-state.tsx`
- Modify: `src/components/roast-result/roast-issue-card.tsx`
- Create: `src/app/roasts/[slug]/page.tsx`
- Delete: `src/app/roasts/[id]/page.tsx`
- Delete: `src/components/roast-result/roast-result-data.ts`

- [ ] **Step 1: Write the failing reader and diff tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { getRoastBySlug } from "@/server/roasts/queries/get-roast-by-slug";

test("getRoastBySlug maps queued roasts to processing state", async () => {
  const roast = await getRoastBySlug(createFakeDbWithQueuedRoast(), "ts-deadbeef");

  assert.equal(roast.state, "processing");
});

test("getRoastBySlug maps persisted processing roasts to processing state", async () => {
  const roast = await getRoastBySlug(createFakeDbWithProcessingRoast(), "ts-deadbeef");

  assert.equal(roast.state, "processing");
});

test("getRoastBySlug maps completed roasts to a full result payload", async () => {
  const roast = await getRoastBySlug(createFakeDbWithCompletedRoast(), "ts-deadbeef");

  assert.equal(roast.state, "completed");
  assert.equal(roast.roast.mode, "roast");
});

test("getRoastBySlug maps failed roasts to a failed state", async () => {
  const roast = await getRoastBySlug(createFakeDbWithFailedRoast(), "ts-deadbeef");

  assert.equal(roast.state, "failed");
});

test("getRoastBySlug returns null for unknown slugs", async () => {
  const roast = await getRoastBySlug(createFakeDbWithNoRoast(), "missing-slug");

  assert.equal(roast, null);
});
```

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { buildDiffLines } from "@/components/roast-result/build-diff-lines";

test("buildDiffLines marks changed lines as added or removed", () => {
  const diff = buildDiffLines("const a = 1;", "const answer = 1;");

  assert.equal(diff.some((line) => line.variant === "removed"), true);
  assert.equal(diff.some((line) => line.variant === "added"), true);
});
```

- [ ] **Step 2: Run the tests to confirm failure**

Run: `pnpm exec tsx --test src/server/roasts/queries/get-roast-by-slug.test.ts src/components/roast-result/build-diff-lines.test.ts`
Expected: FAIL with missing module errors.

- [ ] **Step 3: Implement the server reader and completed-state view types**

```ts
export type RoastPageState =
  | {
      state: "processing";
      roast: {
        createdAt: Date;
        language: string;
        mode: "honest" | "roast";
        originalCode: string;
        publicSlug: string;
      };
    }
  | {
      state: "completed";
      roast: {
        findings: Array<{
          description: string;
          label: "critical" | "warning" | "good";
          title: string;
          tone: "critical" | "warning" | "good";
        }>;
        improvedCode: string;
        language: import("shiki").BundledLanguage;
        mode: "honest" | "roast";
        originalCode: string;
        publicSlug: string;
        score: number;
        summary: string;
        verdictLabel: string;
      };
    }
  | {
      state: "failed";
      message: string;
      roast: {
        language: string;
        mode: "honest" | "roast";
        originalCode: string;
        publicSlug: string;
      };
    };
```

- [ ] **Step 4: Implement the result reader, diff helper, and page components**

```ts
export async function getRoastBySlug(db: typeof import("@/db/client").db, slug: string): Promise<RoastPageState | null> {
  const roast = await loadRoastWithFindings(db, slug);

  if (!roast) return null;
  if (roast.status === "queued" || roast.status === "processing") {
    return { state: "processing", roast: mapProcessingRoast(roast) };
  }
  if (roast.status === "failed") {
    return { state: "failed", roast: mapFailedRoast(roast), message: "analysis stalled out before the roast landed. try another snippet." };
  }

  return { state: "completed", roast: mapCompletedRoast(roast) };
}
```

```ts
export const roastsRouter = createTRPCRouter({
  submit: publicProcedure
    .input(submitRoastInputSchema)
    .mutation(({ ctx, input }) =>
      submitRoast({
        code: input.code,
        db: ctx.db,
        language: input.language,
        mode: input.mode,
        triggerProcessing: (roastId) => triggerRoastProcessing({ db: ctx.db, roastId }),
      }),
    ),
  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(({ ctx, input }) => getRoastBySlug(ctx.db, input.slug)),
});
```

```tsx
export default async function RoastResultPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();

  const { slug } = await params;
  const roast = await caller.roasts.bySlug({ slug });

  if (!roast) {
    notFound();
  }

  if (roast.state === "processing") {
    return <RoastProcessingState roast={roast.roast} />;
  }

  if (roast.state === "failed") {
    return <RoastFailedState roast={roast.roast} message={roast.message} />;
  }

  return <RoastResultView roast={roast.roast} />;
}
```

```tsx
export function RoastProcessingState({ roast }: { roast: ProcessingRoast }) {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-page text-foreground-inverse">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-16 pt-10 sm:px-8 lg:px-20">
        <section className="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
          <div className="size-40 animate-pulse rounded-full border-4 border-border-primary" />
          <div className="flex flex-1 flex-col gap-4">
            <div className="h-4 w-32 animate-pulse rounded-full bg-border-primary" />
            <div className="h-8 w-full max-w-3xl animate-pulse rounded-full bg-border-primary" />
          </div>
        </section>

        <SectionHeading title="your_submission" />
        <CodeBlock.Root>
          <CodeBlock.Content className="min-h-[424px]" lang={roast.language as BundledLanguage}>
            {roast.originalCode}
          </CodeBlock.Content>
        </CodeBlock.Root>

        <SectionHeading title="detailed_analysis" />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="h-40 animate-pulse rounded-md border border-border-primary bg-surface" />
          <div className="h-40 animate-pulse rounded-md border border-border-primary bg-surface" />
        </div>

        <SectionHeading title="suggested_fix" />
        <div className="h-64 animate-pulse rounded-md border border-border-primary bg-surface-code" />
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Run the reader and diff tests**

Run: `pnpm exec tsx --test src/server/roasts/queries/get-roast-by-slug.test.ts src/components/roast-result/build-diff-lines.test.ts`
Expected: PASS with `6 tests` across the reader and diff helpers.

- [ ] **Step 6: Commit the real result route**

```bash
git add src/server/roasts/queries/get-roast-by-slug.ts src/server/roasts/queries/get-roast-by-slug.test.ts src/trpc/routers/roasts.ts src/components/roast-result/roast-result-types.ts src/components/roast-result/build-diff-lines.ts src/components/roast-result/build-diff-lines.test.ts src/components/roast-result/roast-result-view.tsx src/components/roast-result/roast-processing-state.tsx src/components/roast-result/roast-failed-state.tsx src/components/roast-result/roast-issue-card.tsx src/app/roasts/[slug]/page.tsx
git rm src/app/roasts/[id]/page.tsx src/components/roast-result/roast-result-data.ts
git commit -m "feat: add slug-based roast result page"
```

### Task 5: Wire homepage submit, processing polling, and the new CTA

**Files:**
- Modify: `src/components/home/home-code-editor.tsx`
- Modify: `src/components/home/home-hero.tsx`
- Create: `src/components/roast-result/get-poll-interval.ts`
- Test: `src/components/roast-result/get-poll-interval.test.ts`
- Create: `src/components/roast-result/roast-status-poller.tsx`
- Modify: `src/components/roast-result/roast-processing-state.tsx`
- Modify: `src/components/roast-result/roast-failed-state.tsx`

- [ ] **Step 1: Write the failing polling helper test**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { getPollInterval } from "@/components/roast-result/get-poll-interval";

test("getPollInterval slows down after one minute", () => {
  assert.equal(getPollInterval(15_000), 2_000);
  assert.equal(getPollInterval(75_000), 10_000);
});

test("getPollInterval reports a stalled state after five minutes", () => {
  assert.equal(getPollInterval(301_000), 10_000);
});
```

- [ ] **Step 2: Run the polling helper test and confirm failure**

Run: `pnpm exec tsx --test src/components/roast-result/get-poll-interval.test.ts`
Expected: FAIL with `Cannot find module '@/components/roast-result/get-poll-interval'`.

- [ ] **Step 3: Implement the polling helper and client leaf**

```ts
export function getPollInterval(elapsedMs: number) {
  return elapsedMs < 60_000 ? 2_000 : 10_000;
}
```

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getPollInterval } from "@/components/roast-result/get-poll-interval";

export function RoastStatusPoller({ createdAt }: { createdAt: string }) {
  const router = useRouter();
  const startedAt = useMemo(() => new Date(createdAt).getTime(), [createdAt]);
  const [isStalled, setIsStalled] = useState(() => Date.now() - startedAt >= 300_000);

  useEffect(() => {
    let timer: ReturnType<typeof window.setTimeout> | undefined;
    let stalledTimer: ReturnType<typeof window.setTimeout> | undefined;

    const tick = () => {
      router.refresh();
      timer = window.setTimeout(tick, getPollInterval(Date.now() - startedAt));
    };

    timer = window.setTimeout(tick, getPollInterval(Date.now() - startedAt));
    if (!isStalled) {
      stalledTimer = window.setTimeout(() => setIsStalled(true), Math.max(0, 300_000 - (Date.now() - startedAt)));
    }

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(stalledTimer);
    };
  }, [isStalled, router, startedAt]);

  return isStalled ? (
    <div className="border border-border-primary bg-surface px-4 py-3 font-sans text-[12px] text-subtle">
      analysis is taking longer than usual.
      <button className="ml-3 font-mono text-accent-green" onClick={() => router.refresh()}>
        $ check_again
      </button>
    </div>
  ) : null;
}
```

- [ ] **Step 4: Update the homepage components for real submit behavior**

```tsx
const [language, setLanguage] = useState<SupportedLanguageId>("plaintext");
const [mode, setMode] = useState<"honest" | "roast">("roast");
const [submitError, setSubmitError] = useState<string | null>(null);
const router = useRouter();
const trpc = useTRPC();

const submitRoast = useMutation(
  trpc.roasts.submit.mutationOptions({
    onError: () =>
      setSubmitError("failed to submit your snippet. paste it again and retry."),
    onSuccess: (result) => router.push(`/roasts/${result.publicSlug}`),
  }),
);

<HomeCodeEditor
  className="w-full max-w-[780px]"
  onCodeChange={setSnippet}
  onLanguageChange={setLanguage}
/>

<ToggleRoot checked={mode === "roast"} onCheckedChange={(checked) => setMode(checked ? "roast" : "honest")}>
  <ToggleThumb />
</ToggleRoot>

<Button
  disabled={isSendDisabled || submitRoast.isPending}
  onClick={() => {
    setSubmitError(null);
    submitRoast.mutate({
      code: snippet,
      language,
      mode,
    });
  }}
>
  $ roast_my_code
</Button>

{submitError ? <p className="font-sans text-[12px] text-critical">{submitError}</p> : null}
```

- [ ] **Step 5: Update processing and failed states to include the poller and the replacement CTA**

```tsx
<RoastStatusPoller createdAt={roast.createdAt.toISOString()} />
<Button asChild size="sm" variant="outline">
  <Link href="/">$ roast_another_snippet</Link>
</Button>
```

- [ ] **Step 6: Run the polling helper test**

Run: `pnpm exec tsx --test src/components/roast-result/get-poll-interval.test.ts`
Expected: PASS with `2 tests`.

- [ ] **Step 7: Commit the homepage and processing UI wiring**

```bash
git add src/components/home/home-code-editor.tsx src/components/home/home-hero.tsx src/components/roast-result/get-poll-interval.ts src/components/roast-result/get-poll-interval.test.ts src/components/roast-result/roast-status-poller.tsx src/components/roast-result/roast-processing-state.tsx src/components/roast-result/roast-failed-state.tsx
git commit -m "feat: wire homepage roast submission"
```

### Task 6: Final integration checks, docs, and repo-required feature spec

**Files:**
- Create: `specs/roast-creation-spec.md`
- Modify: `README.md`

- [ ] **Step 1: Write the product-facing feature spec required by the repo**

```md
# Roast Creation

## Objective

- Turn the homepage into a real roast submission flow.
- Redirect to `/roasts/[slug]` immediately after submit.
- Persist async AI analysis and show `processing`, `completed`, and `failed` result states.
- Keep `share roast` out of scope.
```

- [ ] **Step 2: Document the env requirements in `README.md`**

```md
### Environment

Create a local `.env` with:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-2024-08-06
DATABASE_URL=postgres://...
```
```

- [ ] **Step 3: Run targeted tests first**

Run: `pnpm exec tsx --test src/server/roasts/**/*.test.ts src/components/roast-result/**/*.test.ts`
Expected: PASS with all new roast tests green.

- [ ] **Step 4: Run lint and production build**

Run: `pnpm lint`
Expected: PASS with `Checked ... files`.

Run: `pnpm build`
Expected: PASS with `/`, `/leaderboard`, and `/roasts/[slug]` generated without route errors.

- [ ] **Step 5: Run manual verification**

Run: `pnpm dev`

Manually verify:

- Paste code on `/` and switch between `honest` and `roast`.
- Click `$ roast_my_code` and confirm redirect to `/roasts/[slug]`.
- Force a submit failure and confirm the homepage shows inline error text without navigation.
- Confirm the page shows the processing shell before the final result.
- Confirm a roast older than five minutes shows the stalled message and `$ check_again` refresh action.
- Confirm completed roasts render score, summary, findings, original code, and suggested fix.
- Confirm failed roasts show `$ roast_another_snippet`.
- Confirm a completed public roast appears in the existing leaderboard surfaces after completion or cache refresh.

- [ ] **Step 6: Commit the docs and verification pass**

```bash
git add README.md specs/roast-creation-spec.md
git commit -m "docs: add roast creation feature spec"
```
