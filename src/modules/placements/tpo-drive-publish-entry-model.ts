import { z } from "zod";
/** Direct status route is not a publish endpoint: publish requires review. */
export const legacyDriveStatusActionSchema = z.strictObject({
  action: z.literal("CLOSE"),
});
export const PUBLISH_ENTRY_COPY = {
  review: "Review the drive and confirm who is told before publishing.",
  draft: "Create draft",
} as const;

/** Recruiter-owned draft requests are never created by the TPO publish route.
 * REQUEST creates a separate reviewable recruiter request, while a TPO
 * creates a DRAFT and only publishes after explicit preflight/confirmation. */
export const legacyDriveCreateEntrySchema=z.discriminatedUnion("action",[
 z.strictObject({action:z.literal("CREATE_DRAFT"),origin:z.literal("TPO")}),
 z.strictObject({action:z.literal("REQUEST"),origin:z.literal("RECRUITER")}),
]);
export function legacyDriveCreateDestination(raw:unknown){
 const input=legacyDriveCreateEntrySchema.parse(raw);
 return input.action==="REQUEST"
  ?{href:"/hr/drives/request",initialStatus:"REQUEST" as const,
     message:"Send a drive request to the placement cell for review."}
  :{href:"/tpo/placements/jobs/new",initialStatus:"DRAFT" as const,
     message:PUBLISH_ENTRY_COPY.review};
}
