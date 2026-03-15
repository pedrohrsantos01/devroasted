import assert from "node:assert/strict";
import test from "node:test";

import {
  OPENAI_PROVIDER_TIMEOUT_MS,
  createOpenAIRoastAnalysisProvider,
  resolveOpenAIModel,
} from "@/server/roasts/providers/openai-provider";

test("resolveOpenAIModel uses OPENAI_MODEL by default", () => {
  const originalModel = process.env.OPENAI_MODEL;

  process.env.OPENAI_MODEL = "gpt-test-model";

  try {
    assert.equal(resolveOpenAIModel(), "gpt-test-model");
  } finally {
    if (originalModel === undefined) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = originalModel;
    }
  }
});

test("createOpenAIRoastAnalysisProvider passes the configured timeout to chat.completions.parse", async () => {
  const requestOptions: Array<Record<string, unknown> | undefined> = [];

  const provider = createOpenAIRoastAnalysisProvider({
    client: {
      chat: {
        completions: {
          parse: async (
            _params: Record<string, unknown>,
            options?: Record<string, unknown>,
          ) => {
            requestOptions.push(options);

            return {
              choices: [
                {
                  message: {
                    parsed: {
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
                    },
                  },
                },
              ],
            };
          },
        },
      },
    } as never,
  });

  await provider.analyze({
    code: "const answer = 42;",
    language: "typescript",
    lineCount: 1,
    mode: "roast",
    roastId: "roast-1",
  });

  assert.equal(requestOptions.length, 1);
  assert.equal(requestOptions[0]?.timeout, OPENAI_PROVIDER_TIMEOUT_MS);
});

test("createOpenAIRoastAnalysisProvider throws the refusal message when parsed output is missing", async () => {
  const provider = createOpenAIRoastAnalysisProvider({
    client: {
      chat: {
        completions: {
          parse: async () => ({
            choices: [{ message: { parsed: null, refusal: "Nope." } }],
          }),
        },
      },
    } as never,
  });

  await assert.rejects(
    () =>
      provider.analyze({
        code: "const answer = 42;",
        language: "typescript",
        lineCount: 1,
        mode: "roast",
        roastId: "roast-1",
      }),
    /Nope\./,
  );
});

test("createOpenAIRoastAnalysisProvider throws a fallback error when parsed output is missing without a refusal", async () => {
  const provider = createOpenAIRoastAnalysisProvider({
    client: {
      chat: {
        completions: {
          parse: async () => ({
            choices: [{ message: { parsed: null, refusal: null } }],
          }),
        },
      },
    } as never,
  });

  await assert.rejects(
    () =>
      provider.analyze({
        code: "const answer = 42;",
        language: "typescript",
        lineCount: 1,
        mode: "roast",
        roastId: "roast-1",
      }),
    /OpenAI returned no parsed analysis\./,
  );
});
