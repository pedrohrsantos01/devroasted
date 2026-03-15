import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

import {
  parseRoastAnalysis,
  roastAnalysisSchema,
} from "@/server/roasts/analysis-contract";
import { buildRoastAnalysisPrompt } from "@/server/roasts/prompts";
import type { RoastAnalysisProvider } from "@/server/roasts/providers/provider";

const DEFAULT_MODEL = "gpt-4o-mini";
export const OPENAI_PROVIDER_TIMEOUT_MS = 20_000;

export function resolveOpenAIModel(model?: string) {
  return model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
}

export function createOpenAIRoastAnalysisProvider(input?: {
  apiKey?: string;
  client?: OpenAI;
  model?: string;
  timeoutMs?: number;
}): RoastAnalysisProvider {
  const timeoutMs = input?.timeoutMs ?? OPENAI_PROVIDER_TIMEOUT_MS;
  const client =
    input?.client ?? new OpenAI({ apiKey: input?.apiKey, timeout: timeoutMs });
  const model = resolveOpenAIModel(input?.model);

  return {
    async analyze(analysisInput) {
      const completion = await client.chat.completions.parse(
        {
          model,
          messages: buildRoastAnalysisPrompt(analysisInput),
          response_format: zodResponseFormat(
            roastAnalysisSchema,
            "roast_analysis",
          ),
        },
        { timeout: timeoutMs },
      );

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
