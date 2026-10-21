/** TPO-home-03: legacy dev-branch seven quiet rows, in their original order.
 * Counts are only displayed when a corresponding persisted source has been read. */
export type TpoHomeSummary={
 batch:{name:string;invited:boolean;eligible:number|null;registered:number|null;placed:number|null}|null;
 moreBatches:number;hasUninvitedBatch?:boolean;liveDrives:number;driveAttention:number;
 driveDetail?:string|null;driveHref?:string;
 driveNeeds?:readonly {code:string;count:number;title?:string}[];
 registered:number|null;placedUnique:number|null;
 recruiterLeads:number|null;followUps:number|null;recruiterAccess:number|null;
 pendingRequests:number|null;messages:number|null;
 teamAsks:number|null;teamMentions:number|null;teamUnread:number|null;
 upcoming:readonly {startsAt:Date;title:string}[];
 calendarAvailable?:boolean;
};
export type TpoHomeLegacyRow={
 key:"batches"|"drives"|"students"|"engage"|"inbox"|"team"|"week";
 title:string;status:string;href:string;needsAttention:boolean;
};
const plural=(n:number,one:string,many=one+"s")=>n+" "+(n===1?one:many);
/** TPO-home-02: count only attention rows, never null/unavailable metrics. */
export function tpoHomeNeedsLine(rows:readonly Pick<TpoHomeLegacyRow,"needsAttention">[]):string {
 const k=rows.filter(row=>row.needsAttention).length;
 if(!k)return "You're all caught up.";
 const words=["","One thing needs","Two things need","Three things need",
  "Four things need","Five things need","Six things need","Seven things need"];
 return (words[k]??String(k)+" things need")+" you today.";
}

export function buildTpoLegacyHomeRows(d:TpoHomeSummary,now:Date=new Date()):TpoHomeLegacyRow[]{
 const batch=d.batch;
 const batchStatus=batch?(batch.eligible!==null&&batch.registered!==null
  ? `${batch.name} · ${batch.registered} of ${batch.eligible} registered${batch.placed===null?"":`, ${batch.placed} placed`}${d.moreBatches?` · +${d.moreBatches} more`:""}`
  :batch.name):"No batch in placements yet";
 const urgent=["DRIVE_REQUESTS","RESULTS_AWAITING_APPLY","RESULTS_READY",
  "SELECTIONS_TO_VERIFY","DEADLINE_TODAY","SHARE_APPLICANTS","SCREENING_PENDING",
  "OFFERS_AWAITING_RESPONSE","JOINING_OUTCOME_PENDING","DRIVE_NOT_SCHEDULED"];
 const names:Record<string,string>={
  DRIVE_REQUESTS:"drive requests",RESULTS_AWAITING_APPLY:"results waiting",
  RESULTS_READY:"results ready",SELECTIONS_TO_VERIFY:"selections to verify",
  DEADLINE_TODAY:"deadline today",SHARE_APPLICANTS:"applicants to share",
  SCREENING_PENDING:"applications to review",OFFERS_AWAITING_RESPONSE:"offers waiting",
  JOINING_OUTCOME_PENDING:"joining outcomes waiting",DRIVE_NOT_SCHEDULED:"rounds to schedule",
 };
 const actionable=(d.driveNeeds??[]).filter(row=>row.count>0).sort((a,b)=>
  (urgent.includes(a.code)?urgent.indexOf(a.code):999)-
  (urgent.includes(b.code)?urgent.indexOf(b.code):999));
 const first=actionable[0];
 const detail=first?first.count+" "+(names[first.code]??first.title??"actions requiring attention"):d.driveDetail;
 const drives=(d.liveDrives?d.liveDrives+" live":"No live drives")+
  (detail?" · "+detail:"");
 const requests=d.pendingRequests,messages=d.messages;
 const inboxParts=[
  requests===null?"Requests unavailable":requests?plural(requests,"request"):null,
  messages===null?"Messages unavailable":messages?plural(messages,"message")+" to answer":null,
 ].filter(Boolean);
 const inboxStatus=inboxParts.length?inboxParts.join(" · "):"No requests or messages waiting";
 const next=d.upcoming[0];
 const showWhen=(date:Date)=>{
  const day=new Intl.DateTimeFormat("en-GB",{weekday:"short",timeZone:"Asia/Kolkata"}).format(date);
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
  const inDay=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
  const tomorrow=new Intl.DateTimeFormat("en-CA",{
   timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).format(new Date(now.getTime()+86400000));
  const time=new Intl.DateTimeFormat("en-IN",{hour:"numeric",minute:"2-digit",hour12:true,timeZone:"Asia/Kolkata"}).format(date);
  return (today===inDay?"Today":tomorrow===inDay?"Tomorrow":day)+" "+time;
 };
 return [
  {key:"batches",title:"Placement eligibility",status:batchStatus,href:"/tpo/batches",
   needsAttention:!batch||(d.hasUninvitedBatch??!batch.invited)},
  {key:"drives",title:"Drives",status:drives,href:d.driveHref??"/tpo/placements",
   needsAttention:d.driveAttention>0||actionable.length>0},
  {key:"students",title:"Students",status:d.registered===null?"":
   d.registered?d.registered+" registered · "+(d.placedUnique??0)+" placed":"Nobody registered yet",
   href:"/tpo/students",needsAttention:false},
  {key:"engage",title:"Engage",status:d.recruiterLeads===null?"":
   [plural(d.recruiterLeads,"recruiter"),d.followUps===null?null:
    d.followUps?plural(d.followUps,"follow-up")+" today":"no follow-ups today",
    (d.recruiterAccess??0)>0?plural(d.recruiterAccess!,"new account")+" to approve":null].filter(Boolean).join(" · "),
   href:d.followUps?"/tpo/recruiters?due=1":"/tpo/recruiters",
   needsAttention:(d.followUps??0)>0||(d.recruiterAccess??0)>0},
  {key:"inbox",title:"Inbox",status:inboxStatus,href:requests?"/tpo/requests":"/tpo/messages",
   needsAttention:(requests??0)+(messages??0)>0},
  {key:"team",title:"Team",status:(d.teamAsks??0)>0?plural(d.teamAsks!,"ask")+" for you":
   (d.teamMentions??0)>0?plural(d.teamMentions!,"mention"):
   (d.teamUnread??0)>0?plural(d.teamUnread!,"new message"):
   d.teamAsks===null?"":"Nothing waiting on you",
   href:(d.teamAsks??0)+(d.teamMentions??0)>0?"/tpo/team?filter=me":"/tpo/team",
   needsAttention:(d.teamAsks??0)+(d.teamMentions??0)>0},
  {key:"week",title:"This week",status:next?showWhen(next.startsAt)+" · "+next.title+
   (d.upcoming.length>1?` · +${d.upcoming.length-1} more`:""):d.calendarAvailable===false?"Calendar unavailable — open Calendar to retry":"Nothing on the calendar",
   href:"/tpo/calendar",needsAttention:false},
 ];
}
