import {z} from "zod";

export const tpoTeamConversationFilterSchema=z.enum(["ALL","FOLLOWING","UNREAD","TOPICS","DECISIONS","ASKS","AT_ME"]);
export type TpoTeamConversationFilter=z.infer<typeof tpoTeamConversationFilterSchema>;
export type TpoTeamConversationCard={
 id:string;following:boolean;muted:boolean;unreadCount:number;kind:"PRIVATE"|"DIRECT"|"TOPIC"|"DRIVE"|"COMPANY";hasDecisions?:boolean;openAsks?:number;asksForMe?:number;
};
/** TPO-inbox-team-18/20: preserve precise per-member following/unread semantics.
 * Other legacy chips (mentions, asks, decisions and object threads) are
 * introduced only when their first-class persistence is available.
 */
export function filterTpoTeamConversations<T extends TpoTeamConversationCard>(
 rows:readonly T[],filter:TpoTeamConversationFilter,
):T[]{
 return rows.filter(row=>{
  if(filter==="FOLLOWING")return row.following;
  if(filter==="UNREAD")return row.following&&!row.muted&&row.unreadCount>0;
  if(filter==="TOPICS")return row.kind==="TOPIC";
  if(filter==="DECISIONS")return row.hasDecisions===true;
  if(filter==="ASKS")return (row.openAsks??0)>0;
  if(filter==="AT_ME")return (row.asksForMe??0)>0;
  return true;
 });
}
export function tpoTeamConversationCounts(rows:readonly TpoTeamConversationCard[]){
 return {
  ALL:rows.length,
  FOLLOWING:filterTpoTeamConversations(rows,"FOLLOWING").length,
  UNREAD:filterTpoTeamConversations(rows,"UNREAD").length,
  TOPICS:filterTpoTeamConversations(rows,"TOPICS").length,
  DECISIONS:filterTpoTeamConversations(rows,"DECISIONS").length,
  ASKS:filterTpoTeamConversations(rows,"ASKS").length,
  AT_ME:filterTpoTeamConversations(rows,"AT_ME").length,
 };
}
