"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { LeaderboardTable } from "@/components/home/leaderboard-table";
import { Collapsible } from "@/components/ui";
import { cn } from "@/lib/utils";

interface LeaderboardPreviewEntryData {
  language: string;
  lineCount: number;
  rank: number;
  score: string;
}

export interface LeaderboardPreviewEntryProps {
  entry: LeaderboardPreviewEntryData;
  expandedCode: ReactNode;
  hasBorder?: boolean;
  previewCode: ReactNode;
}

function getLineLabel(lineCount: number) {
  return `${lineCount} ${lineCount === 1 ? "line" : "lines"}`;
}

function ChevronIcon(props: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 10 10" {...props}>
      <path d="M3 1.5L6.5 5L3 8.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function LeaderboardPreviewEntry({
  entry,
  expandedCode,
  hasBorder = false,
  previewCode,
}: LeaderboardPreviewEntryProps) {
  return (
    <Collapsible.Root
      className={cn(hasBorder && "border-b border-border-primary")}
    >
      <LeaderboardTable.Row className="items-start">
        <LeaderboardTable.Cell
          className={`font-mono ${entry.rank === 1 ? "text-warning" : "text-muted"}`}
        >
          {entry.rank}
        </LeaderboardTable.Cell>

        <LeaderboardTable.Cell className="font-mono font-bold text-critical">
          {entry.score}
        </LeaderboardTable.Cell>

        <LeaderboardTable.Cell className="min-w-0">
          <div className="relative overflow-hidden rounded-md border border-border-primary bg-surface-code">
            {previewCode}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-surface-code via-surface-code/95 to-transparent"
            />
          </div>
        </LeaderboardTable.Cell>

        <LeaderboardTable.Cell className="flex flex-col items-start gap-3 font-mono text-[12px]">
          <span className="text-muted">{entry.language}</span>
          <span className="text-subtle">{getLineLabel(entry.lineCount)}</span>

          <Collapsible.Trigger className="px-0.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-accent-green hover:text-foreground-inverse data-[panel-open]:text-foreground-inverse">
            <ChevronIcon className="size-3 shrink-0 transition-transform duration-200 ease-out group-data-[panel-open]:rotate-90" />
            <span className="group-data-[panel-open]:hidden">$ expand</span>
            <span className="hidden group-data-[panel-open]:inline">
              $ collapse
            </span>
          </Collapsible.Trigger>
        </LeaderboardTable.Cell>
      </LeaderboardTable.Row>

      <Collapsible.Panel className="border-t border-border-primary bg-page">
        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-subtle">
            <span>{"// full snippet"}</span>
            <span>
              {entry.language} · {getLineLabel(entry.lineCount)}
            </span>
          </div>

          {expandedCode}
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
