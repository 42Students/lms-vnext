import { z } from "zod";
import { createPlacementCompanyInputSchema } from "./validation";

/** College ownership comes from the authenticated TPO membership, never JSON. */
export const tpoCreateCompanySchema = createPlacementCompanyInputSchema
  .omit({ collegeId: true })
  .extend({ confirmed: z.literal(true) })
  .strict();
