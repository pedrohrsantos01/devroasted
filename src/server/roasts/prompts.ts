export interface RoastAnalysisPrompt {
  systemInstruction: string;
  userPrompt: string;
}

export function buildRoastAnalysisPrompt(input: {
  code: string;
  language: string;
  lineCount: number;
  mode: "honest" | "roast";
  roastId: string;
}): RoastAnalysisPrompt {
  const styleInstruction =
    input.mode === "honest"
      ? "Be direct, constructive, and specific. Avoid insults or joke phrasing."
      : "Be sharp, playful, and funny, but keep the advice useful and grounded in the code.";

  return {
    systemInstruction: [
      "You analyze code submissions and return structured roast analysis.",
      styleInstruction,
      "Always ground findings in the submitted code.",
      "Only reference line numbers between 1 and the provided lineCount.",
      "Return at least one finding and include improvedCode.",
    ].join(" "),
    userPrompt: [
      `roastId: ${input.roastId}`,
      `language: ${input.language}`,
      `lineCount: ${input.lineCount}`,
      `mode: ${input.mode}`,
      "Analyze this code:",
      "```",
      input.code,
      "```",
    ].join("\n"),
  };
}
