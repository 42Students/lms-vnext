import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const tpoHeaderSnapshotSchema=z.object({
 messages:z.number().int().nonnegative(),
 unread:z.number().int().nonnegative(),
 items:z.array(z.object({
  id:zUuid,title:z.string(),body:z.string().nullable(),
  actionHref:z.string().nullable(),readAt:z.string().nullable(),
  createdAt:z.iso.datetime({offset:true}),
 })).max(20),
});
export type TpoHeaderSnapshot=z.infer<typeof tpoHeaderSnapshotSchema>;
