import {z} from "zod";
export const hrOpenRecruiterConversationSchema=z.object({
 collegeId:z.string().uuid(), 
 jobId:z.string().uuid().optional(),
 message:z.string().trim().min(1).max(4000).optional(),
}).strict();
