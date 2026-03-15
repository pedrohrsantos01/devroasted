import { triggerRoastProcessing } from "@/server/roasts/pipeline/trigger-roast-processing";
import { submitRoast } from "@/server/roasts/submit-roast";
import { submitRoastInputSchema } from "@/server/roasts/submit-roast-input";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";

export const roastsRouter = createTRPCRouter({
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
