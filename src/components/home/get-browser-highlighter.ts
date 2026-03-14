import type { HighlighterCore } from "shiki/core";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

import {
  isShikiLanguage,
  loadShikiLanguage,
  type SupportedLanguageId,
} from "@/components/home/editor-language-registry";

let highlighterPromise: Promise<HighlighterCore> | null = null;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createPlaintextHtml(code: string) {
  const lines = code.split("\n");

  const renderedLines = lines
    .map((line, index) => {
      const content = line.length > 0 ? escapeHtml(line) : "&nbsp;";

      return `<span class="editor-preview-line" data-line="${index + 1}">${content}</span>`;
    })
    .join("");

  return `<pre class="shiki shiki-theme"><code>${renderedLines}</code></pre>`;
}

async function createBrowserHighlighter() {
  return createHighlighterCore({
    engine: createOnigurumaEngine(() => import("shiki/wasm")),
    langs: [
      import("@shikijs/langs/bash"),
      import("@shikijs/langs/css"),
      import("@shikijs/langs/html"),
      import("@shikijs/langs/javascript"),
      import("@shikijs/langs/json"),
      import("@shikijs/langs/jsx"),
      import("@shikijs/langs/tsx"),
      import("@shikijs/langs/typescript"),
    ],
    themes: [import("@shikijs/themes/vesper")],
  });
}

export function getBrowserHighlighter() {
  highlighterPromise ??= createBrowserHighlighter();

  return highlighterPromise;
}

export function warmBrowserHighlighter() {
  void getBrowserHighlighter();
}

export async function highlightSnippet(
  code: string,
  language: SupportedLanguageId,
) {
  if (!code.trim()) {
    return createPlaintextHtml(code);
  }

  if (!isShikiLanguage(language)) {
    return createPlaintextHtml(code);
  }

  const highlighter = await getBrowserHighlighter();
  const loadedLanguages = highlighter.getLoadedLanguages();

  if (!loadedLanguages.includes(language)) {
    await highlighter.loadLanguage(await loadShikiLanguage(language));
  }

  return highlighter.codeToHtml(code, {
    lang: language,
    theme: "vesper",
    transformers: [
      {
        pre(node) {
          node.properties.style =
            "background-color: transparent; margin: 0; min-height: 360px; overflow-x: visible; padding: 0;";
        },
        line(node, line) {
          this.addClassToHast(node, "editor-preview-line");
          node.properties["data-line"] = String(line);
        },
      },
    ],
  });
}
