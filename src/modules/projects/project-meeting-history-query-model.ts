import { z } from "zod";

/** Bounded typed edit-history cursor. This is not the Past meetings list;
 * it can be wired only after DB07 meeting history migration is registered.
 * The caller must still prove project-level read permission in the DB query. */
export const projectMeetingHistoryQuerySchema = z.strictObject({
 projectId: z.string().uuid(),
 meetingKey: z.string().trim().min(1).max(120),
 limit: z.coerce.number().int().min(1).max(50).default(25),
 beforeCreatedAt: z.iso.datetime({offset:true}).optional(),
 beforeId: z.string().uuid().optional(),
}).superRefine((query,ctx)=>{
 if(Boolean(query.beforeCreatedAt)!==Boolean(query.beforeId)){
  ctx.addIssue({code:"custom",path:["beforeId"],
   message:"Meeting history cursor needs both timestamp and event ID."});
 }
});
export type ProjectMeetingHistoryQuery = z.infer<typeof projectMeetingHistoryQuerySchema>;

/** Sort descending by (created_at,id) to keep stable pages as new edits arrive.
 * Never implement OFFSET over an unbounded history in this endpoint. */
export const projectMeetingHistoryOrdering = ["created_at DESC","id DESC"] as const;
