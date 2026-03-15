import type { roasts } from "@/db/schema";

export type RoastIssueTone = "critical" | "warning" | "good";
export type RoastDiffVariant = "added" | "context" | "removed";

export interface RoastDiffLine {
  content: string;
  variant: RoastDiffVariant;
}

export interface RoastResultFinding {
  description: string;
  label: string;
  lineLabel?: string;
  title: string;
  tone: RoastIssueTone;
}

interface RoastResultBase {
  language: typeof roasts.$inferSelect.language;
  mode: typeof roasts.$inferSelect.mode;
  originalCode: string;
}

export interface RoastProcessingResult extends RoastResultBase {
  status: "processing";
}

export interface RoastFailedResult extends RoastResultBase {
  status: "failed";
  summary: string;
  title: string;
}

export interface RoastCompletedResult extends RoastResultBase {
  status: "completed";
  findings: ReadonlyArray<RoastResultFinding>;
  improvedCode: string;
  score: number;
  summary: string;
  verdictLabel: string;
}

export type RoastResultState =
  | RoastProcessingResult
  | RoastFailedResult
  | RoastCompletedResult;
