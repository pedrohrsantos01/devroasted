import { pgEnum } from "drizzle-orm/pg-core";

export const codeLanguageEnum = pgEnum("code_language", [
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "sql",
  "python",
  "bash",
  "json",
  "html",
  "css",
  "go",
  "rust",
  "java",
  "php",
  "yaml",
  "markdown",
  "plaintext",
]);

export const roastModeEnum = pgEnum("roast_mode", ["honest", "roast"]);

export const roastStatusEnum = pgEnum("roast_status", [
  "queued",
  "processing",
  "completed",
  "failed",
]);

export const roastVisibilityEnum = pgEnum("roast_visibility", [
  "private",
  "public",
  "hidden",
]);

export const findingKindEnum = pgEnum("finding_kind", ["issue", "strength"]);

export const findingSeverityEnum = pgEnum("finding_severity", [
  "critical",
  "warning",
  "good",
]);
