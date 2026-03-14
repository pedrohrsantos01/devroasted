import { CodeBlock } from "@/components/ui/server";

import type { LeaderboardEntry } from "./leaderboard-data";

export interface LeaderboardEntryCardProps {
  entry: LeaderboardEntry;
}

function getLineLabel(code: string) {
  const lineCount = code.split("\n").length;

  return `${lineCount} ${lineCount === 1 ? "line" : "lines"}`;
}

export function LeaderboardEntryCard({ entry }: LeaderboardEntryCardProps) {
  return (
    <article className="overflow-hidden border border-border-primary bg-page">
      <div className="flex flex-col gap-3 border-b border-border-primary px-4 py-3 font-mono sm:min-h-12 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-0">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="text-subtle">#</span>
            <span className="font-bold text-warning">{entry.rank}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="text-subtle">score:</span>
            <span className="text-[13px] font-bold text-critical">
              {entry.score.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-[12px]">
          <span className="text-muted">{entry.language}</span>
          <span className="text-subtle">{getLineLabel(entry.code)}</span>
        </div>
      </div>

      <CodeBlock.Root className="border-0">
        <CodeBlock.Content lang={entry.language}>
          {entry.code}
        </CodeBlock.Content>
      </CodeBlock.Root>
    </article>
  );
}
