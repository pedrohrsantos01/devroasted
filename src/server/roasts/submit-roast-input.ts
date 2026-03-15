import { z } from "zod";

import { codeLanguageEnum, roastModeEnum } from "@/db/schema";

export const submitRoastInputSchema = z.object({
  code: z.string().trim().min(1).max(3000),
  language: z.enum(codeLanguageEnum.enumValues),
  mode: z.enum(roastModeEnum.enumValues),
});
