"use client";

import type {
  ClipboardEvent as ReactClipboardEvent,
  DragEvent as ReactDragEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { detectEditorLanguage } from "@/components/home/detect-editor-language";
import {
  getEditorLanguageLabel,
  type SupportedLanguageId,
} from "@/components/home/editor-language-registry";
import { warmBrowserHighlighter } from "@/components/home/get-browser-highlighter";
import { HomeCodeLanguageSelect } from "@/components/home/home-code-language-select";
import { PastedCodePreview } from "@/components/home/pasted-code-preview";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type EditorPhase = "empty" | "filled";

export interface HomeCodeEditorProps {
  className?: string;
  defaultValue?: string;
  minLines?: number;
}

export function HomeCodeEditor({
  className,
  defaultValue = "",
  minLines = 16,
}: HomeCodeEditorProps) {
  const [code, setCode] = useState(defaultValue);
  const [detectedLanguage, setDetectedLanguage] =
    useState<SupportedLanguageId>("plaintext");
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [manualLanguage, setManualLanguage] =
    useState<SupportedLanguageId | null>(null);
  const [phase, setPhase] = useState<EditorPhase>(
    defaultValue ? "filled" : "empty",
  );
  const pasteTargetRef = useRef<HTMLTextAreaElement>(null);

  const lineNumbers = useMemo(() => {
    return Array.from({ length: minLines }, (_, index) => index + 1);
  }, [minLines]);

  const selectedLanguage = manualLanguage ?? detectedLanguage;
  const hasSnippet = code.trim().length > 0;

  useEffect(() => {
    warmBrowserHighlighter();
  }, []);

  useEffect(() => {
    if (!hasSnippet) {
      setDetectedLanguage("plaintext");
      setIsDetectingLanguage(false);

      return;
    }

    if (manualLanguage !== null) {
      setIsDetectingLanguage(false);

      return;
    }

    let isCancelled = false;

    async function runDetection() {
      setIsDetectingLanguage(true);

      const nextLanguage = await detectEditorLanguage(code);

      if (!isCancelled) {
        setDetectedLanguage(nextLanguage);
        setIsDetectingLanguage(false);
      }
    }

    runDetection().catch(() => {
      if (!isCancelled) {
        setDetectedLanguage("plaintext");
        setIsDetectingLanguage(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [code, hasSnippet, manualLanguage]);

  useEffect(() => {
    if (phase === "empty") {
      const frame = window.requestAnimationFrame(() => {
        pasteTargetRef.current?.focus();
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }
  }, [phase]);

  function applyPastedSnippet(nextCode: string) {
    if (!nextCode.trim()) {
      return;
    }

    setCode(nextCode);
    setPhase("filled");
  }

  function handlePaste(event: ReactClipboardEvent<HTMLTextAreaElement>) {
    event.preventDefault();

    const pastedCode = event.clipboardData.getData("text");

    applyPastedSnippet(pastedCode);
  }

  function handleDrop(event: ReactDragEvent<HTMLTextAreaElement>) {
    event.preventDefault();

    const droppedCode = event.dataTransfer.getData("text");

    applyPastedSnippet(droppedCode);
  }

  function handlePasteSurfaceKeyDown(
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
  ) {
    const key = event.key.toLowerCase();
    const isPasteShortcut =
      ((event.ctrlKey || event.metaKey) && key === "v") ||
      (event.shiftKey && event.key === "Insert");

    if (event.key === "Tab") {
      return;
    }

    if (!isPasteShortcut) {
      event.preventDefault();
    }
  }

  function handleClear() {
    setCode("");
    setDetectedLanguage("plaintext");
    setManualLanguage(null);
    setPhase("empty");
  }

  return (
    <div
      className={cn(
        "overflow-hidden border border-border-primary bg-surface-code text-left text-foreground-inverse",
        className,
      )}
    >
      <div className="flex min-h-10 flex-wrap items-center gap-3 border-b border-border-primary px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-critical"
          />
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-warning"
          />
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-accent-green"
          />
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <HomeCodeLanguageSelect
            detectedLanguage={detectedLanguage}
            disabled={!hasSnippet}
            manualLanguage={manualLanguage}
            onManualLanguageChange={setManualLanguage}
          />

          {phase === "filled" ? (
            <Button size="sm" variant="destructive" onClick={handleClear}>
              clear_code
            </Button>
          ) : null}
        </div>
      </div>

      {phase === "filled" ? (
        <div className="flex min-h-[360px] flex-col">
          <div className="border-b border-border-primary px-4 py-3 text-left font-sans text-[12px] text-subtle">
            {manualLanguage === null ? (
              isDetectingLanguage ? (
                "detecting language..."
              ) : (
                <>
                  auto-detected:{" "}
                  <span className="font-mono text-foreground-inverse">
                    {getEditorLanguageLabel(selectedLanguage)}
                  </span>
                </>
              )
            ) : (
              <>
                manual override:{" "}
                <span className="font-mono text-foreground-inverse">
                  {getEditorLanguageLabel(selectedLanguage)}
                </span>
              </>
            )}
          </div>

          <PastedCodePreview code={code} language={selectedLanguage} />
        </div>
      ) : (
        <div className="flex min-h-[360px] overflow-hidden">
          <div
            aria-hidden="true"
            className="w-12 shrink-0 overflow-hidden border-r border-border-primary bg-surface px-3 py-4 text-right font-mono text-[12px] leading-7 text-subtle select-none"
          >
            {lineNumbers.map((lineNumber) => (
              <div key={lineNumber} className="h-7">
                {lineNumber}
              </div>
            ))}
          </div>

          <div className="relative flex-1">
            <textarea
              ref={pasteTargetRef}
              aria-label="Paste code here"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className="h-full min-h-[360px] w-full resize-none overflow-auto bg-transparent p-4 font-mono text-[12px] leading-7 text-foreground-inverse caret-accent-green outline-none"
              onChange={() => {}}
              onDrop={handleDrop}
              onKeyDown={handlePasteSurfaceKeyDown}
              onPaste={handlePaste}
              placeholder=""
              spellCheck={false}
              value=""
              wrap="off"
            />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 py-10 text-center">
              <div className="max-w-[420px] space-y-3">
                <p className="font-mono text-sm text-foreground-inverse">
                  paste your code here
                </p>
                <p className="font-sans text-[12px] leading-6 text-subtle">
                  This area is paste-first. Drop a snippet with Ctrl/Cmd+V and
                  we will auto-detect the language, then render a read-only
                  highlighted preview.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
