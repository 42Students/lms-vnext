import {z} from "zod";
export const learnerNoticeQuerySchema=z.strictObject({
 pinned:z.enum(["0","1"]).optional(),
 unread:z.enum(["0","1"]).optional(),
 q:z.string().trim().max(100).optional(),
 recent:z.enum(["0","1"]).optional(),
 page:z.string().regex(/^[1-9][0-9]{0,3}$/).transform(value=>Number(value)).optional(),
 sort:z.enum(["pinned","latest","oldest"]).optional(),
});
