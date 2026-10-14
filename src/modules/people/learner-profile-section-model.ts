import { z } from "zod";
import { learnerProfileDocumentSchema } from "./profile-validation";

export const learnerProfileSectionEditSchema = z.object({
  confirmed: z.literal(true),
  section: z.enum(["education","skills","projects"]),
  items: z.array(z.unknown()).max(100),
}).strict().superRefine((data,ctx) => {
  const sectionSchema = learnerProfileDocumentSchema.shape[data.section];
  const validated=sectionSchema.safeParse(data.items);
  if (!validated.success) {
    for(const issue of validated.error.issues) ctx.addIssue({
      code:"custom",path:["items",...issue.path],message:issue.message,
    });
  }
});

export function validateLearnerProfileSectionEdit(raw:unknown) {
  const input=learnerProfileSectionEditSchema.parse(raw);
  const items=learnerProfileDocumentSchema.shape[input.section].parse(input.items);
  const bytes=Buffer.byteLength(JSON.stringify(items),"utf8");
  if(bytes>48_000) throw new Error("PROFILE_SECTION_TOO_LARGE");
  return {section:input.section,items};
}
