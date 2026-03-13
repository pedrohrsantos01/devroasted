export const leaderboardRows = [
  {
    code: [
      'eval(prompt("enter code"))',
      "document.write(response)",
      "// trust the user lol",
    ],
    lang: "javascript",
    rank: "1",
    rankColor: "text-warning",
    score: "1.2",
  },
  {
    code: [
      "if (x == true) { return true; }",
      "else if (x == false) { return false; }",
      "else { return !false; }",
    ],
    lang: "typescript",
    rank: "2",
    rankColor: "text-muted",
    score: "1.8",
  },
  {
    code: ["SELECT * FROM users WHERE 1=1", "-- TODO: add authentication"],
    lang: "sql",
    rank: "3",
    rankColor: "text-muted",
    score: "2.1",
  },
] as const;
