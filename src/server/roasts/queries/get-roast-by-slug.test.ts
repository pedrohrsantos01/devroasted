import assert from "node:assert/strict";
import test from "node:test";

import { getRoastBySlug } from "@/server/roasts/queries/get-roast-by-slug";

const createdAt = new Date("2026-03-15T12:00:00.000Z");

function createDb(input: {
  findings?: ReadonlyArray<Record<string, unknown>>;
  roast: Record<string, unknown> | null;
  updateReturning?: ReadonlyArray<Record<string, unknown>>;
}) {
  return {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => input.updateReturning ?? [],
        }),
      }),
    }),
    query: {
      roastFindings: {
        findMany: async () => input.findings ?? [],
      },
      roasts: {
        findFirst: async () => input.roast,
      },
    },
  } as never;
}

test("getRoastBySlug maps queued roasts to processing", async () => {
  const triggerCalls: string[] = [];

  const result = await getRoastBySlug({
    db: createDb({
      roast: {
        id: "roast-queued",
        createdAt,
        language: "typescript",
        mode: "roast",
        originalCode: "const answer = 42;",
        publicSlug: "ts-answer-1234",
        status: "queued",
        updatedAt: createdAt,
      },
    }),
    slug: "ts-answer-1234",
    triggerProcessing: async (roastId) => {
      triggerCalls.push(roastId);
    },
  });

  assert.deepEqual(result, {
    createdAt,
    language: "typescript",
    mode: "roast",
    originalCode: "const answer = 42;",
    status: "processing",
  });
  assert.deepEqual(triggerCalls, ["roast-queued"]);
});

test("getRoastBySlug maps persisted processing roasts to processing", async () => {
  const result = await getRoastBySlug({
    db: createDb({
      roast: {
        id: "roast-processing",
        createdAt,
        language: "javascript",
        mode: "honest",
        originalCode: "console.log('still cooking');",
        publicSlug: "js-still-cooking",
        status: "processing",
        updatedAt: createdAt,
      },
    }),
    slug: "js-still-cooking",
  });

  assert.deepEqual(result, {
    createdAt,
    language: "javascript",
    mode: "honest",
    originalCode: "console.log('still cooking');",
    status: "processing",
  });
});

test("getRoastBySlug reclaims stale processing roasts and re-triggers the pipeline", async () => {
  const triggerCalls: string[] = [];

  const result = await getRoastBySlug({
    db: createDb({
      roast: {
        id: "roast-processing",
        createdAt,
        language: "javascript",
        mode: "honest",
        originalCode: "console.log('still cooking');",
        publicSlug: "js-still-cooking",
        status: "processing",
        updatedAt: new Date("2026-03-15T11:40:00.000Z"),
      },
      updateReturning: [{ id: "roast-processing" }],
    }),
    now: new Date("2026-03-15T12:00:00.000Z"),
    slug: "js-still-cooking",
    triggerProcessing: async (roastId) => {
      triggerCalls.push(roastId);
    },
  });

  assert.deepEqual(result, {
    createdAt,
    language: "javascript",
    mode: "honest",
    originalCode: "console.log('still cooking');",
    status: "processing",
  });
  assert.deepEqual(triggerCalls, ["roast-processing"]);
});

test("getRoastBySlug does not reclaim fresh processing roasts", async () => {
  const triggerCalls: string[] = [];

  const result = await getRoastBySlug({
    db: createDb({
      roast: {
        id: "roast-processing",
        createdAt,
        language: "javascript",
        mode: "honest",
        originalCode: "console.log('still cooking');",
        publicSlug: "js-still-cooking",
        status: "processing",
        updatedAt: new Date("2026-03-15T11:58:00.000Z"),
      },
      updateReturning: [{ id: "roast-processing" }],
    }),
    now: new Date("2026-03-15T12:00:00.000Z"),
    slug: "js-still-cooking",
    triggerProcessing: async (roastId) => {
      triggerCalls.push(roastId);
    },
  });

  assert.deepEqual(result, {
    createdAt,
    language: "javascript",
    mode: "honest",
    originalCode: "console.log('still cooking');",
    status: "processing",
  });
  assert.deepEqual(triggerCalls, []);
});

test("getRoastBySlug maps completed roasts to the full result payload", async () => {
  const result = await getRoastBySlug({
    db: createDb({
      findings: [
        {
          description: "The answer never gets used after assignment.",
          lineEnd: 1,
          lineStart: 1,
          severity: "warning",
          title: "Unused value",
        },
        {
          description: "The constant name is clear and direct.",
          lineEnd: 2,
          lineStart: 1,
          severity: "good",
          title: "Clear naming",
        },
      ],
      roast: {
        id: "roast-completed",
        createdAt,
        improvedCode: "const answer = 42;\nconsole.log(answer);",
        language: "typescript",
        mode: "honest",
        originalCode: "const answer = 42;",
        publicSlug: "ts-answer-finished",
        score: "7.4",
        status: "completed",
        summary: "Pretty good, but still roastable.",
        verdictLabel: "Needs polish",
      },
    }),
    slug: "ts-answer-finished",
  });

  assert.deepEqual(result, {
    createdAt,
    findings: [
      {
        description: "The answer never gets used after assignment.",
        label: "warning",
        lineLabel: "line 1",
        title: "Unused value",
        tone: "warning",
      },
      {
        description: "The constant name is clear and direct.",
        label: "good",
        lineLabel: "lines 1-2",
        title: "Clear naming",
        tone: "good",
      },
    ],
    improvedCode: "const answer = 42;\nconsole.log(answer);",
    language: "typescript",
    mode: "honest",
    originalCode: "const answer = 42;",
    score: 7.4,
    status: "completed",
    summary: "Pretty good, but still roastable.",
    verdictLabel: "Needs polish",
  });
});

test("getRoastBySlug maps failed roasts to a friendly failure payload", async () => {
  const result = await getRoastBySlug({
    db: createDb({
      roast: {
        id: "roast-failed",
        createdAt,
        language: "typescript",
        mode: "roast",
        originalCode: "const answer = 42;",
        publicSlug: "ts-answer-failed",
        status: "failed",
      },
    }),
    slug: "ts-answer-failed",
  });

  assert.deepEqual(result, {
    createdAt,
    language: "typescript",
    mode: "roast",
    originalCode: "const answer = 42;",
    status: "failed",
    summary:
      "The roast engine crashed before it could finish this analysis. Give it another shot in a moment.",
    title: "This roast slipped off the grill",
  });
});

test("getRoastBySlug returns null for unknown slugs", async () => {
  const result = await getRoastBySlug({
    db: createDb({ roast: null }),
    slug: "missing-slug",
  });

  assert.equal(result, null);
});
