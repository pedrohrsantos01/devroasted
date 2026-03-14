import type { BundledLanguage } from "shiki";

export type RoastIssueTone = "critical" | "warning" | "good";
export type RoastDiffVariant = "added" | "context" | "removed";

export interface RoastIssue {
  description: string;
  label: string;
  tone: RoastIssueTone;
  title: string;
}

export interface RoastDiffLine {
  content: string;
  variant: RoastDiffVariant;
}

export interface RoastResult {
  code: string;
  diffFileLabel: string;
  diffLines: ReadonlyArray<RoastDiffLine>;
  issues: ReadonlyArray<RoastIssue>;
  language: BundledLanguage;
  quote: string;
  score: number;
  verdict: string;
}

export const roastResultMock: RoastResult = {
  code: [
    "function calculateTotal(items) {",
    "  var total = 0;",
    "  for (var i = 0; i < items.length; i++) {",
    "    total = total + items[i].price;",
    "  }",
    "",
    "  if (total > 100) {",
    '    console.log("discount applied");',
    "    total = total * 0.9;",
    "  }",
    "",
    "  // TODO: handle tax calculation",
    "  // TODO: handle currency conversion",
    "",
    "  return total;",
    "}",
  ].join("\n"),
  diffFileLabel: "your_code.ts -> improved_code.ts",
  diffLines: [
    { content: "function calculateTotal(items) {", variant: "context" },
    { content: "  var total = 0;", variant: "removed" },
    {
      content: "  for (var i = 0; i < items.length; i++) {",
      variant: "removed",
    },
    { content: "    total = total + items[i].price;", variant: "removed" },
    { content: "  }", variant: "removed" },
    {
      content: "  return items.reduce((sum, item) => sum + item.price, 0);",
      variant: "added",
    },
    { content: "}", variant: "context" },
  ],
  issues: [
    {
      description:
        "var is function-scoped and leads to hoisting bugs. use const by default, let when reassignment is needed.",
      label: "critical",
      tone: "critical",
      title: "using var instead of const/let",
    },
    {
      description:
        "for loops are verbose and error-prone. use .reduce() or .map() for cleaner, functional transformations.",
      label: "warning",
      tone: "warning",
      title: "imperative loop pattern",
    },
    {
      description:
        "calculateTotal and items are descriptive, self-documenting names that communicate intent without comments.",
      label: "good",
      tone: "good",
      title: "clear naming conventions",
    },
    {
      description:
        "the function does one thing well - calculates a total. no side effects, no mixed concerns, no hidden complexity.",
      label: "good",
      tone: "good",
      title: "single responsibility",
    },
  ],
  language: "javascript",
  quote:
    '"this code looks like it was written during a power outage... in 2005."',
  score: 3.5,
  verdict: "needs_serious_help",
};
