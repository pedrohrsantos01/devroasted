import { randomUUID } from "node:crypto";

export function createPublicSlug(language: string) {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  return `${language}-${suffix}`;
}
