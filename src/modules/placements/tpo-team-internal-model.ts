import {z} from "zod";
export const internalThreadSchema=z.object({
 recipientMembershipId:z.string().uuid(),
 kind:z.enum(["DIRECT","TOPIC","DRIVE","COMPANY"]).default("DIRECT"),
 contextId:z.string().uuid().optional(),
 participantMembershipIds:z.array(z.string().uuid()).max(20).default([]),
 idempotencyKey:z.string().uuid().optional(),
 topic:z.string().trim().min(1).max(200),
 firstMessage:z.string().trim().min(1).max(4000).optional(),
}).strict().superRefine((input,ctx)=>{
 if(["DRIVE","COMPANY"].includes(input.kind) !== Boolean(input.contextId))
   ctx.addIssue({code:"custom",path:["contextId"],message:"Choose a valid drive or company"});
 if(input.kind==="DIRECT" && input.participantMembershipIds.length>0)
   ctx.addIssue({code:"custom",path:["participantMembershipIds"],message:"Direct messages have one recipient"});
 if(new Set(input.participantMembershipIds).size!==input.participantMembershipIds.length)
   ctx.addIssue({code:"custom",path:["participantMembershipIds"],message:"Choose each colleague only once"});
 if(input.participantMembershipIds.includes(input.recipientMembershipId))
   ctx.addIssue({code:"custom",path:["participantMembershipIds"],message:"Primary recipient is already selected"});
});
export const internalMessageSchema=z.object({
 threadId:z.string().uuid(),body:z.string().trim().min(1).max(4000),
 idempotencyKey:z.string().uuid().optional(),
 markDecision:z.boolean().optional(),
}).strict();
export function canReadInternalThread(input:{actorMembershipId:string;startedByMembershipId:string;invitedMembershipId:string}){
 return input.actorMembershipId===input.startedByMembershipId||input.actorMembershipId===input.invitedMembershipId;
}
