import {z} from "zod";
export const hrRecruiterReplySchema=z.object({
 threadId:z.string().uuid(),
 body:z.string().trim().min(1).max(4000),
}).strict();
