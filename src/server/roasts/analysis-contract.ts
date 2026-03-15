import { z } from "zod";

const roastFindingSchema = z
  .object({
    kind: z.enum(["issue", "strength"]),
    severity: z.enum(["critical", "warning", "good"]),
    title: z.string().min(1).max(160),
    description: z.string().min(1),
    lineStart: z.number().int().positive().nullable(),
    lineEnd: z.number().int().positive().nullable(),
  })
  .refine(
    (value) =>
      value.lineStart === null ||
      value.lineEnd === null ||
      value.lineEnd >= value.lineStart,
    {
      message: "lineEnd must be greater than or equal to lineStart",
      path: ["lineEnd"],
    },
  );

export const roastAnalysisSchema = z.object({
  score: z.number().min(0).max(10),
  verdictLabel: z.string().min(1),
  summary: z.string().min(1),
  improvedCode: z.string().min(1),
  findings: z.array(roastFindingSchema).min(1),
});

export const roastAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: {
      type: "number",
      minimum: 0,
      maximum: 10,
    },
    verdictLabel: {
      type: "string",
      minLength: 1,
    },
    summary: {
      type: "string",
      minLength: 1,
    },
    improvedCode: {
      type: "string",
      minLength: 1,
    },
    findings: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          kind: {
            type: "string",
            enum: ["issue", "strength"],
          },
          severity: {
            type: "string",
            enum: ["critical", "warning", "good"],
          },
          title: {
            type: "string",
            minLength: 1,
            maxLength: 160,
          },
          description: {
            type: "string",
            minLength: 1,
          },
          lineStart: {
            anyOf: [
              {
                type: "integer",
                minimum: 1,
              },
              {
                type: "null",
              },
            ],
          },
          lineEnd: {
            anyOf: [
              {
                type: "integer",
                minimum: 1,
              },
              {
                type: "null",
              },
            ],
          },
        },
        required: [
          "kind",
          "severity",
          "title",
          "description",
          "lineStart",
          "lineEnd",
        ],
      },
    },
  },
  required: ["score", "verdictLabel", "summary", "improvedCode", "findings"],
} as const;

export type RoastAnalysis = z.infer<typeof roastAnalysisSchema>;

export function parseRoastAnalysis(input: unknown) {
  return roastAnalysisSchema.parse(input);
}
