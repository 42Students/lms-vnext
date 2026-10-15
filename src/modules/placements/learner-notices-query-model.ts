import {z} from "zod";
export const learnerNoticeQuerySchema=z.strictObject({
 pinned:z.enum(["0","1"]).optional(),
 unread:z.enum(["0","1"]).optional(),
});
