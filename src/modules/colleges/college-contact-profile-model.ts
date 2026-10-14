import { z } from "zod";
import { collegeBrandingInputSchema } from "./branding";

/** Only the public, non-secret support fields from registered college branding. */
export const collegeContactProfileInputSchema = collegeBrandingInputSchema.pick({
  supportEmail: true,
  supportPhone: true,
  termsUrl: true,
  privacyUrl: true,
}).extend({
  collegeName: z.string().trim().min(1).max(160),
  expectedVersion: z.number().int().min(0),
  confirm: z.literal(true),
}).strict();

export type CollegeContactProfileInput = z.infer<typeof collegeContactProfileInputSchema>;

export function collegeContactProfileChanged(
  old: Pick<CollegeContactProfileInput,
    "collegeName" | "supportEmail" | "supportPhone" | "termsUrl" | "privacyUrl">,
  next: Pick<CollegeContactProfileInput,
    "collegeName" | "supportEmail" | "supportPhone" | "termsUrl" | "privacyUrl">,
) {
  return old.collegeName !== next.collegeName ||
    old.supportEmail !== next.supportEmail ||
    old.supportPhone !== next.supportPhone ||
    old.termsUrl !== next.termsUrl ||
    old.privacyUrl !== next.privacyUrl;
}
