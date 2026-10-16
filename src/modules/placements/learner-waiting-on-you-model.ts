export type LearnerPlacementTodo={
 key:string;label:string;detail:string;href:string;priority:"URGENT"|"SOON"|"NORMAL";
};
/** Only confirmed, persisted inputs. A scheduled round does not prove
 * attendance confirmation is needed, so it links to the schedule instead. */
export function learnerWaitingOnYou(input:{
 pendingOffers:number|null;
 urgentAssessment:{roundName:string;href:string;when:Date}|null;
 urgentInterview:{roundName:string;href:string;when:Date}|null;
 nextAction:{title:string;href:string;detail:string}|null;
}):LearnerPlacementTodo[]{
 const items:LearnerPlacementTodo[]=[];
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
