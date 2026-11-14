import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
const common={membershipId:zUuid,expectedVersion:z.string().min(1)};
export const tpoBatchDecisionSchema=z.discriminatedUnion("decision",[
 z.object({...common,decision:z.literal("ELIGIBLE")}).strict(),
 z.object({...common,decision:z.literal("INELIGIBLE"),reason:z.string().trim().min(3).max(200)}).strict(),
 z.object({...common,decision:z.literal("NOT_DECIDED")}).strict()
]);
export function canUndoBatchDecision(before:string,after:string,current:string){return before!==after&&after===current;}
