import Link from "next/link";

import { leaderboardRows } from "@/components/home/leaderboard-data";
import { LeaderboardTable } from "@/components/home/leaderboard-table";
import { buttonVariants } from "@/components/ui";

export function LeaderboardPreview() {
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
          <LeaderboardTable.HeadCell>lang</LeaderboardTable.HeadCell>
        </LeaderboardTable.Head>

        <LeaderboardTable.Body>
          {leaderboardRows.map((row, index) => (
            <LeaderboardTable.Row
              key={row.rank}
              className={
                index < leaderboardRows.length - 1
                  ? "border-b border-border-primary"
                  : undefined
              }
            >
              <LeaderboardTable.Cell className={`font-mono ${row.rankColor}`}>
                {row.rank}
              </LeaderboardTable.Cell>
              <LeaderboardTable.Cell className="font-mono font-bold text-critical">
                {row.score}
              </LeaderboardTable.Cell>
              <LeaderboardTable.Cell className="flex min-w-0 flex-col gap-[3px]">
                {row.code.map((line) => {
                  const isComment =
                    line.startsWith("//") || line.startsWith("--");

                  return (
                    <p
                      key={`${index}-${line}`}
                      className={`truncate font-mono text-[12px] ${
                        isComment ? "text-subtle" : "text-foreground-inverse"
                      }`}
                    >
                      {line}
                    </p>
                  );
                })}
              </LeaderboardTable.Cell>
              <LeaderboardTable.Cell className="font-mono text-muted">
                {row.lang}
              </LeaderboardTable.Cell>
            </LeaderboardTable.Row>
          ))}
        </LeaderboardTable.Body>

        <LeaderboardTable.Footer>
          <Link
            className="underline decoration-border-primary underline-offset-4 transition duration-200 ease-out hover:text-foreground-inverse"
            href="/leaderboard"
          >
            showing top 3 of 2,847 - view full leaderboard &gt;&gt;
          </Link>
        </LeaderboardTable.Footer>
      </LeaderboardTable.Root>
    </section>
  );
}
