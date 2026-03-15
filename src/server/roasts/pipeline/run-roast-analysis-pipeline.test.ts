import assert from "node:assert/strict";
import test from "node:test";

import { runRoastAnalysisPipeline } from "@/server/roasts/pipeline/run-roast-analysis-pipeline";

test("runRoastAnalysisPipeline persists completed output", async () => {
  const insertedFindings: Record<string, unknown>[] = [];
  const roastUpdates: Record<string, unknown>[] = [];
  let deleteCallCount = 0;

  const db = {
    query: {
      roasts: {
        findFirst: async () => ({
          id: "roast-1",
          originalCode: "const answer = 42;",
          language: "typescript",
          lineCount: 1,
          mode: "roast",
          status: "processing",
        }),
      },
    },
    transaction: async (
      callback: (tx: {
        delete: () => { where: () => Promise<void> };
        insert: () => {
          values: (rows: Record<string, unknown>[]) => Promise<void>;
        };
        update: () => {
          set: (values: Record<string, unknown>) => {
            where: () => Promise<void>;
          };
        };
      }) => Promise<void>,
    ) => {
      await callback({
        delete: () => ({
          where: async () => {
            deleteCallCount += 1;
          },
        }),
        insert: () => ({
          values: async (rows: Record<string, unknown>[]) => {
            insertedFindings.push(...rows);
          },
        }),
        update: () => ({
          set: (values: Record<string, unknown>) => {
            roastUpdates.push(values);

            return {
              where: async () => {},
            };
          },
        }),
      });
    },
  } as never;

  await runRoastAnalysisPipeline({
    db,
    provider: {
      analyze: async () => ({
        score: 7.4,
        verdictLabel: "Needs polish",
        summary: "Pretty good, but still roastable.",
        improvedCode: "const answer = 42;\nconsole.log(answer);",
        findings: [
          {
            kind: "issue",
            severity: "warning",
            title: "Unused value",
            description: "The answer is never used.",
            lineStart: 1,
            lineEnd: 1,
          },
        ],
      }),
    },
    roastId: "roast-1",
  });

  assert.equal(deleteCallCount, 1);
  assert.equal(insertedFindings.length, 1);
  assert.equal(insertedFindings[0]?.roastId, "roast-1");
  assert.equal(insertedFindings[0]?.sortOrder, 0);
  assert.equal(roastUpdates.length, 1);
  assert.equal(roastUpdates[0]?.status, "completed");
  assert.equal(roastUpdates[0]?.verdictLabel, "Needs polish");
  assert.equal(roastUpdates[0]?.summary, "Pretty good, but still roastable.");
  assert.equal(roastUpdates[0]?.score, "7.4");
  assert.equal(typeof roastUpdates[0]?.completedAt, "object");
  assert.equal(typeof roastUpdates[0]?.publishedAt, "object");
});

test("runRoastAnalysisPipeline marks the roast failed when findings exceed lineCount", async () => {
  const roastUpdates: Record<string, unknown>[] = [];
  let insertCalled = false;

  const db = {
    query: {
      roasts: {
        findFirst: async () => ({
          id: "roast-1",
          originalCode: "const answer = 42;",
          language: "typescript",
          lineCount: 1,
          mode: "roast",
          status: "processing",
        }),
      },
    },
    transaction: async (
      callback: (tx: {
        delete: () => { where: () => Promise<void> };
        insert: () => {
          values: (rows: Record<string, unknown>[]) => Promise<void>;
        };
        update: () => {
          set: (values: Record<string, unknown>) => {
            where: () => Promise<void>;
          };
        };
      }) => Promise<void>,
    ) => {
      await callback({
        delete: () => ({
          where: async () => {},
        }),
        insert: () => ({
          values: async () => {
            insertCalled = true;
          },
        }),
        update: () => ({
          set: (values: Record<string, unknown>) => {
            roastUpdates.push(values);

            return {
              where: async () => {},
            };
          },
        }),
      });
    },
  } as never;

  await runRoastAnalysisPipeline({
    db,
    provider: {
      analyze: async () => ({
        score: 3,
        verdictLabel: "Broken",
        summary: "This should fail validation.",
        improvedCode: "const answer = 42;",
        findings: [
          {
            kind: "issue",
            severity: "critical",
            title: "Out of range",
            description: "References a line that does not exist.",
            lineStart: 2,
            lineEnd: 2,
          },
        ],
      }),
    },
    roastId: "roast-1",
  });

  assert.equal(insertCalled, false);
  assert.equal(roastUpdates.length, 1);
  assert.equal(roastUpdates[0]?.status, "failed");
  assert.equal(roastUpdates[0]?.improvedCode, null);
  assert.match(JSON.stringify(roastUpdates[0]?.meta), /lineCount/i);
});
