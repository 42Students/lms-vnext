import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
/** Frozen placement communication audience kinds; no recipient data. */
export const tpoPlacementAudienceSchema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("PLACEMENTS")}).strict(),
 z.object({kind:z.literal("BATCHES"),cohortIds:z.array(zUuid).min(1).max(50)}).strict(),
 z.object({kind:z.literal("BRANCHES"),departmentIds:z.array(zUuid).min(1).max(50)}).strict(),
 z.object({kind:z.literal("DRIVE"),jobId:zUuid}).strict(),
]);
export type TpoPlacementAudience=z.infer<typeof tpoPlacementAudienceSchema>;
