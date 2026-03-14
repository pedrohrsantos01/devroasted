import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import php from "highlight.js/lib/languages/php";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

import type { SupportedLanguageId } from "@/components/home/editor-language-registry";

const detector = hljs.newInstance();

detector.registerLanguage("bash", bash);
detector.registerLanguage("css", css);
detector.registerLanguage("go", go);
detector.registerLanguage("java", java);
detector.registerLanguage("javascript", javascript);
detector.registerLanguage("json", json);
detector.registerLanguage("markdown", markdown);
detector.registerLanguage("php", php);
detector.registerLanguage("plaintext", plaintext);
detector.registerLanguage("python", python);
detector.registerLanguage("rust", rust);
detector.registerLanguage("sql", sql);
detector.registerLanguage("typescript", typescript);
detector.registerLanguage("xml", xml);
detector.registerLanguage("yaml", yaml);

const detectionSubset = [
  "bash",
  "css",
  "go",
  "java",
  "javascript",
  "json",
  "markdown",
  "php",
  "plaintext",
  "python",
  "rust",
  "sql",
  "typescript",
  "xml",
  "yaml",
];

function looksLikeJsx(code: string) {
  return (
    /<([A-Za-z][\w.-]*)(\s[^<>]*)?>/.test(code) &&
    /(<\/[A-Za-z][\w.-]*>|\/>)|className=/.test(code)
  );
}

function looksLikeTypeScript(code: string) {
  return /\binterface\s+\w+|\btype\s+\w+\s*=|:\s*[A-Z_a-z][\w<>{}[\]|, ]*|\bas\s+const\b/.test(
    code,
  );
}

function looksLikeHtml(code: string) {
  return /<!DOCTYPE|<html|<head|<body|<main|<section|<div|<span|<script|<style/i.test(
    code,
  );
}

function mapDetectedLanguage(
  rawLanguage: string,
  code: string,
): SupportedLanguageId {
  switch (rawLanguage) {
    case "bash":
    case "shell":
      return "bash";
    case "css":
      return "css";
    case "go":
      return "go";
    case "java":
      return "java";
    case "javascript":
      return looksLikeJsx(code) ? "jsx" : "javascript";
    case "json":
      return "json";
    case "markdown":
      return "markdown";
    case "php":
      return "php";
    case "plaintext":
    case "text":
      return "plaintext";
    case "python":
      return "python";
    case "rust":
      return "rust";
    case "sql":
      return "sql";
    case "typescript":
      return looksLikeJsx(code) ? "tsx" : "typescript";
    case "xml":
      if (looksLikeJsx(code)) {
        return looksLikeTypeScript(code) ? "tsx" : "jsx";
      }

      return looksLikeHtml(code) ? "html" : "plaintext";
    case "yaml":
      return "yaml";
    default:
      return "plaintext";
  }
}

export async function detectEditorLanguage(
  code: string,
): Promise<SupportedLanguageId> {
  if (!code.trim()) {
    return "plaintext";
  }

  const result = detector.highlightAuto(code, detectionSubset);

  if (!result.language) {
    return "plaintext";
  }

  const mappedLanguage = mapDetectedLanguage(result.language, code);
  const secondBestRelevance = result.secondBest?.relevance ?? 0;
  const relevanceDelta = result.relevance - secondBestRelevance;

  if (mappedLanguage === "plaintext") {
    return "plaintext";
  }

  if (result.relevance < 4 && relevanceDelta < 2) {
    return "plaintext";
  }

  return mappedLanguage;
}
