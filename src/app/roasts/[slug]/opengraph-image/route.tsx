import { ImageResponse } from "@takumi-rs/image-response";

import { FallbackOgImage } from "@/components/og/fallback-og-image";
import { loadFonts, OG_HEIGHT, OG_WIDTH } from "@/components/og/og-constants";
import { RoastOgImage } from "@/components/og/roast-og-image";
import { db } from "@/db/client";
import { getRoastBySlug } from "@/server/roasts/queries/get-roast-by-slug";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const fonts = await loadFonts();

  try {
    const roast = await getRoastBySlug({ db, slug });

    if (roast?.status === "completed") {
      return new ImageResponse(<RoastOgImage roast={roast} />, {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts,
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return new ImageResponse(<FallbackOgImage />, {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts,
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return new ImageResponse(<FallbackOgImage />, {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      fonts,
      headers: {
        "Cache-Control": "no-cache",
      },
    });
  }
}
