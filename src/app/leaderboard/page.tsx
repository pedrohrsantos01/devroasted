import type { Metadata } from "next";
import {
  leaderboardEntries,
  leaderboardStats,
} from "@/components/leaderboard/leaderboard-data";
import { LeaderboardEntryCard } from "@/components/leaderboard/leaderboard-entry-card";

export const metadata: Metadata = {
  title: "Shame Leaderboard | devroast",
  description: "Browse the most roasted code snippets on devroast.",
  robots: {
    follow: true,
    index: true,
  },
};

export const dynamic = "force-dynamic";

async function getLeaderboardEntries() {
  return leaderboardEntries;
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboardEntries();

  return (
    <main className="min-h-[calc(100vh-56px)] bg-page text-foreground-inverse">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-16 pt-10 sm:px-8 lg:px-20">
        <section className="flex flex-col gap-4">
          <h1 className="flex flex-wrap items-center gap-3 font-mono text-[28px] font-bold tracking-[-0.04em] text-foreground-inverse sm:text-[32px]">
            <span className="text-accent-green">&gt;</span>
            <span>shame_leaderboard</span>
          </h1>

          <p className="font-mono text-[14px] text-muted">
            {"// the most roasted code on the internet"}
          </p>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[12px] text-subtle">
            <span>{leaderboardStats.submissions}</span>
            <span aria-hidden="true">·</span>
            <span>{leaderboardStats.averageScore}</span>
          </div>
        </section>

        <ol
          aria-label="Shame leaderboard entries"
          className="flex flex-col gap-5"
        >
          {entries.map((entry) => (
            <li key={entry.rank}>
              <LeaderboardEntryCard entry={entry} />
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
