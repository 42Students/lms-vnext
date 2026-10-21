import {z} from "zod";
export const hrRecruiterReplySchema=z.object({
 threadId:z.string().uuid(),
 quoteId:z.string().uuid().optional(),
 body:z.string().trim().min(1).max(4000)
  .refine(value=>!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value),
   {message:"Message contains unsupported characters"}),
}).strict();
