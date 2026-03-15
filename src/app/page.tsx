import { Suspense } from "react";
import { HomeHero } from "@/components/home/home-hero";
import { HomeStats } from "@/components/home/home-stats";
import { HomeStatsSkeleton } from "@/components/home/home-stats-skeleton";
import { LeaderboardPreview } from "@/components/home/leaderboard-preview";
import { LeaderboardPreviewSkeleton } from "@/components/home/leaderboard-preview-skeleton";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-page text-foreground-inverse">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-15 px-4 pb-20 pt-20 sm:px-6 md:px-10">
        <HomeHero>
          <Suspense fallback={<HomeStatsSkeleton />}>
            <HomeStats />
          </Suspense>
        </HomeHero>
        <Suspense fallback={<LeaderboardPreviewSkeleton />}>
          <LeaderboardPreview />
        </Suspense>
      </div>
    </main>
  );
}
