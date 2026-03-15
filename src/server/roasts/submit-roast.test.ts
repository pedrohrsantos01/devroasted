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
          return [
            { id: "roast-id", publicSlug: row.publicSlug, status: "queued" },
          ];
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
        returning: async () => [
          { id: "roast-id", publicSlug: "ts-deadbeef", status: "queued" },
        ],
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
