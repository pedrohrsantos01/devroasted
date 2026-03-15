import { z } from "zod";

import { triggerRoastProcessing } from "@/server/roasts/pipeline/trigger-roast-processing";
import { submitRoast } from "@/server/roasts/submit-roast";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";

export const roastsRouter = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        code: z.string().trim().min(1).max(3000),
        language: z.enum([
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
        ]),
        mode: z.enum(["honest", "roast"]),
      }),
    )
    .mutation(({ ctx, input }) =>
      submitRoast({
        code: input.code,
        db: ctx.db,
        language: input.language,
        mode: input.mode,
        triggerProcessing: (roastId) =>
          triggerRoastProcessing({ db: ctx.db, roastId }),
      }),
    ),
});
