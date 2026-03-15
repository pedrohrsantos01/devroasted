import type { RoastFailedResult } from "@/components/roast-result/roast-result-types";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";

import { RoastResultShell } from "./roast-result-view";

export function RoastFailedState({ roast }: { roast: RoastFailedResult }) {
  return (
    <RoastResultShell
      analysisContent={
        <Card>
          <CardHeader className="gap-4 p-6">
            <CardTitle className="text-[15px] text-critical">
              Analysis unavailable
            </CardTitle>
            <CardDescription className="max-w-2xl text-[13px] leading-6 text-muted">
              We could not produce findings for this run. Resubmit the snippet
              to try the roast again.
            </CardDescription>
          </CardHeader>
        </Card>
      }
      badgeText="verdict: failed"
      badgeTone="critical"
      heroContent={
        <>
          <h1 className="max-w-4xl font-mono text-xl leading-8 text-foreground-inverse md:text-[20px]">
            {roast.title}
          </h1>
          <p className="max-w-3xl font-sans text-[14px] leading-7 text-muted">
            {roast.summary}
          </p>
        </>
      }
      language={roast.language}
      mode={roast.mode}
      originalCode={roast.originalCode}
      scoreContent={
        <div className="flex size-40 shrink-0 items-center justify-center border border-critical/60 bg-critical/10 font-mono text-[13px] text-critical md:size-[180px]">
          roast failed
        </div>
      }
      suggestedFixContent={
        <Card className="bg-surface-code">
          <CardHeader className="gap-4 p-6">
            <CardTitle className="text-[15px]">
              Suggested fix unavailable
            </CardTitle>
            <CardDescription className="max-w-2xl text-[13px] leading-6 text-muted">
              We only render the improved diff after a completed analysis, so
              there is no patch to show for this roast.
            </CardDescription>
          </CardHeader>
        </Card>
      }
    />
  );
}
