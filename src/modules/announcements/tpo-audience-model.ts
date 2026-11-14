import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const tpoAudienceSchema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("ALL_ACTIVE")}).strict(),
 z.object({kind:z.literal("BATCHES"),batchIds:z.array(zUuid).min(1).max(100)}).strict(),
 z.object({kind:z.literal("INDIVIDUALS"),membershipIds:z.array(zUuid).min(1).max(500)}).strict()
]);
export type TpoAnnouncementAudience=z.infer<typeof tpoAudienceSchema>;
