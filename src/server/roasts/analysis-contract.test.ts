import assert from "node:assert/strict";
import test from "node:test";

import { parseRoastAnalysis } from "@/server/roasts/analysis-contract";

test("parseRoastAnalysis accepts a full roast payload", () => {
  const result = parseRoastAnalysis({
    score: 2.4,
    verdictLabel: "needs_serious_help",
    summary:
      "This function fights the language and wins for all the wrong reasons.",
    improvedCode:
      "const total = items.reduce((sum, item) => sum + item.price, 0);",
    findings: [
      {
        kind: "issue",
        severity: "critical",
        title: "Legacy loop",
        description: "Manual accumulation adds noise.",
        lineStart: 2,
        lineEnd: 5,
      },
    ],
  });

  assert.equal(result.findings.length, 1);
  assert.equal(result.verdictLabel, "needs_serious_help");
});

test("parseRoastAnalysis rejects malformed provider output", () => {
  assert.throws(() =>
    parseRoastAnalysis({
      score: 12,
      verdictLabel: "",
      summary: "",
      improvedCode: "",
      findings: [],
    }),
  );
});
