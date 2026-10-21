import { z } from "zod";
export const tpoStudentNudgeTemplates={
 REGISTRATION:"Registration for placements is open. Please choose Placements, Higher studies or Not interested in your Placements page.",
 RESUME:"Please upload your resume to your profile. Companies see it when you apply.",
 PROFILE:"Please complete your profile and academic details, with marksheets, and submit them for verification.",
 APPLY:"There are open drives you can apply to. Please check your Placements page.",
 OFFER:"You have an offer waiting for your answer. Please accept or decline it before it expires.",
 CUSTOM:"",
} as const;
export const tpoStudentNudgeLabels={
 REGISTRATION:"Register",
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
