import { sql } from "drizzle-orm";
import { check, pgTable } from "drizzle-orm/pg-core";

import {
  codeLanguageEnum,
  roastModeEnum,
  roastStatusEnum,
  roastVisibilityEnum,
} from "./enums";

export const roasts = pgTable(
  "roasts",
  (table) => ({
    id: table.uuid().defaultRandom().primaryKey(),
    publicSlug: table.varchar({ length: 64 }).notNull().unique(),
    originalCode: table.text().notNull(),
    improvedCode: table.text(),
    language: codeLanguageEnum().notNull(),
    mode: roastModeEnum().default("roast").notNull(),
    status: roastStatusEnum().default("queued").notNull(),
    visibility: roastVisibilityEnum().default("public").notNull(),
    score: table.numeric({ precision: 3, scale: 1 }),
    verdictLabel: table.text(),
    summary: table.text(),
    lineCount: table.integer().notNull(),
    meta: table.jsonb().$type<Record<string, unknown>>(),
    createdAt: table.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: table.timestamp({ withTimezone: true }).defaultNow().notNull(),
    completedAt: table.timestamp({ withTimezone: true }),
    publishedAt: table.timestamp({ withTimezone: true }),
  }),
  (table) => [
    check(
      "roasts_score_range_check",
      sql`${table.score} >= 0 and ${table.score} <= 10`,
    ),
    check("roasts_line_count_positive_check", sql`${table.lineCount} > 0`),
  ],
);
