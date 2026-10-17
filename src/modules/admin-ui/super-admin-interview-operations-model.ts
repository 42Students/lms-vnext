export type SuperAdminCalendarRound={
 id:string;roundId:string|null;jobId:string|null;jobTitle:string|null;
 title:string;companyName:string;status:string;kind:string;
 startsAt:string;endsAt:string|null;venue:string|null;
 candidateMembershipId?:string|null;candidateName?:string|null;interviewer?:string|null;
 mode?:"Virtual"|"On campus"|"Not recorded";
};
export function calendarMode(row:SuperAdminCalendarRound):"On campus"|"Not recorded"{
 return row.venue?"On campus":"Not recorded";
}
export function potentialRoomConflicts(rows:readonly SuperAdminCalendarRound[]){
 const active=rows.filter(row=>row.venue&&row.status==="SCHEDULED"&&row.endsAt);
 const conflicted=new Set<string>();
 for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
  const a=active[i],b=active[j];
  if(a.id===b.id||a.venue!.trim().toLowerCase()!==b.venue!.trim().toLowerCase())continue;
  if(Date.parse(a.startsAt)<Date.parse(b.endsAt!)&&Date.parse(b.startsAt)<Date.parse(a.endsAt!)){
   conflicted.add(a.id);conflicted.add(b.id);
  }
 }
 return conflicted;
}
function csvCell(value:string){
 const safe=/^\s*[=+@-]/u.test(value)?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function superAdminInterviewCsv(rows:readonly SuperAdminCalendarRound[]){
 const headers=["Round","Company","Drive","Type","Status","Starts at (IST)","Venue","Possible conflict"];
 const overlap=potentialRoomConflicts(rows);
 const result=rows.map(row=>[row.title,row.companyName,row.jobTitle??"",
  row.kind,row.status,row.startsAt,row.venue??"",overlap.has(row.id)?"Possible venue overlap":""]);
 return [headers,...result].map(line=>line.map(csvCell).join(",")).join("\r\n")+"\r\n";
}

/** Confirmed slot conflicts across drives in the same authorized college. */
export function bookingConflicts(rows:readonly SuperAdminCalendarRound[]):Map<string,string[]>{
 const indexed=new Map<string,string[]>();
 const active=rows.filter(row=>row.status==="SCHEDULED"&&row.endsAt);
 const add=(id:string,reason:string)=>indexed.set(id,[...new Set([...(indexed.get(id)??[]),reason])]);
 for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
  const a=active[i],b=active[j];
  if(a.id===b.id||Date.parse(a.startsAt)>=Date.parse(b.endsAt!)||
   Date.parse(b.startsAt)>=Date.parse(a.endsAt!))continue;
  if(a.candidateMembershipId && a.candidateMembershipId===b.candidateMembershipId){
   add(a.id,"Candidate double-booked");add(b.id,"Candidate double-booked");
  }
  if(a.venue&&b.venue&&a.venue.trim().toLowerCase()===b.venue.trim().toLowerCase()){
   add(a.id,"Venue double-booked");add(b.id,"Venue double-booked");
  }
 }
 return indexed;
}
