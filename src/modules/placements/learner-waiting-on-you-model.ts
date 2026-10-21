export type LearnerBookedConfirmation={
 roundId:string;roundName:string;roundKind:string;href:string;
 booked:boolean;confirmed:boolean;pendingMoveRequest:boolean;
 startsAt:Date|null;
};
export type LearnerPlacementTodo={
 key:string;label:string;detail:string;href:string;priority:"URGENT"|"SOON"|"NORMAL";
};
/** Only confirmed, persisted inputs. A scheduled round does not prove
 * attendance confirmation is needed, so it links to the schedule instead. */
export function learnerWaitingOnYou(input:{
 pendingOffers:number|null;
 /** Persisted per-candidate slot facts; omitted data never implies a booking. */
 bookedConfirmations?:readonly LearnerBookedConfirmation[];
 now?:Date;
 urgentAssessment:{roundName:string;href:string;when:Date}|null;
 urgentInterview:{roundName:string;href:string;when:Date}|null;
 nextAction:{title:string;href:string;detail:string}|null;
 registration?:{stage:string;choice:string|null}|null;
 eligibleToApply?:number|null;
 applications?:number|null;
 profileFixes?:readonly {label:string;href:string}[];
}):LearnerPlacementTodo[]{
 const items:LearnerPlacementTodo[]=[];
 const nowMs=(input.now??new Date()).getTime();
 const bookedConfirmations=(input.bookedConfirmations??[]).filter(row=>
  row.booked&&!row.confirmed&&!row.pendingMoveRequest&&
  row.roundKind!=="TALK"&&
  row.startsAt!==null&&Number.isFinite(row.startsAt.getTime())&&
  row.startsAt.getTime()>=nowMs&&
  row.href.startsWith("/learn/my-placements/"));
 const seenRoundIds=new Set<string>();
 for(const booking of [...bookedConfirmations].sort((a,b)=>
   a.startsAt!.getTime()-b.startsAt!.getTime()||a.roundId.localeCompare(b.roundId))){
  if(seenRoundIds.has(booking.roundId))continue;
  seenRoundIds.add(booking.roundId);
  items.push({key:"confirm:"+booking.roundId,
   label:"Confirm "+booking.roundName,
   detail:"Your interview or assessment slot is booked but not yet confirmed.",
   href:booking.href,priority:"URGENT"});
 }
 for(const fix of input.profileFixes??[]){
  if(!fix.href.startsWith("/learn/profile"))continue;
  items.push({key:"profile:"+fix.href,label:fix.label,
   detail:"A reviewer returned this profile section. Correct the evidence before relying on it for placements.",
   href:fix.href,priority:"URGENT"});
 }
 if(input.registration?.stage==="OPEN" && input.registration.choice!=="PLACEMENTS")items.push({
  key:"register",label:input.registration.choice===null?"Register for placements":"Review your placement registration",
  detail:"Registration is open for your batch. Choose Placements to take part in campus drives.",
  href:"/learn/my-placements#registration",priority:"URGENT",
 });
 if((input.eligibleToApply??0)>0 && input.registration?.choice==="PLACEMENTS")items.push({
  key:"apply",label:"Apply to "+input.eligibleToApply+" eligible drive"+(input.eligibleToApply===1?"":"s"),
  detail:"Browse eligible open opportunities and check each application deadline.",
  href:"/learn/my-placements/jobs",priority:"SOON",
 });
 if(input.pendingOffers!==null&&input.pendingOffers>0)items.push({
  key:"offers",label:"Reply to "+input.pendingOffers+" offer"+(input.pendingOffers===1?"":"s"),
  detail:"Review the offer terms and response deadline.",href:"/learn/my-placements/offers?status=pending",
  priority:"URGENT",
 });
 if(input.urgentAssessment)items.push({
  key:"assessment",label:"Upcoming assessment · "+input.urgentAssessment.roundName,
  detail:"Open the scheduled assessment details before attending.",href:input.urgentAssessment.href,
  priority:"SOON",
 });
 if(input.urgentInterview)items.push({
  key:"interview",label:"Upcoming interview · "+input.urgentInterview.roundName,
  detail:"Review the interview time and joining instructions.",href:input.urgentInterview.href,
  priority:"SOON",
 });
 if(input.nextAction&&!items.some(item=>item.href===input.nextAction!.href))items.push({
  key:"next",label:input.nextAction.title,detail:input.nextAction.detail,
  href:input.nextAction.href,priority:"NORMAL",
 });
 return items.slice(0,5);
}
