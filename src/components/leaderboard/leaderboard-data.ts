import type { BundledLanguage } from "shiki";

export interface LeaderboardEntry {
  code: string;
  language: BundledLanguage;
  rank: number;
  score: number;
}

export const leaderboardStats = {
  averageScore: "avg score: 4.2/10",
  submissions: "2,847 submissions",
} as const;

export const leaderboardEntries: ReadonlyArray<LeaderboardEntry> = [
  {
    code: [
      'eval(prompt("enter code"))',
      "document.write(response)",
      "// trust the user lol",
    ].join("\n"),
    language: "javascript",
    rank: 1,
    score: 1.2,
  },
  {
    code: [
      "if (x == true) { return true; }",
      "else if (x == false) { return false; }",
      "else { return !false; }",
    ].join("\n"),
    language: "typescript",
    rank: 2,
    score: 1.8,
  },
  {
    code: ["SELECT * FROM users WHERE 1=1", "-- TODO: add authentication"].join(
      "\n",
    ),
    language: "sql",
    rank: 3,
    score: 2.1,
  },
  {
    code: ["catch (e) {", "  // ignore", "}"].join("\n"),
    language: "java",
    rank: 4,
    score: 2.3,
  },
  {
    code: [
      "const sleep = (ms) =>",
      "  new Date(Date.now() + ms)",
      "  while(new Date() < end) {}",
    ].join("\n"),
    language: "javascript",
    rank: 5,
    score: 2.5,
  },
];
