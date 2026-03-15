import assert from "node:assert/strict";
import test from "node:test";

const getPollIntervalModulePath = "./get-poll-interval";

test("getPollInterval returns 2000 during the first minute", async () => {
  const { getPollInterval } = await import(getPollIntervalModulePath).catch(
    () => ({
      getPollInterval: undefined,
    }),
  );

  assert.equal(getPollInterval?.(59_999), 2_000);
});

test("getPollInterval returns 10000 after the first minute", async () => {
  const { getPollInterval } = await import(getPollIntervalModulePath).catch(
    () => ({
      getPollInterval: undefined,
    }),
  );

  assert.equal(getPollInterval?.(60_000), 10_000);
});
