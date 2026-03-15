import { roasts } from "@/db/schema";
import { createPublicSlug } from "@/server/roasts/create-public-slug";

export async function submitRoast(input: {
  code: string;
  db: typeof import("@/db/client").db;
  language: typeof roasts.$inferInsert.language;
  mode: typeof roasts.$inferInsert.mode;
  triggerProcessing: (roastId: string) => Promise<void>;
}) {
  const lineCount = input.code.split("\n").length;

  const [created] = await input.db
    .insert(roasts)
    .values({
      language: input.language,
      lineCount,
      mode: input.mode,
      originalCode: input.code,
      publicSlug: createPublicSlug(input.language),
      status: "queued",
      visibility: "public",
    })
    .returning({
      id: roasts.id,
      publicSlug: roasts.publicSlug,
      status: roasts.status,
    });

  try {
    await input.triggerProcessing(created.id);
  } catch {
    // keep the roast queued so the result page can still render processing
  }

  return created;
}
