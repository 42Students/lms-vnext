import{z}from"zod";import{classTeamPreviewSchema}from"./class-team-preview-validation";export const createClassTeamWorkspacesSchema=z.object({collegeId:z.string().uuid(),classId:z.string().uuid(),templateId:z.string().uuid(),rosterRevision:z.string().min(1).max(128),baseTitle:z.string().trim().min(1).max(170),baseSlug:z.string().trim().min(1).max(50).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),primaryMentorMembershipId:z.string().uuid().optional(),
 initialStatus:z.enum(["PLANNED","ACTIVE"]).default("PLANNED"),
 initialPhase:z.string().trim().max(80).nullable().optional(),
 cohortMode:z.boolean().default(false),teams:classTeamPreviewSchema,expectedPreviewVersion:z.string().regex(/^[0-9a-f]{8}$/)}).strict();export type CreateClassTeamWorkspaces=z.infer<typeof createClassTeamWorkspacesSchema>;
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
