import { and, asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";

import { roasts } from "@/db/schema";
import type { TRPCContext } from "@/trpc/init";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";

const PREVIEW_LIMIT = 3;
const LEADERBOARD_PAGE_LIMIT = 20;

function getPublicCompletedRoastsFilter() {
  return and(
    eq(roasts.status, "completed"),
    eq(roasts.visibility, "public"),
    isNotNull(roasts.score),
  );
}

async function getLeaderboardEntries(ctx: TRPCContext, limit: number) {
  const rows = await ctx.db
    .select({
      language: roasts.language,
      lineCount: roasts.lineCount,
      originalCode: roasts.originalCode,
      publicSlug: roasts.publicSlug,
      score: roasts.score,
    })
    .from(roasts)
    .where(getPublicCompletedRoastsFilter())
    .orderBy(asc(roasts.score), desc(roasts.createdAt))
    .limit(limit);

  return rows.map((entry, index) => ({
    language: entry.language,
    lineCount: entry.lineCount,
    originalCode: entry.originalCode,
    publicSlug: entry.publicSlug,
    rank: index + 1,
    score: Number(entry.score ?? "0"),
  }));
}

async function getLeaderboardStats(ctx: TRPCContext) {
  const [statsRow] = await ctx.db
    .select({
      averageScore: sql<string>`coalesce(round(avg(${roasts.score})::numeric, 1)::text, '0.0')`,
      totalPublicRoasts: count(),
    })
    .from(roasts)
    .where(getPublicCompletedRoastsFilter());

  return {
    averageScore: Number(statsRow?.averageScore ?? "0.0"),
    totalPublicRoasts: statsRow?.totalPublicRoasts ?? 0,
  };
}

export const leaderboardRouter = createTRPCRouter({
  preview: publicProcedure.query(async ({ ctx }) => {
    const [entries, stats] = await Promise.all([
      getLeaderboardEntries(ctx, PREVIEW_LIMIT),
      getLeaderboardStats(ctx),
    ]);

    return {
      entries,
      stats,
    };
  }),
  list: publicProcedure.query(async ({ ctx }) => {
    const [entries, stats] = await Promise.all([
      getLeaderboardEntries(ctx, LEADERBOARD_PAGE_LIMIT),
      getLeaderboardStats(ctx),
    ]);

    return {
      entries,
      stats,
    };
  }),
});
