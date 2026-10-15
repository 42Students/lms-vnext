import {z} from "zod";
export const internalThreadSchema=z.object({
 recipientMembershipId:z.string().uuid(),
 topic:z.string().trim().min(1).max(160),
}).strict();
export const internalMessageSchema=z.object({
 threadId:z.string().uuid(),body:z.string().trim().min(1).max(4000),
}).strict();
export function canReadInternalThread(input:{actorMembershipId:string;startedByMembershipId:string;invitedMembershipId:string}){
 return input.actorMembershipId===input.startedByMembershipId||input.actorMembershipId===input.invitedMembershipId;
}
