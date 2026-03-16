import fs from "node:fs/promises";
import path from "node:path";

// ---------- Colors (from Pencil design tokens) ----------

export const OG_COLORS = {
  bgPage: "#0A0A0A",
  textPrimary: "#E5E5E5",
  textSecondary: "#A3A3A3",
  textTertiary: "#737373",
  accentGreen: "#10B981",
  accentAmber: "#F59E0B",
  accentRed: "#EF4444",
} as const;

// ---------- Dimensions ----------

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// ---------- Verdict color ----------

/**
 * Same thresholds as `getVerdictTone` in
 * `src/components/roast-result/roast-result-view.tsx:174-184`.
 */
export function getVerdictColor(score: number): string {
  if (score < 4) return OG_COLORS.accentRed;
  if (score < 7) return OG_COLORS.accentAmber;
  return OG_COLORS.accentGreen;
}

// ---------- Summary truncation ----------

const SUMMARY_MAX_LENGTH = 120;

export function formatSummaryQuote(summary: string): string {
  const truncated =
    summary.length <= SUMMARY_MAX_LENGTH
      ? summary
      : `${summary.slice(0, SUMMARY_MAX_LENGTH).trimEnd()}...`;

  return `\u201C${truncated}\u201D`;
}

// ---------- Line count ----------

export function getLineCount(code: string): number {
  return code.split("\n").length;
}

// ---------- Font loading ----------

const FONTS_DIR = path.join(process.cwd(), "src/assets/fonts");

const fontRegularPromise = fs.readFile(
  path.join(FONTS_DIR, "JetBrainsMono-Regular.ttf"),
);
const fontBoldPromise = fs.readFile(
  path.join(FONTS_DIR, "JetBrainsMono-Bold.ttf"),
);

export async function loadFonts() {
  const [regular, bold] = await Promise.all([
    fontRegularPromise,
    fontBoldPromise,
  ]);

  return [
    {
      name: "JetBrains Mono",
      data: regular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "JetBrains Mono",
      data: bold,
      weight: 700 as const,
      style: "normal" as const,
    },
  ];
}
