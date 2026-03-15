import { randomUUID } from "node:crypto";

import type { roasts } from "@/db/schema";

export function createPublicSlug(
  language: typeof roasts.$inferInsert.language,
) {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  return `${language}-${suffix}`;
}
