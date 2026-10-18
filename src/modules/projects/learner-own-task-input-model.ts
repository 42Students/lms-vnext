import {z} from "zod";

/** PROJ-BREAK-LEARNER-01: validation shared by the persisted learner task
 * creation command and its adversarial tests. No user-provided owner/tenant
 * or terminal status can be smuggled into this strict payload. */
export const learnerOwnTaskCreateInputSchema=z.strictObject({
 sprintId:z.string().uuid().nullable(),title:z.string().trim().min(1).max(200),
 description:z.string().trim().max(4000).nullable().default(null),
 approach:z.string().trim().max(4000).nullable().default(null),
 acceptanceCriteria:z.string().trim().max(4000).nullable().default(null),
 priority:z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).default("MEDIUM"),
 status:z.enum(["TODO","IN_PROGRESS","BLOCKED"]).default("TODO"),
 blockerReason:z.string().trim().max(4000).nullable().default(null),
 dueDate:z.iso.date().nullable().default(null),
 estimatePoints:z.number().int().min(0).max(1000).nullable().default(null),
 taskType:z.enum(["STORY","BUG","CHORE","SPIKE"]).nullable().default(null),
 expectedSprintUpdatedAt:z.iso.datetime({offset:true}).nullable(),
}).superRefine((input,ctx)=>{
 if(input.sprintId!==null&&!input.expectedSprintUpdatedAt)
  ctx.addIssue({code:"custom",path:["expectedSprintUpdatedAt"],message:"Choose an active sprint."});
 if(input.sprintId===null&&input.expectedSprintUpdatedAt!==null)
  ctx.addIssue({code:"custom",path:["expectedSprintUpdatedAt"],message:"Backlog tasks have no sprint version."});
 if(input.sprintId===null&&input.status!=="TODO")
  ctx.addIssue({code:"custom",path:["status"],message:"Backlog tasks must start To Do."});
 if(input.status==="BLOCKED"&&!input.blockerReason?.trim())
  ctx.addIssue({code:"custom",path:["blockerReason"],message:"What's blocking this task?"});
 if(input.status!=="BLOCKED"&&input.blockerReason)
  ctx.addIssue({code:"custom",path:["blockerReason"],message:"Clear blocker details before resuming work."});
});
