import { count, eq, sql } from "drizzle-orm";

import { roasts } from "@/db/schema";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";

export const metricsRouter = createTRPCRouter({
  home: publicProcedure.query(async ({ ctx }) => {
    const [homeMetrics] = await ctx.db
      .select({
        averageScore: sql<string>`coalesce(round(avg(${roasts.score})::numeric, 1)::text, '0.0')`,
        totalRoastedCodes: count(),
      })
      .from(roasts)
      .where(eq(roasts.status, "completed"));

    return {
      averageScore: Number(homeMetrics?.averageScore ?? "0.0"),
      totalRoastedCodes: homeMetrics?.totalRoastedCodes ?? 0,
    };
  }),
});
