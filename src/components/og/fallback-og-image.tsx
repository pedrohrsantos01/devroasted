import { OG_COLORS, OG_HEIGHT, OG_WIDTH } from "@/components/og/og-constants";

export function FallbackOgImage() {
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

      {/* Tagline */}
      <span
        style={{
          color: OG_COLORS.textSecondary,
          fontSize: 24,
          fontWeight: 400,
        }}
      >
        Paste your code. Get roasted.
      </span>
    </div>
  );
}
