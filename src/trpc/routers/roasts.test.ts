import assert from "node:assert/strict";
import test from "node:test";

import { ZodError } from "zod";

import { submitRoastInputSchema } from "@/server/roasts/submit-roast-input";

test("roasts.submit rejects code longer than 3000 characters", async () => {
  assert.throws(
    () =>
      submitRoastInputSchema.parse({
        code: "x".repeat(3001),
        language: "typescript",
        mode: "roast",
      }),
    (error) => {
      assert(error instanceof ZodError);
      assert.match(error.issues[0]?.message ?? "", /3000/);
      return true;
    },
  );
});
