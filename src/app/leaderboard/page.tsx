import { leaderboardRows } from "@/components/home/leaderboard-data";
import { LeaderboardTable } from "@/components/home/leaderboard-table";

export default function LeaderboardPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-page text-foreground-inverse">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-8 px-4 pb-20 pt-20 sm:px-6 md:px-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 font-mono text-[14px] font-bold text-foreground-inverse">
            <span className="text-accent-green">{"//"}</span>
            <span>shame_leaderboard</span>
          </div>

          <h1 className="font-mono text-3xl font-bold tracking-[-0.04em] text-foreground-inverse sm:text-4xl">
            the worst code on the internet, ranked by shame.
          </h1>

          <p className="max-w-[720px] font-sans text-sm leading-6 text-muted md:text-[14px]">
            static demo data for now - no API, no auth, just pure public shame.
          </p>
        </div>

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
        </LeaderboardTable.Root>
      </div>
    </main>
  );
}
