import assert from "node:assert/strict";
import test from "node:test";

import { triggerRoastProcessing } from "@/server/roasts/pipeline/trigger-roast-processing";

test("triggerRoastProcessing claims a queued roast and starts the pipeline", async () => {
  const updateCalls: Array<Record<string, unknown>> = [];
  const pipelineCalls: string[] = [];

  const db = {
    update: () => ({
      set: (values: Record<string, unknown>) => {
        updateCalls.push(values);

        return {
          where: () => ({
            returning: async () => [{ id: "roast-1" }],
          }),
        };
      },
    }),
  } as never;

  await triggerRoastProcessing({
    db,
    roastId: "roast-1",
    runPipeline: async ({ roastId }) => {
      pipelineCalls.push(roastId);
    },
  });

  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0]?.status, "processing");
  assert.equal(pipelineCalls.length, 1);
  assert.equal(pipelineCalls[0], "roast-1");
});

for (const status of ["processing", "completed", "failed"] as const) {
  test(`triggerRoastProcessing no-ops when the roast is already ${status}`, async () => {
    const pipelineCalls: string[] = [];

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
      roastId: "roast-1",
      runPipeline: async ({ roastId }) => {
        pipelineCalls.push(roastId);
      },
    });

    assert.deepEqual(pipelineCalls, []);
  });
}
