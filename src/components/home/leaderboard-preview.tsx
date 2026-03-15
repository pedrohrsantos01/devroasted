import { cacheLife } from "next/cache";
import Link from "next/link";
import type { BundledLanguage } from "shiki";

import { LeaderboardPreviewEntry } from "@/components/home/leaderboard-preview-entry";
import { LeaderboardTable } from "@/components/home/leaderboard-table";
import { buttonVariants } from "@/components/ui";
import { CodeBlock } from "@/components/ui/server";
import { caller } from "@/trpc/server";

const countFormatter = new Intl.NumberFormat("en-US");
const scoreFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

export async function LeaderboardPreview() {
  "use cache";

  cacheLife("hours");

  const preview = await caller.leaderboard.preview();

  const footerCopy = `showing top ${preview.entries.length} of ${countFormatter.format(preview.stats.totalPublicRoasts)} public roasts · avg score: ${scoreFormatter.format(preview.stats.averageScore)}/10`;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-[14px] font-bold text-foreground-inverse">
          <span className="text-accent-green">{"//"}</span>
          <span>shame_leaderboard</span>
        </div>

        <Link
          className={buttonVariants({
            className:
              "border-border-primary bg-transparent px-3 py-1.5 text-[12px] font-normal text-muted focus-visible:ring-offset-page",
            size: "sm",
            variant: "outline",
          })}
          href="/leaderboard"
        >
          $ view_all &gt;&gt;
        </Link>
      </div>

      <p className="font-sans text-[13px] text-subtle">
        {"// the worst code on the internet, ranked by shame"}
      </p>

      <LeaderboardTable.Root>
        <LeaderboardTable.Head>
          <LeaderboardTable.HeadCell>#</LeaderboardTable.HeadCell>
          <LeaderboardTable.HeadCell>score</LeaderboardTable.HeadCell>
          <LeaderboardTable.HeadCell>code</LeaderboardTable.HeadCell>
          <LeaderboardTable.HeadCell>meta</LeaderboardTable.HeadCell>
        </LeaderboardTable.Head>

        <LeaderboardTable.Body>
          {preview.entries.length === 0 ? (
            <LeaderboardTable.Row>
              <LeaderboardTable.Cell className="col-span-4 py-2 text-center font-sans text-[13px] text-subtle">
                {"// no public roasts yet. be the first disaster."}
              </LeaderboardTable.Cell>
            </LeaderboardTable.Row>
          ) : (
            preview.entries.map((entry, index) => (
              <LeaderboardPreviewEntry
                entry={{
                  language: entry.language,
                  lineCount: entry.lineCount,
                  rank: entry.rank,
                  score: scoreFormatter.format(entry.score),
                }}
                expandedCode={
                  <CodeBlock.Root className="border-border-primary">
                    <CodeBlock.Content lang={entry.language as BundledLanguage}>
                      {entry.originalCode}
                    </CodeBlock.Content>
                  </CodeBlock.Root>
                }
                hasBorder={index < preview.entries.length - 1}
                key={entry.publicSlug}
                previewCode={
                  <CodeBlock.Content
                    className="max-h-28 overflow-hidden px-3"
                    lang={entry.language as BundledLanguage}
                    showLineNumbers={false}
                  >
                    {entry.originalCode}
                  </CodeBlock.Content>
                }
              />
            ))
          )}
        </LeaderboardTable.Body>

        <LeaderboardTable.Footer>{footerCopy}</LeaderboardTable.Footer>
      </LeaderboardTable.Root>
    </section>
  );
}
