import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const hrOpenRecruiterConversationSchema=z.object({
 collegeId:zUuid, 
 jobId:zUuid.optional(),
 message:z.string().trim().min(1).max(4000).optional(),
}).strict();
