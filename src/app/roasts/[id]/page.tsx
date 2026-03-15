import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { RoastIssueCard } from "@/components/roast-result/roast-issue-card";
import { roastResultMock } from "@/components/roast-result/roast-result-data";
import { RoastScoreRing } from "@/components/roast-result/roast-score-ring";
import { Button, DiffLine } from "@/components/ui";
import { CodeBlock } from "@/components/ui/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface RoastResultPageProps {
  params: Promise<{ id: string }>;
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function getCodeLineLabel(code: string) {
  const lineCount = code.split("\n").length;

  return `${lineCount} ${lineCount === 1 ? "line" : "lines"}`;
}

async function getRoastResult(id: string) {
  return {
    ...roastResultMock,
    id,
  };
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[14px] font-bold text-foreground-inverse">
      <span className="text-accent-green">{"//"}</span>
      <span>{title}</span>
    </div>
  );
}

export async function generateMetadata({
  params,
}: RoastResultPageProps): Promise<Metadata> {
  const { id } = await params;
  const shortId = isUuid(id) ? id.slice(0, 8) : "result";

  return {
    title: `Roast ${shortId} | devroast`,
    description:
      "See the final roast score, detailed analysis, and suggested fix.",
    robots: {
      follow: true,
      index: false,
    },
  };
}

export default async function RoastResultPage({
  params,
}: RoastResultPageProps) {
  await connection();

  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const roast = await getRoastResult(id);

  return (
    <main className="min-h-[calc(100vh-56px)] bg-page text-foreground-inverse">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-16 pt-10 sm:px-8 lg:px-20">
        <section className="flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
          <RoastScoreRing score={roast.score} />

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-col gap-4">
              <div className="inline-flex w-fit items-center gap-2 font-mono text-[13px] font-medium text-critical">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-critical"
                />
                <span>verdict: {roast.verdict}</span>
              </div>

              <h1 className="max-w-4xl font-mono text-xl leading-8 text-foreground-inverse md:text-[20px]">
                {roast.quote}
              </h1>

              <div className="flex flex-wrap items-center gap-4 font-mono text-[12px] text-subtle">
                <span>lang: {roast.language}</span>
                <span aria-hidden="true">.</span>
                <span>{getCodeLineLabel(roast.code)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="border-border-primary bg-transparent px-4 py-2 text-[12px] font-normal text-foreground-inverse focus-visible:ring-offset-page enabled:hover:bg-white/5 enabled:active:bg-white/10"
                size="sm"
                variant="outline"
              >
                $ share_roast
              </Button>
            </div>
          </div>
        </section>

        <div className="h-px w-full bg-border-primary" />

        <section className="flex flex-col gap-4">
          <SectionHeading title="your_submission" />

          <CodeBlock.Root>
            <CodeBlock.Content className="min-h-[424px]" lang={roast.language}>
              {roast.code}
            </CodeBlock.Content>
          </CodeBlock.Root>
        </section>

        <div className="h-px w-full bg-border-primary" />

        <section className="flex flex-col gap-6">
          <SectionHeading title="detailed_analysis" />

          <div className="grid gap-5 md:grid-cols-2">
            {roast.issues.map((issue) => (
              <RoastIssueCard
                issue={issue}
                key={`${issue.tone}-${issue.title}`}
              />
            ))}
          </div>
        </section>

        <div className="h-px w-full bg-border-primary" />

        <section className="flex flex-col gap-6">
          <SectionHeading title="suggested_fix" />

          <div className="overflow-hidden border border-border-primary bg-surface-code text-foreground-inverse">
            <div className="flex h-10 items-center border-b border-border-primary px-4">
              <span className="font-mono text-[12px] font-medium text-muted">
                {roast.diffFileLabel}
              </span>
            </div>

            <div className="flex flex-col py-1">
              {roast.diffLines.map((line, index) => (
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
        </section>
      </div>
    </main>
  );
}
