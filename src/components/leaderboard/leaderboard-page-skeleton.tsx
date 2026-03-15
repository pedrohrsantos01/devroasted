const leaderboardSkeletonRows = [0, 1, 2, 3] as const;

export function LeaderboardPageSkeleton() {
  return (
    <>
      <section aria-busy="true" className="flex flex-col gap-4">
        <div className="h-9 w-72 animate-pulse rounded-full bg-border-primary" />
        <div className="h-4 w-64 animate-pulse rounded-full bg-border-primary" />
        <div className="h-3 w-96 animate-pulse rounded-full bg-border-primary" />
      </section>

      <div className="flex flex-col gap-5" aria-hidden="true">
        {leaderboardSkeletonRows.map((row) => (
          <article
            className="overflow-hidden border border-border-primary bg-page"
            key={row}
          >
            <div className="flex flex-col gap-3 border-b border-border-primary px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 sm:gap-6">
                  <span className="h-3 w-12 animate-pulse rounded-full bg-border-primary" />
                  <span className="h-3 w-16 animate-pulse rounded-full bg-border-primary" />
                </div>

                <div className="flex items-center gap-3">
                  <span className="h-3 w-14 animate-pulse rounded-full bg-border-primary" />
                  <span className="h-3 w-[72px] animate-pulse rounded-full bg-border-primary" />
                  <span className="h-6 w-24 animate-pulse rounded-md bg-border-primary" />
                </div>
              </div>
            </div>

            <div className="border-b border-border-primary bg-surface-code px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3">
                <span className="h-3 w-full animate-pulse rounded-full bg-border-primary" />
                <span className="h-3 w-5/6 animate-pulse rounded-full bg-border-primary" />
                <span className="h-3 w-2/3 animate-pulse rounded-full bg-border-primary" />
                <span className="h-3 w-3/4 animate-pulse rounded-full bg-border-primary" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
