import { and, eq, lte } from "drizzle-orm";

import { roasts } from "@/db/schema";

export const ROAST_PROCESSING_STALE_AFTER_MS = 5 * 60 * 1000;

export function isRoastProcessingStale(input: {
  now?: Date;
  updatedAt: Date;
}) {
  const now = input.now ?? new Date();

  return now.getTime() - input.updatedAt.getTime() >= ROAST_PROCESSING_STALE_AFTER_MS;
}

export async function recoverRoastProcessing(input: {
  db: typeof import("@/db/client").db;
  now?: Date;
  roastId: string;
  status: "processing" | "queued";
  triggerProcessing: (roastId: string) => Promise<void>;
  updatedAt: Date;
}) {
  try {
    if (input.status === "queued") {
      await input.triggerProcessing(input.roastId);
      return;
    }

    if (!isRoastProcessingStale({ now: input.now, updatedAt: input.updatedAt })) {
      return;
    }

    const now = input.now ?? new Date();
    const staleBefore = new Date(now.getTime() - ROAST_PROCESSING_STALE_AFTER_MS);

    const [reclaimed] = await input.db
      .update(roasts)
      .set({ status: "queued", updatedAt: now })
      .where(
        and(
          eq(roasts.id, input.roastId),
          eq(roasts.status, "processing"),
          lte(roasts.updatedAt, staleBefore),
        ),
      )
      .returning({ id: roasts.id });

    if (!reclaimed) {
      return;
    }

    await input.triggerProcessing(reclaimed.id);
  } catch (error) {
    console.error("Failed to recover roast processing.", input.roastId, error);
  }
}
