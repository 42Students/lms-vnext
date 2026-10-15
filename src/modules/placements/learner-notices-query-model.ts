import {z} from "zod";
export const learnerNoticeQuerySchema=z.strictObject({
 pinned:z.enum(["0","1"]).optional(),
 unread:z.enum(["0","1"]).optional(),
 q:z.string().trim().max(100).optional(),
 recent:z.enum(["0","1"]).optional(),
 page:z.coerce.number().int().min(1).max(9999).optional(),
});
