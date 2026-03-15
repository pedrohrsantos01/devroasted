import { and, eq } from "drizzle-orm";

import { roastFindings, roasts } from "@/db/schema";
import type { RoastAnalysis } from "@/server/roasts/analysis-contract";
import type { RoastAnalysisProvider } from "@/server/roasts/providers/provider";
import { createRoastAnalysisProvider } from "@/server/roasts/providers/provider-factory";

let defaultProvider: RoastAnalysisProvider | undefined;

export async function runRoastAnalysisPipeline(input: {
  db: typeof import("@/db/client").db;
  provider?: RoastAnalysisProvider;
  roastId: string;
}) {
  const roast = await input.db.query.roasts.findFirst({
    columns: {
      id: true,
      originalCode: true,
      language: true,
      lineCount: true,
      mode: true,
      status: true,
    },
    where: and(eq(roasts.id, input.roastId), eq(roasts.status, "processing")),
  });

  if (!roast) {
    return;
  }

  try {
    const analysis = await getProvider(input.provider).analyze({
      roastId: roast.id,
      code: roast.originalCode,
      language: roast.language,
      lineCount: roast.lineCount,
      mode: roast.mode,
    });

    validateFindings(analysis, roast.lineCount);
    await persistCompletedRoast({ analysis, db: input.db, roastId: roast.id });
  } catch (error) {
    await persistFailedRoast({
      db: input.db,
      error,
      roastId: roast.id,
    });
  }
}

function getProvider(provider?: RoastAnalysisProvider) {
  if (provider) {
    return provider;
  }

  defaultProvider ??= createRoastAnalysisProvider();

  return defaultProvider;
}

function validateFindings(analysis: RoastAnalysis, lineCount: number) {
  for (const finding of analysis.findings) {
    if (
      finding.lineStart !== undefined &&
      finding.lineStart !== null &&
      finding.lineStart > lineCount
    ) {
      throw new Error(
        `Finding "${finding.title}" lineStart ${finding.lineStart} exceeds lineCount ${lineCount}.`,
      );
    }

    if (
      finding.lineEnd !== undefined &&
      finding.lineEnd !== null &&
      finding.lineEnd > lineCount
    ) {
      throw new Error(
        `Finding "${finding.title}" lineEnd ${finding.lineEnd} exceeds lineCount ${lineCount}.`,
      );
    }
  }
}

async function persistCompletedRoast(input: {
  analysis: RoastAnalysis;
  db: typeof import("@/db/client").db;
  roastId: string;
}) {
  const now = new Date();

  await input.db.transaction(async (tx) => {
    await tx
      .delete(roastFindings)
      .where(eq(roastFindings.roastId, input.roastId));

    await tx.insert(roastFindings).values(
      input.analysis.findings.map((finding, index) => ({
        roastId: input.roastId,
        kind: finding.kind,
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        sortOrder: index,
        lineStart: finding.lineStart,
        lineEnd: finding.lineEnd,
      })),
    );

    await tx
      .update(roasts)
      .set({
        completedAt: now,
        improvedCode: input.analysis.improvedCode,
        meta: null,
        publishedAt: now,
        score: input.analysis.score.toFixed(1),
        status: "completed",
        summary: input.analysis.summary,
        updatedAt: now,
        verdictLabel: input.analysis.verdictLabel,
      })
      .where(eq(roasts.id, input.roastId));
  });
}

async function persistFailedRoast(input: {
  db: typeof import("@/db/client").db;
  error: unknown;
  roastId: string;
}) {
  const now = new Date();
  const message =
    input.error instanceof Error ? input.error.message : String(input.error);

  await input.db.transaction(async (tx) => {
    await tx
      .delete(roastFindings)
      .where(eq(roastFindings.roastId, input.roastId));

    await tx
      .update(roasts)
      .set({
        completedAt: now,
        improvedCode: null,
        meta: { failureReason: message },
        score: null,
        status: "failed",
        summary: null,
        updatedAt: now,
        verdictLabel: null,
      })
      .where(eq(roasts.id, input.roastId));
  });
}
