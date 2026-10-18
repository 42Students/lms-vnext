type RosterName={membershipId:string;displayName:string|null;email:string|null;rollNumber:string|null;phoneE164:string|null};
export function facultyRosterDisplayName(learner:RosterName):string{
 return learner.displayName?.trim()||learner.email?.trim()||"Learner "+learner.membershipId.slice(0,8);
}
export function sortFacultyRosterByRollThenName<T extends RosterName>(learners:readonly T[]):T[]{
 return [...learners].sort((a,b)=>{
  const left=a.rollNumber?.trim(),right=b.rollNumber?.trim();
  if(Boolean(left)!==Boolean(right))return left?-1:1;
  return (left??"").localeCompare(right??"",undefined,{numeric:true,sensitivity:"base"})||
   facultyRosterDisplayName(a).localeCompare(facultyRosterDisplayName(b),undefined,{sensitivity:"base"})||
   a.membershipId.localeCompare(b.membershipId);
 });
}
export function facultyRosterMetrics<T extends RosterName>(learners:readonly T[]){
 const contacts=learners.filter(row=>Boolean(row.phoneE164?.trim()||row.email?.trim())).length;
 const missingRoll=learners.filter(row=>!row.rollNumber?.trim()).length;
 return {contacts,missingRoll,
  contactLabel:contacts+" contacts",
  rollLabel:missingRoll?missingRoll+" without a roll number":"All have roll numbers"};
}
/** Profile photos are not part of the current authorized faculty roster.
 * Never load arbitrary external avatar URLs or infer one from personal metadata. */
export function facultyRosterPhotoPreview(source:unknown):string|null{
 if(typeof source!=="string" || source.length>400)return null;
 // Only authorized, same-origin download endpoints may be surfaced.
 if(!/^\/api\/files\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\/download(?:\?[a-zA-Z0-9_=&%-]+)?$/i.test(source))return null;
 return source;
}
