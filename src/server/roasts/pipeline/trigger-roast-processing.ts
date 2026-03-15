import { and, eq } from "drizzle-orm";

import { roasts } from "@/db/schema";
import { runRoastAnalysisPipeline } from "@/server/roasts/pipeline/run-roast-analysis-pipeline";

export async function triggerRoastProcessing(input: {
  db: typeof import("@/db/client").db;
  roastId: string;
  runPipeline?: typeof runRoastAnalysisPipeline;
}) {
  const [claimed] = await input.db
    .update(roasts)
    .set({ status: "processing", updatedAt: new Date() })
    .where(and(eq(roasts.id, input.roastId), eq(roasts.status, "queued")))
    .returning({ id: roasts.id });

  if (!claimed) {
    return;
  }

  const runPipeline = input.runPipeline ?? runRoastAnalysisPipeline;

  void runPipeline({ db: input.db, roastId: claimed.id }).catch((error) => {
    console.error("Failed to run roast analysis pipeline.", claimed.id, error);
  });
}
