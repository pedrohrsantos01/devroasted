"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Collapsible } from "@/components/ui";

interface LeaderboardEntryCardShellData {
  language: string;
  lineCount: number;
  rank: number;
  score: string;
}

export interface LeaderboardEntryCardShellProps {
  entry: LeaderboardEntryCardShellData;
  expandedCode: ReactNode;
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

export function LeaderboardEntryCardShell({
  entry,
  expandedCode,
  previewCode,
}: LeaderboardEntryCardShellProps) {
  return (
    <Collapsible.Root className="overflow-hidden border border-border-primary bg-page">
      <div className="flex flex-col gap-3 border-b border-border-primary px-4 py-3 font-mono sm:min-h-12 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-0">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="text-subtle">#</span>
            <span className="font-bold text-warning">{entry.rank}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="text-subtle">score:</span>
            <span className="text-[13px] font-bold text-critical">
              {entry.score}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-[12px]">
          <span className="text-muted">{entry.language}</span>
          <span className="text-subtle">{getLineLabel(entry.lineCount)}</span>

          <Collapsible.Trigger className="px-0.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-accent-green hover:text-foreground-inverse data-[panel-open]:text-foreground-inverse">
            <ChevronIcon className="size-3 shrink-0 transition-transform duration-200 ease-out group-data-[panel-open]:rotate-90" />
            <span className="group-data-[panel-open]:hidden">$ expand</span>
            <span className="hidden group-data-[panel-open]:inline">
              $ collapse
            </span>
          </Collapsible.Trigger>
        </div>
      </div>

      <div className="relative max-h-44 overflow-hidden bg-surface-code">
        {previewCode}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface-code via-surface-code/95 to-transparent"
        />
      </div>

      <Collapsible.Panel className="border-t border-border-primary bg-page">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
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
