import {z} from "zod";

/** Admin task authoring does not mutate assignee, status or submission state. */
export const adminTaskPlanCreateSchema=z.strictObject({
 expectedTasksToken:z.string().regex(/^[a-f0-9]{64}$/),
 sprintId:z.string().uuid().nullable(),
 key:z.string().trim().max(120).optional(),
 title:z.string().trim().min(1).max(200),
 priority:z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).default("MEDIUM"),
 estimatePoints:z.number().int().min(0).max(1000).nullable(),
 taskType:z.enum(["STORY","BUG","CHORE","SPIKE"]).nullable(),
 dueLabel:z.string().trim().max(160).nullable(),
 description:z.string().trim().max(4000).nullable(),
 acceptanceCriteria:z.string().trim().max(4000).nullable(),
 approach:z.string().trim().max(4000).nullable(),
});
export type AdminTaskPlanCreateInput=z.infer<typeof adminTaskPlanCreateSchema>;
