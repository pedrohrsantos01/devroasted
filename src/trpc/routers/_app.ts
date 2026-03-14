import { createTRPCRouter } from "@/trpc/init";
import { metricsRouter } from "@/trpc/routers/metrics";

export const appRouter = createTRPCRouter({
  metrics: metricsRouter,
});

export type AppRouter = typeof appRouter;
