import {z} from "zod";
const uuid=z.string().uuid();
export const recruiterTaskLinkSchema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("FIX_DRIVE"),jobId:uuid}),
 z.object({kind:z.literal("HIRE_AGAIN"),jobId:uuid}),
 z.object({kind:z.literal("REVIEW_APPLICANTS"),jobId:uuid}),
 z.object({kind:z.literal("MESSAGES")}),
]);
export type RecruiterTaskLink=z.infer<typeof recruiterTaskLinkSchema>;
export function recruiterTodayHref(raw:unknown):string {
 const value=recruiterTaskLinkSchema.parse(raw);
 switch(value.kind){
 case "FIX_DRIVE":return `/recruiter/drives/new?fix=${value.jobId}`;
 case "HIRE_AGAIN":return `/recruiter/drives/new?from=${value.jobId}`;
 case "REVIEW_APPLICANTS":return `/recruiter/drives/${value.jobId}?tab=applicants&review=1`;
 case "MESSAGES":return "/recruiter/messages";
 }
}
