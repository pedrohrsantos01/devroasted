import { LeaderboardTable } from "@/components/home/leaderboard-table";

const previewSkeletonRows = [0, 1, 2] as const;

export function LeaderboardPreviewSkeleton() {
  return (
    <section aria-busy="true" className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-[14px] font-bold text-foreground-inverse">
          <span className="text-accent-green">{"//"}</span>
          <span>shame_leaderboard</span>
        </div>

        <span className="h-8 w-28 animate-pulse rounded-md border border-border-primary bg-surface" />
      </div>

      <div className="h-3 w-64 animate-pulse rounded-full bg-border-primary" />

      <LeaderboardTable.Root>
        <LeaderboardTable.Head>
          <LeaderboardTable.HeadCell>#</LeaderboardTable.HeadCell>
          <LeaderboardTable.HeadCell>score</LeaderboardTable.HeadCell>
          <LeaderboardTable.HeadCell>code</LeaderboardTable.HeadCell>
          <LeaderboardTable.HeadCell>meta</LeaderboardTable.HeadCell>
        </LeaderboardTable.Head>

        <LeaderboardTable.Body>
          {previewSkeletonRows.map((row) => (
            <LeaderboardTable.Row
              className={
                row < previewSkeletonRows.length - 1
                  ? "border-b border-border-primary"
                  : undefined
              }
              key={row}
            >
              <LeaderboardTable.Cell className="flex items-center">
                <span className="h-3 w-3 animate-pulse rounded-full bg-border-primary" />
              </LeaderboardTable.Cell>
              <LeaderboardTable.Cell className="flex items-center">
                <span className="h-3 w-10 animate-pulse rounded-full bg-border-primary" />
              </LeaderboardTable.Cell>
              <LeaderboardTable.Cell className="min-w-0">
                <div className="flex min-w-0 flex-col gap-[6px] rounded-md border border-border-primary bg-surface-code px-3 py-3">
                  <span className="h-3 w-full animate-pulse rounded-full bg-border-primary" />
                  <span className="h-3 w-4/5 animate-pulse rounded-full bg-border-primary" />
                  <span className="h-3 w-2/3 animate-pulse rounded-full bg-border-primary" />
                </div>
              </LeaderboardTable.Cell>
              <LeaderboardTable.Cell className="flex flex-col items-start gap-3">
                <span className="h-3 w-14 animate-pulse rounded-full bg-border-primary" />
                <span className="h-3 w-[72px] animate-pulse rounded-full bg-border-primary" />
                <span className="h-6 w-24 animate-pulse rounded-md bg-border-primary" />
              </LeaderboardTable.Cell>
            </LeaderboardTable.Row>
          ))}
        </LeaderboardTable.Body>

        <LeaderboardTable.Footer>
          <div className="mx-auto h-3 w-72 animate-pulse rounded-full bg-border-primary" />
        </LeaderboardTable.Footer>
      </LeaderboardTable.Root>
    </section>
  );
}
