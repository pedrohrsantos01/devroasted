"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { SupportedLanguageId } from "@/components/home/editor-language-registry";
import { MAX_SNIPPET_CHARACTERS } from "@/components/home/editor-snippet-constraints";
import { HomeCodeEditor } from "@/components/home/home-code-editor";
import {
  Button,
  ToggleField,
  ToggleLabel,
  ToggleRoot,
  ToggleThumb,
} from "@/components/ui";
import { useTRPC } from "@/trpc/client";

export const homeHeroDependencies = {
  HomeCodeEditor,
  useMutation,
  useRouter,
  useTRPC,
};

interface HomeHeroProps {
  children?: ReactNode;
}

export function HomeHero({ children }: HomeHeroProps) {
  const router = homeHeroDependencies.useRouter();
  const trpc = homeHeroDependencies.useTRPC();
  const [snippet, setSnippet] = useState("");
  const [language, setLanguage] = useState<SupportedLanguageId>("plaintext");
  const [mode, setMode] = useState<"honest" | "roast">("roast");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitRoast = homeHeroDependencies.useMutation(
    trpc.roasts.submit.mutationOptions({
      onError: () => {
        setSubmitError(
          "We could not submit your snippet right now. Try again in a moment.",
        );
      },
      onSuccess: (result) => {
        setSubmitError(null);
        router.push(`/roasts/${result.publicSlug}`);
      },
    }),
  );

  const isSendDisabled = useMemo(() => {
    return (
      snippet.trim().length === 0 ||
      snippet.length > MAX_SNIPPET_CHARACTERS ||
      submitRoast.isPending
    );
  }, [snippet, submitRoast.isPending]);

  function handleSubmit() {
    if (isSendDisabled) {
      return;
    }

    setSubmitError(null);
    submitRoast.mutate({
      code: snippet,
      language,
      mode,
    });
  }

  return (
    <section className="flex flex-col items-center gap-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="flex flex-wrap items-center justify-center gap-3 font-mono text-3xl font-bold tracking-[-0.04em] text-foreground-inverse sm:text-4xl md:text-5xl">
          <span className="text-accent-green">$</span>
          <span>paste your code. get roasted.</span>
        </h1>

        <p className="max-w-[720px] font-sans text-sm leading-6 text-muted md:text-[14px]">
          {
            "// drop your code below and we'll rate it - brutally honest or full roast mode"
          }
        </p>
      </div>

      <homeHeroDependencies.HomeCodeEditor
        className="w-full max-w-[780px]"
        onCodeChange={setSnippet}
        onLanguageChange={setLanguage}
      />

      <div className="flex w-full max-w-[780px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <ToggleField className="justify-center sm:justify-start">
            <ToggleRoot
              checked={mode === "roast"}
              onCheckedChange={(checked) => {
                setMode(checked ? "roast" : "honest");
              }}
            >
              <ToggleThumb />
            </ToggleRoot>
            <ToggleLabel>roast mode</ToggleLabel>
          </ToggleField>
          <span className="font-sans text-[12px] text-subtle">
            {mode === "roast"
              ? "// maximum sarcasm enabled"
              : "// blunt but constructive feedback enabled"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-end">
          <Button
            className="focus-visible:ring-offset-page"
            disabled={isSendDisabled}
            onClick={handleSubmit}
          >
            {submitRoast.isPending ? "$ roasting..." : "$ roast_my_code"}
          </Button>

          {submitError ? (
            <p
              aria-live="polite"
              className="font-sans text-[12px] text-critical"
            >
              {submitError}
            </p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  );
}
