import { GoogleGenAI } from "@google/genai";

import {
  parseRoastAnalysis,
  roastAnalysisJsonSchema,
} from "@/server/roasts/analysis-contract";
import { buildRoastAnalysisPrompt } from "@/server/roasts/prompts";
import type { RoastAnalysisProvider } from "@/server/roasts/providers/provider";

const DEFAULT_MODEL = "gemini-3-flash-preview";
export const GEMINI_PROVIDER_TIMEOUT_MS = 20_000;

export interface GeminiRoastAnalysisProviderConfig {
  apiKey?: string;
  client?: GoogleGenAI;
  model?: string;
  timeoutMs?: number;
}

export function resolveGeminiModel(model?: string) {
  return model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
}

export function createGeminiRoastAnalysisProvider(
  input?: GeminiRoastAnalysisProviderConfig,
): RoastAnalysisProvider {
  const client =
    input?.client ??
    new GoogleGenAI({ apiKey: input?.apiKey ?? process.env.GEMINI_API_KEY });
  const model = resolveGeminiModel(input?.model);
  const timeoutMs = input?.timeoutMs ?? GEMINI_PROVIDER_TIMEOUT_MS;

  return {
    async analyze(analysisInput) {
      const prompt = buildRoastAnalysisPrompt(analysisInput);

      const response = await client.models.generateContent({
        model,
        contents: prompt.userPrompt,
        config: {
          httpOptions: {
            timeout: timeoutMs,
          },
          systemInstruction: prompt.systemInstruction,
          responseJsonSchema: roastAnalysisJsonSchema,
          responseMimeType: "application/json",
        },
      });
      const text = response.text?.trim();

      if (!text) {
        throw new Error("Gemini returned an empty analysis response.");
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(text);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Gemini returned invalid JSON analysis: ${message}`);
      }

      return parseRoastAnalysis(parsed);
    },
  };
}
