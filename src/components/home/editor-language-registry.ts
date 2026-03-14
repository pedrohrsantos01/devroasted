import type { LanguageInput } from "shiki/core";

export const AUTO_LANGUAGE_VALUE = "auto" as const;

export type SupportedLanguageId =
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "json"
  | "html"
  | "css"
  | "bash"
  | "python"
  | "sql"
  | "go"
  | "rust"
  | "java"
  | "php"
  | "yaml"
  | "markdown"
  | "plaintext";

export type ShikiLanguageId = Exclude<SupportedLanguageId, "plaintext">;

export interface EditorLanguageOption {
  id: SupportedLanguageId;
  label: string;
}

export const editorLanguageOptions: EditorLanguageOption[] = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "jsx", label: "JSX" },
  { id: "tsx", label: "TSX" },
  { id: "json", label: "JSON" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "bash", label: "Bash" },
  { id: "python", label: "Python" },
  { id: "sql", label: "SQL" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "java", label: "Java" },
  { id: "php", label: "PHP" },
  { id: "yaml", label: "YAML" },
  { id: "markdown", label: "Markdown" },
  { id: "plaintext", label: "Plaintext" },
];

const editorLanguageLabelMap = new Map(
  editorLanguageOptions.map((option) => [option.id, option.label]),
);

export function getEditorLanguageLabel(language: SupportedLanguageId) {
  return editorLanguageLabelMap.get(language) ?? "Plaintext";
}

export function isShikiLanguage(
  language: SupportedLanguageId,
): language is ShikiLanguageId {
  return language !== "plaintext";
}

const shikiLanguageLoaders: Record<
  ShikiLanguageId,
  () => Promise<{ default: LanguageInput }>
> = {
  javascript: () => import("@shikijs/langs/javascript"),
  typescript: () => import("@shikijs/langs/typescript"),
  jsx: () => import("@shikijs/langs/jsx"),
  tsx: () => import("@shikijs/langs/tsx"),
  json: () => import("@shikijs/langs/json"),
  html: () => import("@shikijs/langs/html"),
  css: () => import("@shikijs/langs/css"),
  bash: () => import("@shikijs/langs/bash"),
  python: () => import("@shikijs/langs/python"),
  sql: () => import("@shikijs/langs/sql"),
  go: () => import("@shikijs/langs/go"),
  rust: () => import("@shikijs/langs/rust"),
  java: () => import("@shikijs/langs/java"),
  php: () => import("@shikijs/langs/php"),
  yaml: () => import("@shikijs/langs/yaml"),
  markdown: () => import("@shikijs/langs/markdown"),
};

export async function loadShikiLanguage(language: ShikiLanguageId) {
  const module = await shikiLanguageLoaders[language]();

  return module.default;
}
