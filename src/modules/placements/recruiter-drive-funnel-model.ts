/** Recruiter-visible funnel: the application denominator is the college-shared
 * subset only. Unshared applicants and suppressed outcomes are never inferred.
 * An absent stage is different from zero progress through an existing stage. */
export type RecruiterVisibleFunnelInput={
 shared:number;
 shortlisted:number;
 rounds:readonly {kind:string;participants:readonly {
  applicationId:string;result:{status:string;outcome:string}|null;
 }[]}[];
 issued:number;accepted:number;joined:number;
};
export function recruiterVisibleDriveFunnel(input:RecruiterVisibleFunnelInput){
 const outcomeIds=(kind:string)=>new Set(input.rounds
  .filter(r=>r.kind===kind)
  .flatMap(r=>r.participants)
  .filter(p=>p.result?.status==="APPLIED")
  .map(p=>p.applicationId));
 const assessments=input.rounds.some(r=>r.kind==="ASSESSMENT"||r.kind==="TEST");
 const interviews=input.rounds.some(r=>r.kind==="INTERVIEW");
 const counts=[
  {label:"Shared applicants",count:Math.max(0,input.shared)},
  {label:"Shortlisted",count:Math.max(0,input.shortlisted)},
  {label:"Assessment",count:assessments?
    new Set([...outcomeIds("ASSESSMENT"),...outcomeIds("TEST")]).size:null},
  {label:"Interview",count:interviews?outcomeIds("INTERVIEW").size:null},
  {label:"Offered",count:Math.max(0,input.issued+input.accepted+input.joined)},
  {label:"Hired",count:Math.max(0,input.joined)},
 ];
 let previous=input.shared;
 return counts.map((row,index)=>{
  const denominator=index===0?input.shared:previous;
  const percent=row.count===null||denominator<=0?null:
   Math.min(100,Math.round(100*row.count/denominator));
  if(row.count!==null)previous=row.count;
  return {...row,ofPrevious:percent};
 });
}
