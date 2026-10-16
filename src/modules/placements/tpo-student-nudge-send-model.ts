import { z } from "zod";
export const tpoStudentNudgeTemplates={
 REGISTRATION:"Please review your placement registration choice in LMS. No enrollment choice is assumed.",
 RESUME:"Please review your resume information in LMS. Contact the Placement Cell if uploading is unavailable.",
 PROFILE:"Please complete your learner profile and verify that your academic details are correct.",
 APPLY:"Please review published placement drives and apply only to those you wish to join.",
 OFFER:"Please review your outstanding offer and respond within the communicated deadline.",
 CUSTOM:"",
} as const;
export const tpoStudentNudgeLabels={
 REGISTRATION:"Register for placements",
 RESUME:"Upload resume",
 PROFILE:"Complete profile",
 APPLY:"Apply to drives",
 OFFER:"Answer your offer",
 CUSTOM:"Write a message",
} as const;
export const tpoStudentNudgeTemplateSchema=z.enum([
 "REGISTRATION","RESUME","PROFILE","APPLY","OFFER","CUSTOM",
]);
export type TpoStudentNudgeTemplate=z.infer<typeof tpoStudentNudgeTemplateSchema>;
export const tpoStudentNudgeInputSchema=z.object({
 learnerMembershipIds:z.array(z.string().uuid()).min(1).max(25)
  .refine(ids=>new Set(ids).size===ids.length,"Select each learner only once"),
 template:tpoStudentNudgeTemplateSchema,
 message:z.string().trim().min(5).max(1000),
}).strict();
