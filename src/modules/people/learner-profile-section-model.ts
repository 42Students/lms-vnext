import { z } from "zod";
import { learnerProfileDocumentSchema } from "./profile-validation";

export const learnerProfileSectionEditSchema = z.object({
  confirmed: z.literal(true),
  section: z.enum(["education","skills","projects"]),
  items: z.array(z.unknown()).max(100),
  expectedItems: z.array(z.unknown()).max(100).optional(),
}).strict().superRefine((data,ctx) => {
  const sectionSchema = learnerProfileDocumentSchema.shape[data.section];
  const validated=sectionSchema.safeParse(data.items);
  if (!validated.success) {
    for(const issue of validated.error.issues) ctx.addIssue({
      code:"custom",path:["items",...issue.path],message:issue.message,
    });
  }
  if(data.expectedItems!==undefined){
    const before=sectionSchema.safeParse(data.expectedItems);
    if(!before.success)for(const issue of before.error.issues)
      ctx.addIssue({code:"custom",path:["expectedItems",...issue.path],message:issue.message});
  }
});

export function validateLearnerProfileSectionEdit(raw:unknown) {
  const input=learnerProfileSectionEditSchema.parse(raw);
  const items=learnerProfileDocumentSchema.shape[input.section].parse(input.items);
  const expectedItems=input.expectedItems===undefined?undefined:
    learnerProfileDocumentSchema.shape[input.section].parse(input.expectedItems);
  const bytes=Buffer.byteLength(JSON.stringify(items),"utf8");
  if(bytes>48_000) throw new Error("PROFILE_SECTION_TOO_LARGE");
  if(expectedItems!==undefined && Buffer.byteLength(JSON.stringify(expectedItems),"utf8")>48_000)
    throw new Error("PROFILE_SECTION_TOO_LARGE");
  return {section:input.section,items,expectedItems};
}

/** Same-section conflict only; unrelated section updates are safely mergeable. */
export function isLearnerProfileSectionStale(current:unknown,expected:unknown){
  return JSON.stringify(current)!==JSON.stringify(expected);
}
