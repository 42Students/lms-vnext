import {z} from "zod";
export const hrOpenRecruiterConversationSchema=z.object({
 collegeId:z.string().uuid(),
 jobId:z.string().uuid().optional(),
}).strict();
