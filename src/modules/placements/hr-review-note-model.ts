import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const recruiterReviewNoteSchema=z.object({
 applicationId:zUuid,
 rating:z.number().int().min(1).max(5),
 note:z.string().trim().min(1).max(2000),
 version:z.number().int().nonnegative(),
}).strict();
