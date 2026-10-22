import {z} from "zod";
import {projectTaskExpandedFieldsSchema} from "./pr-s2-04-task-fields-model";
export const mentorTaskCreateParamsSchema=z.object({
  projectId:z.string().uuid(),
}).strict();
/** Legacy TASK_FIELDS (projectSectionFieldConfigs.js:90-140) -> vNext field map.
 * key (auto from title)      -> none: vNext tasks are keyed by UUID, never a typed key.
 * priority Low/Medium/High   -> priority LOW/MEDIUM/HIGH (+CRITICAL), required.
 * title (required)           -> title, 1-200 chars.
 * sprintKey (blank=backlog)  -> sprintId + expectedSprintUpdatedAt; null = backlog (status TODO).
 * estimatePoints 1,2,3,5,8,13-> estimatePoints int 0-1000; the UI offers the project's
 *                               estimation-unit scale (mentor-estimation-unit-model.ts),
 *                               which contains the legacy scale.
 * taskType Story/Bug/Chore/Spike -> taskType STORY/BUG/CHORE/SPIKE, optional.
 * dueLabel (free text)       -> dueDate ISO date (a real date replaces the label).
 * description / acceptanceCriteria / approach -> same names, each max 4000 chars.
 * vNext-only: status (TODO default), assigneeMembershipId, blockerReason (required when BLOCKED). */
export const mentorTaskCreateSchema=z.object({
  sprintId:z.string().uuid().nullable(),
  title:z.string().trim().min(1).max(200),
  description:z.string().trim().max(4000).nullable(),
  approach:z.string().trim().max(4000).nullable().default(null),
  acceptanceCriteria:z.string().trim().max(4000).nullable(),
  priority:z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]),
  status:z.enum(["TODO","IN_PROGRESS","BLOCKED"]).default("TODO"),
  assigneeMembershipId:z.string().uuid().nullable().default(null),
  expectedSprintUpdatedAt:z.iso.datetime({offset:true}).nullable(),
  ...projectTaskExpandedFieldsSchema.shape,
}).strict().superRefine((input,context)=>{
  if(input.sprintId!==null&&!input.expectedSprintUpdatedAt)
    context.addIssue({code:"custom",path:["expectedSprintUpdatedAt"],message:"Choose a valid sprint before saving."});
  if(input.sprintId===null&&input.expectedSprintUpdatedAt!==null)
    context.addIssue({code:"custom",path:["expectedSprintUpdatedAt"],message:"Backlog tasks have no sprint version."});
  if(input.sprintId===null&&input.status!=="TODO")
    context.addIssue({code:"custom",path:["status"],message:"Backlog tasks must start To Do."});
  if(input.status==="BLOCKED"&&!input.blockerReason?.trim())
    context.addIssue({code:"custom",path:["blockerReason"],message:"What's blocking this task?"});
});
