import { z } from "zod";
/** Direct status route is not a publish endpoint: publish requires review. */
export const legacyDriveStatusActionSchema = z.strictObject({
  action: z.literal("CLOSE"),
});
export const PUBLISH_ENTRY_COPY = {
  review: "Review the drive and confirm who is told before publishing.",
  draft: "Create draft",
} as const;
