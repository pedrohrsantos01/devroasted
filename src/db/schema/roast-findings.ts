import { sql } from "drizzle-orm";
import { check, index, pgTable } from "drizzle-orm/pg-core";

import { findingKindEnum, findingSeverityEnum } from "./enums";
import { roasts } from "./roasts";

export const roastFindings = pgTable(
  "roast_findings",
  (table) => ({
    id: table.uuid().defaultRandom().primaryKey(),
    roastId: table
      .uuid()
      .notNull()
      .references(() => roasts.id, { onDelete: "cascade" }),
    kind: findingKindEnum().notNull(),
    severity: findingSeverityEnum().notNull(),
    title: table.varchar({ length: 160 }).notNull(),
    description: table.text().notNull(),
    sortOrder: table.integer().notNull(),
    lineStart: table.integer(),
    lineEnd: table.integer(),
    createdAt: table.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [
    index("roast_findings_lookup_idx").on(table.roastId, table.sortOrder),
    check(
      "roast_findings_sort_order_non_negative_check",
      sql`${table.sortOrder} >= 0`,
    ),
    check(
      "roast_findings_line_range_check",
      sql`${table.lineEnd} is null or ${table.lineStart} is null or ${table.lineEnd} >= ${table.lineStart}`,
    ),
  ],
);
