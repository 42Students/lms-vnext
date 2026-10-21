import{z}from"zod";import{classTeamPreviewSchema}from"./class-team-preview-validation";export const createClassTeamWorkspacesSchema=z.object({collegeId:z.string().uuid(),classId:z.string().uuid(),templateId:z.string().uuid(),rosterRevision:z.string().min(1).max(128),baseTitle:z.string().trim().min(1).max(160),summary:z.string().trim().max(2000).optional(),primaryMentorMembershipId:z.string().uuid().optional(),baseSlug:z.string().trim().min(1).max(50).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),initialStatus:z.enum(["PLANNED","ACTIVE"]).default("PLANNED"),cohortMode:z.boolean().default(false),teams:classTeamPreviewSchema,expectedPreviewVersion:z.string().regex(/^[0-9a-f]{8}$/)}).strict().superRefine((value,ctx)=>{
 if(value.initialStatus==="ACTIVE"&&!value.primaryMentorMembershipId){
  ctx.addIssue({code:"custom",path:["primaryMentorMembershipId"],
   message:"A mentor is required before a workspace can be Active"});
 }
});export type CreateClassTeamWorkspaces=z.infer<typeof createClassTeamWorkspacesSchema>;
/**
 * Legacy class picker help changes with cohort mode. The schema above keeps
 * classId required for writes; the client should show this hint beside Select
 * before submitting an empty value to Zod.
 */
export function classTeamClassPickerMessage(input: {
 classId?: string | null;
 cohortMode: boolean;
}): string | null {
 if (input.classId?.trim()) return null;
 return input.cohortMode ? "Class is required in cohort mode" : "Pick the class to split into teams";
}
