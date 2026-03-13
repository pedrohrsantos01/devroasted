import "server-only";

import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import {
  type ComponentPropsWithoutRef,
  cache,
  Fragment,
  type JSX,
} from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import type { BundledLanguage } from "shiki";
import { codeToHast } from "shiki";

import { cn } from "@/lib/utils";

const highlightCode = cache(
  async (code: string, lang: BundledLanguage, showLineNumbers: boolean) => {
    return codeToHast(code, {
      lang,
      theme: "vesper",
      transformers: [
        {
          pre(node) {
            this.addClassToHast(node, "code-block-pre");
            node.properties.style =
              "background-color: transparent; margin: 0; overflow-x: visible; padding: 0;";
          },
          code(node) {
            this.addClassToHast(node, "code-block-code");
          },
          line(node, line) {
            this.addClassToHast(node, "code-block-line");

            if (showLineNumbers) {
              node.properties["data-line"] = String(line);
            }
          },
        },
      ],
    });
  },
);

export interface CodeBlockRootProps extends ComponentPropsWithoutRef<"div"> {}

export function CodeBlockRoot({ className, ...props }: CodeBlockRootProps) {
  return (
    <div
      className={cn(
        "overflow-hidden border border-border-primary bg-surface-code text-foreground-inverse",
        className,
      )}
      {...props}
    />
  );
}

export interface CodeBlockHeaderProps extends ComponentPropsWithoutRef<"div"> {}

export function CodeBlockHeader({ className, ...props }: CodeBlockHeaderProps) {
  return (
    <div
      className={cn(
        "flex h-10 items-center gap-3 border-b border-border-primary px-4",
        className,
      )}
      {...props}
    />
  );
}

export interface CodeBlockTrafficLightsProps
  extends ComponentPropsWithoutRef<"div"> {}

export function CodeBlockTrafficLights({
  className,
  ...props
}: CodeBlockTrafficLightsProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      <span aria-hidden="true" className="size-2.5 rounded-full bg-critical" />
      <span aria-hidden="true" className="size-2.5 rounded-full bg-warning" />
      <span
        aria-hidden="true"
        className="size-2.5 rounded-full bg-accent-green"
      />
    </div>
  );
}

export interface CodeBlockFilenameProps
  extends ComponentPropsWithoutRef<"span"> {}

export function CodeBlockFilename({
  className,
  ...props
}: CodeBlockFilenameProps) {
  return (
    <span
      className={cn("ml-auto font-mono text-[12px] text-subtle", className)}
      {...props}
    />
  );
}

export interface CodeBlockContentProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  children: string;
  lang: BundledLanguage;
  showLineNumbers?: boolean;
}

export async function CodeBlockContent({
  children,
  className,
  lang,
  showLineNumbers = true,
  ...props
}: CodeBlockContentProps) {
  const hast = await highlightCode(children, lang, showLineNumbers);
  const renderedCode = toJsxRuntime(hast, {
    Fragment,
    jsx,
    jsxs,
  }) as JSX.Element;

  return (
    <div
      className={cn("code-block-content overflow-x-auto", className)}
      data-line-numbers={showLineNumbers}
      {...props}
    >
      {renderedCode}
    </div>
  );
}

export const CodeBlock = {
  Content: CodeBlockContent,
  Filename: CodeBlockFilename,
  Header: CodeBlockHeader,
  Root: CodeBlockRoot,
  TrafficLights: CodeBlockTrafficLights,
};
