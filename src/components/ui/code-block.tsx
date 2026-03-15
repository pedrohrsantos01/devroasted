import "server-only";

import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { cacheLife } from "next/cache";
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
  "use cache";

  cacheLife("max");

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
  Root: CodeBlockRoot,
};
