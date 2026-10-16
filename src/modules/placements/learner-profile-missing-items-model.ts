/** LEARNER-profile-misc-15: show actionable gaps from the same server
 * evidence policy that controls Send, not a contradictory client checklist. */
export function learnerProfileMissingItems(input:{
 education:{missing:readonly string[]};identity:{missing:readonly string[]};
}){
 return (["Education","Identity"] as const).flatMap(section=>{
  const row=section==="Education"?input.education:input.identity;
  return row.missing.map(message=>({section,message}));
 });
}
