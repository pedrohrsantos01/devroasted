import { cacheLife } from "next/cache";

import { LeaderboardEntryCard } from "@/components/leaderboard/leaderboard-entry-card";
import { caller } from "@/trpc/server";

const countFormatter = new Intl.NumberFormat("en-US");
const scoreFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

export async function LeaderboardPageContent() {
  "use cache";

  cacheLife("hours");

  const leaderboard = await caller.leaderboard.list();

  const headerCopy = `showing worst ${leaderboard.entries.length} of ${countFormatter.format(leaderboard.stats.totalPublicRoasts)} public roasts · avg score: ${scoreFormatter.format(leaderboard.stats.averageScore)}/10`;

  return (
    <>
      <section className="flex flex-col gap-4">
        <h1 className="flex flex-wrap items-center gap-3 font-mono text-[28px] font-bold tracking-[-0.04em] text-foreground-inverse sm:text-[32px]">
          <span className="text-accent-green">&gt;</span>
          <span>shame_leaderboard</span>
        </h1>

        <p className="font-mono text-[14px] text-muted">
          {"// the most roasted code on the internet"}
        </p>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[12px] text-subtle">
          <span>{headerCopy}</span>
        </div>
      </section>

      {leaderboard.entries.length === 0 ? (
        <section className="border border-border-primary bg-page px-6 py-10 text-center">
          <div className="mx-auto flex max-w-xl flex-col gap-3">
            <p className="font-mono text-[14px] text-foreground-inverse">
              {"> no public roasts found"}
            </p>
            <p className="font-sans text-[14px] text-subtle">
              {"publish a catastrophe first, then come back for the rankings."}
            </p>
          </div>
        </section>
      ) : (
        <ol
          aria-label="Shame leaderboard entries"
          className="flex flex-col gap-5"
        >
          {leaderboard.entries.map((entry) => (
            <li key={entry.publicSlug}>
              <LeaderboardEntryCard entry={entry} />
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
