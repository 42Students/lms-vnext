import { z } from "zod";

/** Sprint goals and dates are registered in migration 0123. */
export const mentorSprintCreateParamsSchema = z.object({
  projectId:z.string().uuid(),
}).strict();
export const mentorSprintCreateSchema = z.object({
  releaseId:z.string().uuid(),
  title:z.string().trim().min(1).max(200),
  key:z.string().trim().max(120).optional(),
  dueLabel:z.string().trim().max(160).nullable().optional(),
  description:z.string().trim().max(4000).nullable(),
  goal:z.string().trim().max(4000).nullable(),definitionOfDone:z.string().trim().max(4000).nullable(),
  startDate:z.iso.date().nullable(),endDate:z.iso.date().nullable(),dueDate:z.iso.date().nullable(),
}).strict().superRefine((value,ctx)=>{
 if(value.startDate&&value.endDate&&value.endDate<value.startDate)
  ctx.addIssue({code:"custom",path:["endDate"],message:"End date must follow start date"});
 if(value.startDate&&value.dueDate&&value.dueDate<value.startDate)
  ctx.addIssue({code:"custom",path:["dueDate"],message:"Due date must not precede sprint start"});
});

export const mentorSprintTransitionParamsSchema = z.object({
  projectId:z.string().uuid(),sprintId:z.string().uuid(),
}).strict();
export const mentorSprintTransitionSchema = z.object({
  action:z.enum(["START","COMPLETE","REOPEN"]),
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  restoreCarry:z.boolean().optional(),
}).strict();

export function isValidMentorSprintTransition(before:string,action:string) {
  return (before==="PLANNED"&&action==="START") ||
    (before==="ACTIVE"&&action==="COMPLETE") ||
    (before==="COMPLETED"&&action==="REOPEN");
}
