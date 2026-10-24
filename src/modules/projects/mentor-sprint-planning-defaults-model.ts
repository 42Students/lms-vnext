/** Mentor sprint planning follows release-local sequence. Suggestions are
 * UI defaults only; the project-scoped server transaction remains authoritative
 * and allocates the sequence while holding the project lock.
 */
export type MentorSprintPlanningRow={
 releaseId:string;sequence:number;startDate?:string|null;endDate?:string|null;
};
export function mentorSprintPlanningDefaults(
 releaseId:string,rows:readonly MentorSprintPlanningRow[],
 asOfDate?:string,
):{title:string;sequence:number;startDate:string;endDate:string}{
 const local=rows.filter(row=>row.releaseId===releaseId&&
   Number.isSafeInteger(row.sequence)&&row.sequence>=0);
 const sequence=local.reduce((max,row)=>Math.max(max,row.sequence),-1)+1;
 const last=[...local].sort((a,b)=>b.sequence-a.sequence)[0];
 const stamp=last?.endDate??null;
 if(!stamp||!/^\d{4}-\d{2}-\d{2}$/.test(stamp))
  return {title:"Sprint "+(sequence+1),sequence,startDate:"",endDate:""};
 const utc=new Date(stamp+"T00:00:00.000Z");
 if(!Number.isFinite(utc.getTime())||utc.toISOString().slice(0,10)!==stamp)
  return {title:"Sprint "+(sequence+1),sequence,startDate:"",endDate:""};
 // Suggested 7-day planning window starts after the previous recorded end.
 const start=new Date(utc.getTime()+86400000);
 const end=new Date(utc.getTime()+7*86400000);
 // Imported historical plans may end years ago. Do not propose a past
 // calendar window for a new sprint opened today.
 if(asOfDate&&/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)&&
   start.toISOString().slice(0,10)<asOfDate)
   return {title:"Sprint "+(sequence+1),sequence,startDate:"",endDate:""};
 return {title:"Sprint "+(sequence+1),sequence,
  startDate:start.toISOString().slice(0,10),
  endDate:end.toISOString().slice(0,10)};
}
