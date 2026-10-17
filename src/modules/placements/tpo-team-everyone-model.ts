import {z} from "zod";

/** TPO-inbox-team-15: Everyone is a permanent college channel, not a private invite. */
export const TPO_EVERYONE_TITLE="Everyone";
export const TPO_EVERYONE_DESCRIPTION="Everyone in the placement team, including people who join later. You can mute it, not leave it.";
export const TPO_EVERYONE_WELCOME="Welcome to Everyone. Use this conversation to keep the placement team in sync.";
export const everyoneMessageSchema=z.strictObject({
 body:z.string().trim().min(1).max(4000),
});
export const everyoneMuteSchema=z.strictObject({muted:z.boolean()});
export type EveryoneMember={membershipId:string;userId:string;muted:boolean};
export function everyoneNotificationRecipients(members:readonly EveryoneMember[],authorMembershipId:string){
 const sent=new Set<string>();
 return members.filter(row=>{
  if(row.membershipId===authorMembershipId||row.muted||sent.has(row.userId))return false;
  sent.add(row.userId);
  return true;
 });
}
export function everyoneConversationIsVisible(input:{active:boolean;isTpo:boolean;canManage:boolean}){
 return input.active&&input.isTpo&&input.canManage;
}
