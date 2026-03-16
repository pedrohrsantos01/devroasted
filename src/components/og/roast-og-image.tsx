import {
  formatSummaryQuote,
  getLineCount,
  getVerdictColor,
  OG_COLORS,
  OG_HEIGHT,
  OG_WIDTH,
} from "@/components/og/og-constants";
import type { RoastCompletedResult } from "@/components/roast-result/roast-result-types";

interface RoastOgImageProps {
  roast: RoastCompletedResult;
}

export function RoastOgImage({ roast }: RoastOgImageProps) {
  const verdictColor = getVerdictColor(roast.score);
  const lineCount = getLineCount(roast.originalCode);
  const summaryQuote = formatSummaryQuote(roast.summary);
  const scoreDisplay = roast.score.toFixed(1);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: OG_WIDTH,
        height: OG_HEIGHT,
        backgroundColor: OG_COLORS.bgPage,
        padding: 64,
        gap: 28,
        fontFamily: "JetBrains Mono",
      }}
    >
      {/* Logo row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            color: OG_COLORS.accentGreen,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {">"}
        </span>
        <span
          style={{
            color: OG_COLORS.textPrimary,
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          devroast
        </span>
      </div>

      {/* Score row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 4,
        }}
      >
        {/* Score color is intentionally always amber per the Pencil design,
            unlike the verdict dot which uses dynamic color */}
        <span
          style={{
            color: OG_COLORS.accentAmber,
            fontSize: 160,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {scoreDisplay}
        </span>
        <span
          style={{
            color: OG_COLORS.textTertiary,
            fontSize: 56,
            fontWeight: 400,
            lineHeight: 1,
          }}
        >
          /10
        </span>
      </div>

      {/* Verdict row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: verdictColor,
          }}
        />
        <span
          style={{
            color: verdictColor,
            fontSize: 20,
            fontWeight: 400,
          }}
        >
          {roast.verdictLabel}
        </span>
      </div>

      {/* Language info */}
      <span
        style={{
          color: OG_COLORS.textTertiary,
          fontSize: 16,
          fontWeight: 400,
        }}
      >
        {`lang: ${roast.language} \u00B7 ${lineCount} ${lineCount === 1 ? "line" : "lines"}`}
      </span>

      {/* Summary quote */}
      <span
        style={{
          color: OG_COLORS.textPrimary,
          fontSize: 22,
          fontWeight: 400,
          lineHeight: 1.5,
          textAlign: "center",
          maxWidth: OG_WIDTH - 128,
        }}
      >
        {summaryQuote}
      </span>
    </div>
  );
}
