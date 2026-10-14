import { z } from "zod";

export const facultySubmissionContentSchema = z.object({
  id: z.string().uuid(),
  submissionType: z.enum(["TEXT","LINK","FILE"]),
  textContent: z.string().max(50000).nullable(),
  submissionUrl: z.string().max(2048).nullable(),
}).strict();

/** File reads use the authorized redirect endpoint, never stored object keys. */
export function facultySubmissionContentView(raw: unknown, filesEnabled: boolean) {
  const input = facultySubmissionContentSchema.parse(raw);
  if (input.submissionType === "TEXT") {
    return input.textContent?.trim()
      ? {kind:"TEXT" as const,text:input.textContent}
      : {kind:"UNAVAILABLE" as const,message:"No submitted text is available."};
  }
  if (input.submissionType === "FILE") {
    return filesEnabled
      ? {kind:"FILE" as const,href:"/api/courses/assignment-submissions/"+encodeURIComponent(input.id)+"/file",label:"View private submitted file ↗"}
      : {kind:"UNAVAILABLE" as const,message:"Private-file review is currently unavailable. Contact your college administrator."};
  }
  try {
    const url = new URL(input.submissionUrl ?? "");
    if (url.protocol === "https:" && !url.username && !url.password) {
      return {kind:"LINK" as const,href:url.toString(),label:"Open learner submission ↗"};
    }
  } catch { /* Missing or unsafe stored links remain unavailable. */ }
  return {kind:"UNAVAILABLE" as const,message:"No safe submission link is available."};
}
