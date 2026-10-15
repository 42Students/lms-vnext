import {z} from "zod";
export const recruiterReviewNoteSchema=z.object({
 applicationId:z.string().uuid(),
 rating:z.number().int().min(1).max(5),
 note:z.string().trim().min(1).max(2000),
 version:z.number().int().nonnegative(),
}).strict();
