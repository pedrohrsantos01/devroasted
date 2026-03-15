import type { BundledLanguage } from "shiki";

import { CodeBlock } from "@/components/ui/server";

import { LeaderboardEntryCardShell } from "./leaderboard-entry-card-shell";
import type { LeaderboardEntry } from "./leaderboard-entry-types";

export interface LeaderboardEntryCardProps {
  entry: LeaderboardEntry;
}

export function LeaderboardEntryCard({ entry }: LeaderboardEntryCardProps) {
  return (
    <LeaderboardEntryCardShell
      entry={{
        language: entry.language,
        lineCount: entry.lineCount,
        rank: entry.rank,
        score: entry.score.toFixed(1),
      }}
      expandedCode={
        <CodeBlock.Root className="border-border-primary">
          <CodeBlock.Content lang={entry.language as BundledLanguage}>
            {entry.originalCode}
          </CodeBlock.Content>
        </CodeBlock.Root>
      }
      previewCode={
        <CodeBlock.Root className="border-0">
          <CodeBlock.Content
            className="px-4 sm:px-5"
            lang={entry.language as BundledLanguage}
            showLineNumbers={false}
          >
            {entry.originalCode}
          </CodeBlock.Content>
        </CodeBlock.Root>
      }
    />
  );
}
