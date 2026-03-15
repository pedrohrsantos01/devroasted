import type { RoastProcessingResult } from "@/components/roast-result/roast-result-types";
import { RoastStatusPoller } from "@/components/roast-result/roast-status-poller";

import { RoastResultShell } from "./roast-result-view";

const analysisSkeletonKeys = [
  "analysis-1",
  "analysis-2",
  "analysis-3",
  "analysis-4",
] as const;

const diffSkeletonWidths = [88, 81, 74, 67, 60, 53, 46] as const;

export function RoastProcessingState({
  roast,
}: {
  roast: RoastProcessingResult;
}) {
  return (
    <RoastResultShell
      analysisContent={
        <div className="grid gap-5 md:grid-cols-2">
          {analysisSkeletonKeys.map((key) => (
            <div
              className="flex min-h-40 flex-col gap-4 border border-border-primary bg-page p-5"
              key={key}
            >
              <span className="h-4 w-20 animate-pulse rounded-full bg-border-primary" />
              <span className="h-4 w-40 animate-pulse rounded-full bg-border-primary" />
              <span className="h-3 w-full animate-pulse rounded-full bg-border-primary" />
              <span className="h-3 w-5/6 animate-pulse rounded-full bg-border-primary" />
              <span className="h-3 w-3/4 animate-pulse rounded-full bg-border-primary" />
            </div>
          ))}
        </div>
      }
      badgeText="verdict: processing"
      badgeTone="neutral"
      heroContent={
        <div className="flex max-w-4xl flex-col gap-4">
          <h1 className="font-mono text-xl leading-8 text-foreground-inverse md:text-[20px]">
            The roast is still warming up. We are analyzing the snippet now.
          </h1>
          <RoastStatusPoller createdAt={roast.createdAt} />
        </div>
      }
      language={roast.language}
      mode={roast.mode}
      originalCode={roast.originalCode}
      scoreContent={
        <div className="relative flex size-40 shrink-0 items-center justify-center rounded-full border-4 border-border-primary md:size-[180px]">
          <div className="flex flex-col items-center gap-3">
            <span className="h-10 w-20 animate-pulse rounded-full bg-border-primary" />
            <span className="h-3 w-8 animate-pulse rounded-full bg-border-primary" />
          </div>
        </div>
      }
      suggestedFixContent={
        <div className="overflow-hidden border border-border-primary bg-surface-code text-foreground-inverse">
          <div className="flex h-10 items-center border-b border-border-primary px-4">
            <span className="h-3 w-40 animate-pulse rounded-full bg-border-primary" />
          </div>

          <div className="flex flex-col gap-3 px-4 py-4">
            {diffSkeletonWidths.map((width) => (
              <div className="flex items-center gap-3" key={width}>
                <span className="h-3 w-3 animate-pulse rounded-full bg-border-primary" />
                <span
                  className="h-3 animate-pulse rounded-full bg-border-primary"
                  style={{ width: `${width}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
