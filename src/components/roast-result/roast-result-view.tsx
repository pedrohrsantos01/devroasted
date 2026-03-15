import type { ReactNode } from "react";

import { buildDiffLines } from "@/components/roast-result/build-diff-lines";
import { RoastIssueCard } from "@/components/roast-result/roast-issue-card";
import type { RoastCompletedResult } from "@/components/roast-result/roast-result-types";
import { RoastScoreRing } from "@/components/roast-result/roast-score-ring";
import { Badge, DiffLine } from "@/components/ui";
import { CodeBlock } from "@/components/ui/server";

export function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[14px] font-bold text-foreground-inverse">
      <span className="text-accent-green">{"//"}</span>
      <span>{title}</span>
    </div>
  );
}

export function getCodeLineLabel(code: string) {
  const lineCount = code.split("\n").length;

  return `${lineCount} ${lineCount === 1 ? "line" : "lines"}`;
}

interface RoastResultShellProps {
  analysisContent: ReactNode;
  badgeTone: "critical" | "warning" | "good" | "neutral";
  badgeText: string;
  heroContent: ReactNode;
  language: RoastCompletedResult["language"];
  mode: RoastCompletedResult["mode"];
  originalCode: string;
  scoreContent: ReactNode;
  suggestedFixContent: ReactNode;
}

export function RoastResultShell({
  analysisContent,
  badgeText,
  badgeTone,
  heroContent,
  language,
  mode,
  originalCode,
  scoreContent,
  suggestedFixContent,
}: RoastResultShellProps) {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-page text-foreground-inverse">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-16 pt-10 sm:px-8 lg:px-20">
        <section className="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
          {scoreContent}

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <Badge
              className="w-fit text-[12px] font-medium"
              size="sm"
              variant={badgeTone}
            >
              {badgeText}
            </Badge>

            <div className="flex flex-col gap-4">{heroContent}</div>

            <div className="flex flex-wrap items-center gap-4 font-mono text-[12px] text-subtle">
              <span>mode: {mode}</span>
              <span aria-hidden="true">.</span>
              <span>lang: {language}</span>
              <span aria-hidden="true">.</span>
              <span>{getCodeLineLabel(originalCode)}</span>
            </div>
          </div>
        </section>

        <div className="h-px w-full bg-border-primary" />

        <section className="flex flex-col gap-4">
          <SectionHeading title="your_submission" />

          <CodeBlock.Root>
            <CodeBlock.Content
              className="min-h-[424px]"
              lang={getCodeBlockLanguage(language)}
            >
              {originalCode}
            </CodeBlock.Content>
          </CodeBlock.Root>
        </section>

        <div className="h-px w-full bg-border-primary" />

        <section className="flex flex-col gap-6">
          <SectionHeading title="detailed_analysis" />
          {analysisContent}
        </section>

        <div className="h-px w-full bg-border-primary" />

        <section className="flex flex-col gap-6">
          <SectionHeading title="suggested_fix" />
          {suggestedFixContent}
        </section>
      </div>
    </main>
  );
}

export function RoastResultView({ roast }: { roast: RoastCompletedResult }) {
  const diffLines = buildDiffLines({
    improvedCode: roast.improvedCode,
    originalCode: roast.originalCode,
  });

  return (
    <RoastResultShell
      analysisContent={
        <div className="grid gap-5 md:grid-cols-2">
          {roast.findings.map((finding) => (
            <RoastIssueCard
              issue={finding}
              key={`${finding.title}-${finding.lineLabel ?? finding.label}`}
            />
          ))}
        </div>
      }
      badgeText={`verdict: ${roast.verdictLabel}`}
      badgeTone={getVerdictTone(roast.score)}
      heroContent={
        <h1 className="max-w-4xl font-mono text-xl leading-8 text-foreground-inverse md:text-[20px]">
          {roast.summary}
        </h1>
      }
      language={roast.language}
      mode={roast.mode}
      originalCode={roast.originalCode}
      scoreContent={<RoastScoreRing score={roast.score} />}
      suggestedFixContent={
        <div className="overflow-hidden border border-border-primary bg-surface-code text-foreground-inverse">
          <div className="flex h-10 items-center border-b border-border-primary px-4">
            <span className="font-mono text-[12px] font-medium text-muted">
              your_code.{getFileExtension(roast.language)} -&gt; improved_code.
              {getFileExtension(roast.language)}
            </span>
          </div>

          <div className="flex flex-col py-1">
            {diffLines.map((line, index) => (
              <DiffLine.Root
                className="gap-1.5 px-4 py-[7px] text-[12px]"
                key={`${line.variant}-${index}`}
                variant={line.variant}
              >
                <DiffLine.Prefix className="w-5" />
                <DiffLine.Content
                  className={
                    line.variant === "added"
                      ? "text-accent-green"
                      : line.variant === "removed"
                        ? "text-critical"
                        : "text-[#A0A0A0]"
                  }
                >
                  {line.content}
                </DiffLine.Content>
              </DiffLine.Root>
            ))}
          </div>
        </div>
      }
    />
  );
}

function getVerdictTone(score: number): "critical" | "warning" | "good" {
  if (score < 4) {
    return "critical";
  }

  if (score < 7) {
    return "warning";
  }

  return "good";
}

function getFileExtension(language: RoastCompletedResult["language"]) {
  if (language === "plaintext") {
    return "txt";
  }

  if (language === "markdown") {
    return "md";
  }

  return language;
}

function getCodeBlockLanguage(language: RoastCompletedResult["language"]) {
  if (language === "plaintext") {
    return "text";
  }

  return language;
}
