import { createTRPCRouter } from "@/trpc/init";
import { leaderboardRouter } from "@/trpc/routers/leaderboard";
import { metricsRouter } from "@/trpc/routers/metrics";
import { roastsRouter } from "@/trpc/routers/roasts";

export const appRouter = createTRPCRouter({
  leaderboard: leaderboardRouter,
  metrics: metricsRouter,
  roasts: roastsRouter,
});

export type AppRouter = typeof appRouter;
