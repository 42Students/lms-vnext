/** Assignees and explicit mentions must not be dropped behind hundreds of
 * passive followers when the company-team notification fan-out is capped.
 * The caller still validates every membership against active college roles. */
export function prioritizedCompanyTeamRecipients(input:{
 actorMembershipId:string;
 assigneeId:string|null;
 mentions:readonly string[];
 team:readonly string[];
 followers:readonly string[];
},limit=250):string[]{
 if(!Number.isSafeInteger(limit)||limit<1||limit>250)
  throw new RangeError("Company Team recipients must be capped at 250");
 const unique=new Set<string>();
 for(const id of [
  ...(input.assigneeId?[input.assigneeId]:[]),
  ...input.mentions,...input.team,...input.followers,
 ]){
  if(!id||id===input.actorMembershipId)continue;
  unique.add(id);
  if(unique.size===limit)break;
 }
 return [...unique];
}
