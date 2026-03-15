import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

import {
  parseRoastAnalysis,
  roastAnalysisSchema,
} from "@/server/roasts/analysis-contract";
import { buildRoastAnalysisPrompt } from "@/server/roasts/prompts";
import type { RoastAnalysisProvider } from "@/server/roasts/providers/provider";

const DEFAULT_MODEL = "gpt-4o-2024-08-06";

export function resolveOpenAIModel(model?: string) {
  return model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
}

export function createOpenAIRoastAnalysisProvider(input?: {
  client?: OpenAI;
  model?: string;
}): RoastAnalysisProvider {
  const client = input?.client ?? new OpenAI();
  const model = resolveOpenAIModel(input?.model);

  return {
    async analyze(analysisInput) {
      const completion = await client.chat.completions.parse({
        model,
        messages: buildRoastAnalysisPrompt(analysisInput),
        response_format: zodResponseFormat(
          roastAnalysisSchema,
          "roast_analysis",
        ),
      });

      const message = completion.choices[0]?.message;

      if (!message?.parsed) {
        throw new Error(
          message?.refusal ?? "OpenAI returned no parsed analysis.",
        );
      }

      return parseRoastAnalysis(message.parsed);
    },
  };
}
