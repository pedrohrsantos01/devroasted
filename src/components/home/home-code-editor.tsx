"use client";

import { type UIEvent, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface HomeCodeEditorProps {
  className?: string;
  defaultValue: string;
  minLines?: number;
}

export function HomeCodeEditor({
  className,
  defaultValue,
  minLines = 16,
}: HomeCodeEditorProps) {
  const [value, setValue] = useState(defaultValue);
  const lineNumberRef = useRef<HTMLDivElement>(null);

  const lineNumbers = useMemo(() => {
    const totalLines = Math.max(value.split("\n").length, minLines);

    return Array.from({ length: totalLines }, (_, index) => index + 1);
  }, [minLines, value]);

  function handleScroll(event: UIEvent<HTMLTextAreaElement>) {
    if (lineNumberRef.current) {
      lineNumberRef.current.scrollTop = event.currentTarget.scrollTop;
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden border border-border-primary bg-surface-code text-foreground-inverse",
        className,
      )}
    >
      <div className="flex h-10 items-center gap-2 border-b border-border-primary px-4">
        <span
          aria-hidden="true"
          className="size-2.5 rounded-full bg-critical"
        />
        <span aria-hidden="true" className="size-2.5 rounded-full bg-warning" />
        <span
          aria-hidden="true"
          className="size-2.5 rounded-full bg-accent-green"
        />
      </div>

      <div className="flex h-[360px] min-h-[360px] overflow-hidden">
        <div
          ref={lineNumberRef}
          aria-hidden="true"
          className="w-12 shrink-0 overflow-hidden border-r border-border-primary bg-surface px-3 py-4 text-right font-mono text-[12px] leading-7 text-subtle select-none"
        >
          {lineNumbers.map((lineNumber) => (
            <div key={lineNumber} className="h-7">
              {lineNumber}
            </div>
          ))}
        </div>

        <textarea
          aria-label="Code editor"
          autoCapitalize="off"
          autoCorrect="off"
          className="h-full w-full resize-none overflow-auto bg-transparent p-4 font-mono text-[12px] leading-7 text-foreground-inverse outline-none placeholder:text-subtle [tab-size:2]"
          onChange={(event) => setValue(event.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          value={value}
          wrap="off"
        />
      </div>
    </div>
  );
}
