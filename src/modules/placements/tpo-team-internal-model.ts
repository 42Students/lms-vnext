import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const internalThreadSchema=z.object({
 recipientMembershipId:zUuid,
 kind:z.enum(["DIRECT","TOPIC","DRIVE","COMPANY"]).default("DIRECT"),
 contextId:zUuid.optional(),
 participantMembershipIds:z.array(zUuid).max(20).default([]),
 idempotencyKey:zUuid.optional(),
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
 threadId:zUuid,body:z.string().trim().min(1).max(4000),
 idempotencyKey:zUuid.optional(),
 markDecision:z.boolean().optional(),
 mentionMembershipIds:z.array(zUuid).max(20).default([]),
 addMentionedMembers:z.boolean().default(false),
}).strict().superRefine((data,ctx)=>{
 if(new Set(data.mentionMembershipIds).size!==data.mentionMembershipIds.length)
  ctx.addIssue({code:"custom",path:["mentionMembershipIds"],message:"Choose each teammate once"});
 if(data.addMentionedMembers&&!data.mentionMembershipIds.length)
  ctx.addIssue({code:"custom",path:["addMentionedMembers"],message:"Choose a teammate before sending"});
});
export function canReadInternalThread(input:{actorMembershipId:string;startedByMembershipId:string;invitedMembershipId:string}){
 return input.actorMembershipId===input.startedByMembershipId||input.actorMembershipId===input.invitedMembershipId;
}
