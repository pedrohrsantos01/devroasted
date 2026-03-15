import assert from "node:assert/strict";
import test from "node:test";

import { getRoastBySlug } from "@/server/roasts/queries/get-roast-by-slug";

const createdAt = new Date("2026-03-15T12:00:00.000Z");

function createDb(input: {
  findings?: ReadonlyArray<Record<string, unknown>>;
  roast: Record<string, unknown> | null;
}) {
  return {
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
      },
    }),
    slug: "ts-answer-1234",
  });

  assert.deepEqual(result, {
    createdAt,
    language: "typescript",
    mode: "roast",
    originalCode: "const answer = 42;",
    status: "processing",
  });
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
