import {
  createGeminiRoastAnalysisProvider,
  type GeminiRoastAnalysisProviderConfig,
} from "@/server/roasts/providers/gemini-provider";
import {
  createOpenAIRoastAnalysisProvider,
  type OpenAIRoastAnalysisProviderConfig,
} from "@/server/roasts/providers/openai-provider";
import type { RoastAnalysisProvider } from "@/server/roasts/providers/provider";

type RoastProviderName = "gemini" | "openai";
type RoastProviderEnv = Partial<Record<string, string | undefined>>;

export function createRoastAnalysisProvider(input?: {
  createGeminiProvider?: (
    config?: GeminiRoastAnalysisProviderConfig,
  ) => RoastAnalysisProvider;
  createOpenAIProvider?: (
    config?: OpenAIRoastAnalysisProviderConfig,
  ) => RoastAnalysisProvider;
  env?: RoastProviderEnv;
}): RoastAnalysisProvider {
  const env = input?.env ?? process.env;
  const providerName = resolveRoastProviderName(env.ROAST_PROVIDER);

  if (providerName === "openai") {
    const apiKey = requireEnv(
      env.OPENAI_API_KEY,
      "OPENAI_API_KEY is required when ROAST_PROVIDER=openai.",
    );

    const model = env.OPENAI_MODEL;

    return (input?.createOpenAIProvider ?? createOpenAIRoastAnalysisProvider)({
      apiKey,
      model,
    });
  }

  const apiKey = requireEnv(
    env.GEMINI_API_KEY,
    "GEMINI_API_KEY is required when ROAST_PROVIDER=gemini.",
  );

  const model = env.GEMINI_MODEL;

  return (input?.createGeminiProvider ?? createGeminiRoastAnalysisProvider)({
    apiKey,
    model,
  });
}

export function resolveRoastProviderName(value?: string): RoastProviderName {
  if (value === undefined || value === "") {
    return "gemini";
  }

  if (value === "gemini" || value === "openai") {
    return value;
  }

  throw new Error(
    `Unsupported roast provider: ${value}. Expected "gemini" or "openai".`,
  );
}

function requireEnv(value: string | undefined, message: string) {
  if (!value) {
    throw new Error(message);
  }

  return value;
}
