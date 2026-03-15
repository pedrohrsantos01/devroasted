import assert from "node:assert/strict";
import test from "node:test";

import { buildDiffLines } from "@/components/roast-result/build-diff-lines";

test("buildDiffLines marks changed lines as removed and added", () => {
  const result = buildDiffLines({
    improvedCode: "const total = items.reduce(sumPrices, 0);\nreturn total;",
    originalCode: "let total = 0;\nreturn total;",
  });

  assert.deepEqual(result, [
    {
      content: "let total = 0;",
      variant: "removed",
    },
    {
      content: "const total = items.reduce(sumPrices, 0);",
      variant: "added",
    },
    {
      content: "return total;",
      variant: "context",
    },
  ]);
});
