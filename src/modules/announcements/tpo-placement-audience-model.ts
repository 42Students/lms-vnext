import {z} from "zod";
/** Frozen placement communication audience kinds; no recipient data. */
export const tpoPlacementAudienceSchema=z.discriminatedUnion("kind",[
 z.object({kind:z.literal("PLACEMENTS")}).strict(),
 z.object({kind:z.literal("BATCHES"),cohortIds:z.array(z.string().uuid()).min(1).max(50)}).strict(),
 z.object({kind:z.literal("BRANCHES"),departmentIds:z.array(z.string().uuid()).min(1).max(50)}).strict(),
 z.object({kind:z.literal("DRIVE"),jobId:z.string().uuid()}).strict(),
]);
export type TpoPlacementAudience=z.infer<typeof tpoPlacementAudienceSchema>;
