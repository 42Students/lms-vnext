import {z} from "zod";
export const internalThreadSchema=z.object({
 recipientMembershipId:z.string().uuid(),
 idempotencyKey:z.string().uuid().optional(),
 topic:z.string().trim().min(1).max(200),
}).strict();
export const internalMessageSchema=z.object({
 threadId:z.string().uuid(),body:z.string().trim().min(1).max(4000),
 idempotencyKey:z.string().uuid().optional(),
}).strict();
export function canReadInternalThread(input:{actorMembershipId:string;startedByMembershipId:string;invitedMembershipId:string}){
 return input.actorMembershipId===input.startedByMembershipId||input.actorMembershipId===input.invitedMembershipId;
}
