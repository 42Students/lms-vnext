import { z } from "zod";
export const tpoInterviewWindowSchema=z.object({
 days:z.coerce.number().int().min(1).max(90).default(14),
}).strict();
export type InterviewRoundFact={
 id:string;jobId:string;jobTitle:string;companyName:string;name:string;
 kind:string;status:string;mode:string|null;venue:string|null;
 scheduledAt:string|null;durationMinutes:number|null;
 updatedAt?:string|null;meetingUrl?:string|null;
};
export function projectTpoInterviewReadiness(
 facts:readonly InterviewRoundFact[],nowIso:string,days:number,
) {
 const now=Date.parse(nowIso);
 if(!Number.isFinite(now)||!Number.isSafeInteger(days)||days<1||days>90)throw Error("Invalid interview window");
 const end=now+days*86_400_000;
 const rounds=facts.filter(x=>x.kind==="INTERVIEW"&&x.status!=="CANCELLED");
 const states=rounds.map((r)=>{
  const at=r.scheduledAt?Date.parse(r.scheduledAt):NaN;
  const known=Number.isFinite(at);
  const validDuration=r.durationMinutes!==null&&Number.isSafeInteger(r.durationMinutes)&&r.durationMinutes>0&&r.durationMinutes<=1440;
  const inWindow=known&&at>=now&&at<=end;
  const active=known&&validDuration&&at<=now&&now<at+r.durationMinutes!*60_000;
  const state=r.status==="PENDING"||!known?"UNSCHEDULED":
    !validDuration?"DURATION_UNKNOWN":active?"HAPPENING_NOW":
    at<now?"START_PASSED":inWindow?"UPCOMING":"OUT_OF_WINDOW";
  return {...r,state};
 });
 const counts={
  upcoming:states.filter(x=>x.state==="UPCOMING").length,
  happeningNow:states.filter(x=>x.state==="HAPPENING_NOW").length,
  pendingSchedule:states.filter(x=>x.state==="UNSCHEDULED").length,
  durationUnknown:states.filter(x=>x.state==="DURATION_UNKNOWN").length,
  startedEarlier:states.filter(x=>x.state==="START_PASSED").length,
 };
 const displayed=states.filter(x=>x.state!=="OUT_OF_WINDOW")
   .sort((a,b)=>(a.scheduledAt??"").localeCompare(b.scheduledAt??"")||a.id.localeCompare(b.id));
 return {counts,rows:displayed};
}
