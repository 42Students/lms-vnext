export type TpoRoundFactInput={
 id:string;name:string;status:string;sequence:number;mode:string|null;
 scheduledAt:string|null;resultsDueAt:string|null;venue:string|null;meetingUrl:string|null;
 platform:string|null;testUrl:string|null;durationMinutes:number|null;whatToBring:string|null;
 participants:readonly {result:{status:string}|null}[];
};
function istDate(iso:string|null):string{
 if(!iso)return "Date to be decided";
 const date=new Date(iso);
 if(!Number.isFinite(date.getTime()))return "Date to be decided";
 return new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(date)+" IST";
}
export function projectTpoRoundFacts(round:TpoRoundFactInput){
 const staged=round.participants.filter(p=>p.result?.status==="STAGED").length;
 const applied=round.participants.filter(p=>p.result?.status==="APPLIED").length;
 const labels=({
  PENDING:"Not run yet",SCHEDULED:"Scheduled",RUNNING:"Running",
  IN_PROGRESS:"Running",COMPLETED:"Done",CANCELLED:"Cancelled",
 } as Record<string,string>);
 const status=Object.prototype.hasOwnProperty.call(labels,round.status)?labels[round.status]:"Not run yet";
 return {
  status,
  when:istDate(round.scheduledAt),
  due:round.resultsDueAt?istDate(round.resultsDueAt):"Not set",
  mode:round.mode==="ON_CAMPUS"?"On campus":round.mode==="VIRTUAL"?"Virtual":"To be decided",
  place:round.mode==="ON_CAMPUS"?(round.venue?.trim()||"Venue to be told"):
   round.mode==="VIRTUAL"?(round.meetingUrl?.trim()||"Meeting link to be told"):"To be decided",
  students:round.participants.length,
  results:staged>0?staged+" waiting to apply":
   applied>0?applied+" applied":"None yet",
  platform:round.platform?.trim()||null,
  testUrl:round.testUrl?.trim()||null,
  duration:round.durationMinutes,
  bring:round.whatToBring?.trim()||null,
 };
}
