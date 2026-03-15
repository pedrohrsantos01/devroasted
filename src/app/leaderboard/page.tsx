import type { Metadata } from "next";
import { Suspense } from "react";

import { LeaderboardPageContent } from "@/components/leaderboard/leaderboard-page-content";
import { LeaderboardPageSkeleton } from "@/components/leaderboard/leaderboard-page-skeleton";

export const metadata: Metadata = {
  title: "Shame Leaderboard | devroast",
  description: "Browse the most roasted code snippets on devroast.",
  robots: {
    follow: true,
    index: true,
  },
};

export default function LeaderboardPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-page text-foreground-inverse">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-16 pt-10 sm:px-8 lg:px-20">
        <Suspense fallback={<LeaderboardPageSkeleton />}>
          <LeaderboardPageContent />
        </Suspense>
      </div>
    </main>
  );
}
