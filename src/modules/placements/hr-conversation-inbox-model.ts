import {z} from "zod";
export const hrConversationQuerySchema=z.object({
 collegeId:z.string().uuid().optional(),
 q:z.string().trim().max(120).default(""),
}).strict();
export function filterRecruiterConversations<T extends {jobId:string|null;id:string}>(
 threads:readonly T[], jobIds:ReadonlySet<string>, query:string,
):T[]{
 const needle=query.trim().toLowerCase();
 return threads.filter(thread=>!thread.jobId || jobIds.has(thread.jobId))
  .filter(thread=>!needle || thread.jobId?.toLowerCase().includes(needle) || thread.id.toLowerCase().includes(needle));
}
