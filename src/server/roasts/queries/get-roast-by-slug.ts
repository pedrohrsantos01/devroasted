import { and, asc, eq } from "drizzle-orm";

import type { RoastResultState } from "@/components/roast-result/roast-result-types";
import { roastFindings, roasts } from "@/db/schema";

const FAILED_TITLE = "This roast slipped off the grill";
const FAILED_SUMMARY =
  "The roast engine crashed before it could finish this analysis. Give it another shot in a moment.";

export async function getRoastBySlug(input: {
  db: typeof import("@/db/client").db;
  slug: string;
}): Promise<RoastResultState | null> {
  const roast = await input.db.query.roasts.findFirst({
    columns: {
      createdAt: true,
      id: true,
      improvedCode: true,
      language: true,
      mode: true,
      originalCode: true,
      score: true,
      status: true,
      summary: true,
      verdictLabel: true,
    },
    where: and(
      eq(roasts.publicSlug, input.slug),
      eq(roasts.visibility, "public"),
    ),
  });

  if (!roast) {
    return null;
  }

  if (roast.status === "queued" || roast.status === "processing") {
    return {
      language: roast.language,
      mode: roast.mode,
      originalCode: roast.originalCode,
      createdAt: roast.createdAt,
      status: "processing",
    };
  }

  if (roast.status === "failed") {
    return {
      language: roast.language,
      mode: roast.mode,
      originalCode: roast.originalCode,
      createdAt: roast.createdAt,
      status: "failed",
      summary: FAILED_SUMMARY,
      title: FAILED_TITLE,
    };
  }

  if (
    roast.improvedCode === null ||
    roast.score === null ||
    roast.summary === null ||
    roast.verdictLabel === null
  ) {
    return {
      language: roast.language,
      mode: roast.mode,
      originalCode: roast.originalCode,
      createdAt: roast.createdAt,
      status: "failed",
      summary: FAILED_SUMMARY,
      title: FAILED_TITLE,
    };
  }

  const findings = await input.db.query.roastFindings.findMany({
    columns: {
      description: true,
      lineEnd: true,
      lineStart: true,
      severity: true,
      title: true,
    },
    orderBy: asc(roastFindings.sortOrder),
    where: eq(roastFindings.roastId, roast.id),
  });

  return {
    findings: findings.map((finding) => ({
      description: finding.description,
      label: finding.severity,
      lineLabel: getLineLabel(finding.lineStart, finding.lineEnd),
      title: finding.title,
      tone: finding.severity,
    })),
    improvedCode: roast.improvedCode,
    language: roast.language,
    mode: roast.mode,
    originalCode: roast.originalCode,
    createdAt: roast.createdAt,
    score: Number(roast.score),
    status: "completed",
    summary: roast.summary,
    verdictLabel: roast.verdictLabel,
  };
}

function getLineLabel(lineStart?: number | null, lineEnd?: number | null) {
  if (lineStart === undefined || lineStart === null) {
    return undefined;
  }

  if (lineEnd === undefined || lineEnd === null || lineStart === lineEnd) {
    return `line ${lineStart}`;
  }

  return `lines ${lineStart}-${lineEnd}`;
}
