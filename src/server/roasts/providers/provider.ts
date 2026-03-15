import type { RoastAnalysis } from "@/server/roasts/analysis-contract";

export interface RoastAnalysisProvider {
  analyze(input: {
    roastId: string;
    code: string;
    language: string;
    lineCount: number;
    mode: "honest" | "roast";
  }): Promise<RoastAnalysis>;
}
