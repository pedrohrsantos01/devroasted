import { createGeminiRoastAnalysisProvider } from "@/server/roasts/providers/gemini-provider";
import { createOpenAIRoastAnalysisProvider } from "@/server/roasts/providers/openai-provider";
import type { RoastAnalysisProvider } from "@/server/roasts/providers/provider";

type RoastProviderName = "gemini" | "openai";
type RoastProviderEnv = Partial<Record<string, string | undefined>>;

export function createRoastAnalysisProvider(input?: {
  createGeminiProvider?: () => RoastAnalysisProvider;
  createOpenAIProvider?: () => RoastAnalysisProvider;
  env?: RoastProviderEnv;
}): RoastAnalysisProvider {
  const env = input?.env ?? process.env;
  const providerName = resolveRoastProviderName(env.ROAST_PROVIDER);

  if (providerName === "openai") {
    requireEnv(
      env.OPENAI_API_KEY,
      "OPENAI_API_KEY is required when ROAST_PROVIDER=openai.",
    );

    return (input?.createOpenAIProvider ?? createOpenAIRoastAnalysisProvider)();
  }

  requireEnv(
    env.GEMINI_API_KEY,
    "GEMINI_API_KEY is required when ROAST_PROVIDER=gemini.",
  );

  return (input?.createGeminiProvider ?? createGeminiRoastAnalysisProvider)();
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
}
