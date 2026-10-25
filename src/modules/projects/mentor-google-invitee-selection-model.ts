export type InviteeRecord={membershipId:string;email:string|null;displayName:string|null};
export function scopedMentorInviteeEmails(
 roster:readonly InviteeRecord[],ids?:readonly string[],
):string[]{
 const chosen=ids===undefined?roster:(()=>{
  if(ids.length===0||ids.length>100||new Set(ids).size!==ids.length)
   throw new Error("INVALID_GOOGLE_INVITEE_SELECTION");
  const selected=new Set(ids);
  const eligible=roster.filter(item=>selected.has(item.membershipId));
  if(eligible.length!==selected.size)
   throw new Error("INVALID_GOOGLE_INVITEE_SELECTION");
  return eligible;
 })();
 return [...new Set(chosen.flatMap(item=>
  item.email?.trim()?[item.email.trim().toLowerCase()]:[]))];
}
