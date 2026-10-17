import {z} from "zod";
import {projectTaskExpandedFieldsSchema} from "./pr-s2-04-task-fields-model";
export const mentorTaskCreateParamsSchema=z.object({
  projectId:z.string().uuid(),
}).strict().superRefine((input,context)=>{
  if(input.sprintId!==null&&!input.expectedSprintUpdatedAt)
    context.addIssue({code:"custom",path:["expectedSprintUpdatedAt"],message:"Choose a valid sprint before saving."});
  if(input.sprintId===null&&input.status!=="TODO")
    context.addIssue({code:"custom",path:["status"],message:"Backlog tasks must start To Do."});
  if(input.status==="BLOCKED"&&!input.blockerReason?.trim())
    context.addIssue({code:"custom",path:["blockerReason"],message:"What's blocking this task?"});
});
export const mentorTaskCreateSchema=z.object({
  sprintId:z.string().uuid().nullable(),
  title:z.string().trim().min(1).max(200),
  description:z.string().trim().max(4000).nullable(),
  acceptanceCriteria:z.string().trim().max(4000).nullable(),
  priority:z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]),
  status:z.enum(["TODO","IN_PROGRESS","BLOCKED"]).default("TODO"),
  assigneeMembershipId:z.string().uuid().nullable().default(null),
  expectedSprintUpdatedAt:z.iso.datetime({offset:true}).nullable(),
  ...projectTaskExpandedFieldsSchema.shape,
}).strict();
