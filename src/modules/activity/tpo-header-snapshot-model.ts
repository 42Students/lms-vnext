import {z} from "zod";
export const tpoHeaderSnapshotSchema=z.object({
 messages:z.number().int().nonnegative(),
 unread:z.number().int().nonnegative(),
 items:z.array(z.object({
  id:z.string().uuid(),title:z.string(),body:z.string().nullable(),
  actionHref:z.string().nullable(),readAt:z.string().nullable(),
 })).max(20),
});
export type TpoHeaderSnapshot=z.infer<typeof tpoHeaderSnapshotSchema>;
