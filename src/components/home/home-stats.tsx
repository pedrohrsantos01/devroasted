import { AnimatedHomeStats } from "@/components/home/animated-home-stats";
import { caller } from "@/trpc/server";

export async function HomeStats() {
  const stats = await caller.metrics.home();

  return (
    <AnimatedHomeStats
      averageScore={stats.averageScore}
      totalRoastedCodes={stats.totalRoastedCodes}
    />
  );
}
