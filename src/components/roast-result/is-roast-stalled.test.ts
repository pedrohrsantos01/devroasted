import assert from "node:assert/strict";
import test from "node:test";

const isRoastStalledModulePath = "./is-roast-stalled";

test("isRoastStalled stays false before five minutes", async () => {
  const { isRoastStalled } = await import(isRoastStalledModulePath).catch(
    () => ({
      isRoastStalled: undefined,
    }),
  );

  assert.equal(isRoastStalled?.(299_999), false);
});

test("isRoastStalled flips true at five minutes", async () => {
  const { isRoastStalled } = await import(isRoastStalledModulePath).catch(
    () => ({
      isRoastStalled: undefined,
    }),
  );

  assert.equal(isRoastStalled?.(300_000), true);
});
