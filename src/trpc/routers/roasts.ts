import { z } from "zod";

import { triggerRoastProcessing } from "@/server/roasts/pipeline/trigger-roast-processing";
import { getRoastBySlug } from "@/server/roasts/queries/get-roast-by-slug";
import { submitRoast } from "@/server/roasts/submit-roast";
import { submitRoastInputSchema } from "@/server/roasts/submit-roast-input";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";

export const roastsRouter = createTRPCRouter({
  bySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(64),
      }),
    )
    .query(({ ctx, input }) =>
      getRoastBySlug({ db: ctx.db, slug: input.slug }),
    ),
  submit: publicProcedure
    .input(submitRoastInputSchema)
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
