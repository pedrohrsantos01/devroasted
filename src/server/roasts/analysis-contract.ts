import { z } from "zod";

const roastFindingSchema = z
  .object({
    kind: z.enum(["issue", "strength"]),
    severity: z.enum(["critical", "warning", "good"]),
    title: z.string().min(1).max(160),
    description: z.string().min(1),
    lineStart: z.number().int().positive().optional(),
    lineEnd: z.number().int().positive().optional(),
  })
  .refine(
    (value) =>
      value.lineStart === undefined ||
      value.lineEnd === undefined ||
      value.lineEnd >= value.lineStart,
    { message: "lineEnd must be greater than or equal to lineStart" },
  );

export const roastAnalysisSchema = z.object({
  score: z.number().min(0).max(10),
  verdictLabel: z.string().min(1),
  summary: z.string().min(1),
  improvedCode: z.string().min(1),
  findings: z.array(roastFindingSchema).min(1),
});

export type RoastAnalysis = z.infer<typeof roastAnalysisSchema>;

export function parseRoastAnalysis(input: unknown) {
  return roastAnalysisSchema.parse(input);
}
