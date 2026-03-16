import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RoastFailedState } from "@/components/roast-result/roast-failed-state";
import { RoastProcessingState } from "@/components/roast-result/roast-processing-state";
import { RoastResultView } from "@/components/roast-result/roast-result-view";
import { caller } from "@/trpc/server";

interface RoastResultPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: RoastResultPageProps): Promise<Metadata> {
  const { slug } = await params;

  const ogImageUrl = `/roasts/${slug}/opengraph-image`;

  return {
    title: `Roast ${slug} | devroast`,
    description:
      "See the live roast state, detailed analysis, and suggested fix for this snippet.",
    openGraph: {
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogImageUrl],
    },
    robots: {
      follow: true,
      index: false,
    },
  };
}

export default async function RoastResultPage({
  params,
}: RoastResultPageProps) {
  const { slug } = await params;
  const roast = await caller.roasts.bySlug({ slug });

  if (roast === null) {
    notFound();
  }

  if (roast.status === "processing") {
    return <RoastProcessingState roast={roast} />;
  }

  if (roast.status === "failed") {
    return <RoastFailedState roast={roast} />;
  }

  return <RoastResultView roast={roast} />;
}
