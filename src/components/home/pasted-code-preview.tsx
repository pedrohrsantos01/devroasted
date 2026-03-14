"use client";

import parse from "html-react-parser";
import { useEffect, useMemo, useState } from "react";

import type { SupportedLanguageId } from "@/components/home/editor-language-registry";
import {
  createPlaintextHtml,
  highlightSnippet,
} from "@/components/home/get-browser-highlighter";
import { cn } from "@/lib/utils";

export interface PastedCodePreviewProps {
  className?: string;
  code: string;
  language: SupportedLanguageId;
}

export function PastedCodePreview({
  className,
  code,
  language,
}: PastedCodePreviewProps) {
  const fallbackHtml = useMemo(() => createPlaintextHtml(code), [code]);
  const [highlightedHtml, setHighlightedHtml] = useState(fallbackHtml);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    setHighlightedHtml(fallbackHtml);

    async function renderSnippet() {
      if (!code.trim() || language === "plaintext") {
        setIsRendering(false);

        return;
      }

      setIsRendering(true);

      const html = await highlightSnippet(code, language);

      if (!isCancelled) {
        setHighlightedHtml(html);
        setIsRendering(false);
      }
    }

    renderSnippet().catch(() => {
      if (!isCancelled) {
        setIsRendering(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [code, fallbackHtml, language]);

  return (
    <div className={cn("relative h-full min-h-[360px]", className)}>
      {isRendering ? (
        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-border-primary bg-page/80 px-3 py-1 font-sans text-[11px] text-subtle backdrop-blur-sm">
          highlighting...
        </div>
      ) : null}

      <div className="editor-preview-content h-full overflow-auto">
        {parse(highlightedHtml)}
      </div>
    </div>
  );
}
