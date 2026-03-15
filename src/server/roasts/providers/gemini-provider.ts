import { GoogleGenAI } from "@google/genai";

import {
  parseRoastAnalysis,
  roastAnalysisJsonSchema,
} from "@/server/roasts/analysis-contract";
import { buildRoastAnalysisPrompt } from "@/server/roasts/prompts";
import type { RoastAnalysisProvider } from "@/server/roasts/providers/provider";

const DEFAULT_MODEL = "gemini-3-flash-preview";
export const GEMINI_PROVIDER_TIMEOUT_MS = 20_000;

export function resolveGeminiModel(model?: string) {
  return model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
}

export function createGeminiRoastAnalysisProvider(input?: {
  apiKey?: string;
  client?: GoogleGenAI;
  model?: string;
  timeoutMs?: number;
}): RoastAnalysisProvider {
  const client =
    input?.client ??
    new GoogleGenAI({ apiKey: input?.apiKey ?? process.env.GEMINI_API_KEY });
  const model = resolveGeminiModel(input?.model);
  const timeoutMs = input?.timeoutMs ?? GEMINI_PROVIDER_TIMEOUT_MS;

  return {
    async analyze(analysisInput) {
      const response = await client.models.generateContent({
        model,
        contents: buildGeminiPromptContents(analysisInput),
        config: {
          httpOptions: {
            timeout: timeoutMs,
          },
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

function buildGeminiPromptContents(input: {
  code: string;
  language: string;
  lineCount: number;
  mode: "honest" | "roast";
  roastId: string;
}) {
  return buildRoastAnalysisPrompt(input)
    .map((message) => {
      const content = normalizePromptContent(message.content);

      return `${message.role.toUpperCase()}:\n${content}`;
    })
    .join("\n\n");
}

function normalizePromptContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (
        typeof part === "object" &&
        part !== null &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }

      return "";
    })
    .join("\n")
    .trim();
}
