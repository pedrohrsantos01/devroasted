import assert from "node:assert/strict";
import test from "node:test";

import { resolveOpenAIModel } from "@/server/roasts/providers/openai-provider";

test("resolveOpenAIModel uses OPENAI_MODEL by default", () => {
  const originalModel = process.env.OPENAI_MODEL;

  process.env.OPENAI_MODEL = "gpt-test-model";

  try {
    assert.equal(resolveOpenAIModel(), "gpt-test-model");
  } finally {
    if (originalModel === undefined) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = originalModel;
    }
  }
});
