import assert from "node:assert/strict";
import test from "node:test";
import type { RoastAnalysisProvider } from "@/server/roasts/providers/provider";
import { createRoastAnalysisProvider } from "@/server/roasts/providers/provider-factory";

function createStubProvider(): RoastAnalysisProvider {
  return {
    analyze: async () => ({
      score: 7.4,
      verdictLabel: "Needs polish",
      summary: "Pretty good, but still roastable.",
      improvedCode: "const answer = 42;\nconsole.log(answer);",
      findings: [
        {
          kind: "issue",
          severity: "warning",
          title: "Unused value",
          description: "The answer is never used.",
          lineStart: null,
          lineEnd: null,
        },
      ],
    }),
  };
}

test("createRoastAnalysisProvider defaults to Gemini", () => {
  let geminiCallCount = 0;
  let openaiCallCount = 0;
  const geminiProvider = createStubProvider();

  const provider = createRoastAnalysisProvider({
    createGeminiProvider: () => {
      geminiCallCount += 1;
      return geminiProvider;
    },
    createOpenAIProvider: () => {
      openaiCallCount += 1;
      return createStubProvider();
    },
    env: {
      GEMINI_API_KEY: "test-gemini-key",
    },
  });

  assert.equal(provider, geminiProvider);
  assert.equal(geminiCallCount, 1);
  assert.equal(openaiCallCount, 0);
});

test("createRoastAnalysisProvider chooses OpenAI when ROAST_PROVIDER=openai", () => {
  let geminiCallCount = 0;
  let openaiCallCount = 0;
  const openaiProvider = createStubProvider();

  const provider = createRoastAnalysisProvider({
    createGeminiProvider: () => {
      geminiCallCount += 1;
      return createStubProvider();
    },
    createOpenAIProvider: () => {
      openaiCallCount += 1;
      return openaiProvider;
    },
    env: {
      OPENAI_API_KEY: "test-openai-key",
      ROAST_PROVIDER: "openai",
    },
  });

  assert.equal(provider, openaiProvider);
  assert.equal(geminiCallCount, 0);
  assert.equal(openaiCallCount, 1);
});

test("createRoastAnalysisProvider passes injected env config to the selected provider", () => {
  const originalOpenAIApiKey = process.env.OPENAI_API_KEY;
  const originalOpenAIModel = process.env.OPENAI_MODEL;
  const openaiProvider = createStubProvider();
  let receivedConfig: Record<string, unknown> | undefined;

  process.env.OPENAI_API_KEY = "process-openai-key";
  process.env.OPENAI_MODEL = "process-openai-model";

  try {
    const provider = createRoastAnalysisProvider({
      createOpenAIProvider: (config) => {
        receivedConfig = config;
        return openaiProvider;
      },
      env: {
        OPENAI_API_KEY: "injected-openai-key",
        OPENAI_MODEL: "injected-openai-model",
        ROAST_PROVIDER: "openai",
      },
    });

    assert.equal(provider, openaiProvider);
    assert.deepEqual(receivedConfig, {
      apiKey: "injected-openai-key",
      model: "injected-openai-model",
    });
  } finally {
    if (originalOpenAIApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAIApiKey;
    }

    if (originalOpenAIModel === undefined) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = originalOpenAIModel;
    }
  }
});

test("createRoastAnalysisProvider fails clearly when GEMINI_API_KEY is missing", () => {
  assert.throws(
    () => createRoastAnalysisProvider({ env: {} }),
    /GEMINI_API_KEY is required when ROAST_PROVIDER=gemini\./,
  );
});

test("createRoastAnalysisProvider fails clearly when OPENAI_API_KEY is missing", () => {
  assert.throws(
    () =>
      createRoastAnalysisProvider({
        env: { ROAST_PROVIDER: "openai" },
      }),
    /OPENAI_API_KEY is required when ROAST_PROVIDER=openai\./,
  );
});
