import { z } from "zod";
import { createPlacementCompanyInputSchema } from "./validation";

/** College ownership comes from the authenticated TPO membership, never JSON. */
export const tpoCreateCompanySchema = createPlacementCompanyInputSchema
  .omit({ collegeId: true, isTrusted: true })
  .extend({ confirmed: z.literal(true) })
  .strict();
