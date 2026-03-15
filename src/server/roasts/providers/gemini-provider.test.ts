import assert from "node:assert/strict";
import test from "node:test";

import {
  createGeminiRoastAnalysisProvider,
  GEMINI_PROVIDER_TIMEOUT_MS,
} from "@/server/roasts/providers/gemini-provider";

const analysisInput = {
  code: "const answer = 42;",
  language: "typescript",
  lineCount: 1,
  mode: "roast" as const,
  roastId: "roast-1",
};

test("createGeminiRoastAnalysisProvider parses valid JSON into RoastAnalysis", async () => {
  const provider = createGeminiRoastAnalysisProvider({
    apiKey: "test-gemini-key",
    client: {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            score: 8.1,
            verdictLabel: "Ship it",
            summary: "Small cleanup, big upside.",
            improvedCode: "const answer = 42;\nconsole.log(answer);",
            findings: [
              {
                kind: "strength",
                severity: "good",
                title: "Clear constant",
                description: "The constant name is readable.",
                lineStart: 1,
                lineEnd: 1,
              },
            ],
          }),
        }),
      },
    } as never,
  });

  const analysis = await provider.analyze(analysisInput);

  assert.equal(analysis.score, 8.1);
  assert.equal(analysis.verdictLabel, "Ship it");
  assert.equal(analysis.findings[0]?.title, "Clear constant");
});

test("createGeminiRoastAnalysisProvider throws a clear error on empty JSON text", async () => {
  const provider = createGeminiRoastAnalysisProvider({
    apiKey: "test-gemini-key",
    client: {
      models: {
        generateContent: async () => ({ text: "" }),
      },
    } as never,
  });

  await assert.rejects(() => provider.analyze(analysisInput), {
    message: "Gemini returned an empty analysis response.",
  });
});

test("createGeminiRoastAnalysisProvider throws a clear error on invalid JSON text", async () => {
  const provider = createGeminiRoastAnalysisProvider({
    apiKey: "test-gemini-key",
    client: {
      models: {
        generateContent: async () => ({ text: "not-json" }),
      },
    } as never,
  });

  await assert.rejects(() => provider.analyze(analysisInput), {
    message:
      "Gemini returned invalid JSON analysis: Unexpected token 'o', \"not-json\" is not valid JSON",
  });
});

test("createGeminiRoastAnalysisProvider passes the configured timeout to models.generateContent", async () => {
  const requests: Array<Record<string, unknown>> = [];

  const provider = createGeminiRoastAnalysisProvider({
    apiKey: "test-gemini-key",
    client: {
      models: {
        generateContent: async (params: Record<string, unknown>) => {
          requests.push(params);

          return {
            text: JSON.stringify({
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
        },
      },
    } as never,
    timeoutMs: GEMINI_PROVIDER_TIMEOUT_MS + 1_000,
  });

  await provider.analyze(analysisInput);

  assert.equal(requests.length, 1);
  assert.equal(
    (requests[0]?.config as { httpOptions?: { timeout?: number } }).httpOptions
      ?.timeout,
    GEMINI_PROVIDER_TIMEOUT_MS + 1_000,
  );
  assert.equal(
    (requests[0]?.config as { responseMimeType?: string }).responseMimeType,
    "application/json",
  );
});
