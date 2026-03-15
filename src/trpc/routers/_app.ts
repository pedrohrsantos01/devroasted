import { createTRPCRouter } from "@/trpc/init";
import { leaderboardRouter } from "@/trpc/routers/leaderboard";
import { metricsRouter } from "@/trpc/routers/metrics";

export const appRouter = createTRPCRouter({
  leaderboard: leaderboardRouter,
  metrics: metricsRouter,
});

export type AppRouter = typeof appRouter;
