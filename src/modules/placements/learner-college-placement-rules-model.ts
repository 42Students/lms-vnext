export type LearnerCollegeRule={
 countsAsPlacedAt:string;maxHeldOffers:number;upliftPct:number;minResponseHours:number;
};
export type LearnerHeldOfferFact={kind:string;status:string;annualCtcInr:number|null};
/** LEARNER-placements-53: present the college's persisted policy, never
 * a guessed default or company-private offer details. */
export function learnerCollegePlacementRulePoints(rules:LearnerCollegeRule,held:readonly LearnerHeldOfferFact[]){
 const when=rules.countsAsPlacedAt==="SELECTED"?"you are selected":
  rules.countsAsPlacedAt==="OFFER_ACCEPTED"?"you accept an offer":"an offer is released";
 const points=[
  "When counted placed: "+when+".",
  "Offers you can hold: up to "+rules.maxHeldOffers+" active "+
    (rules.maxHeldOffers===1?"offer":"offers")+".",
  "Applying after placed: Dream drives remain exempt; otherwise your college requires "+
    rules.upliftPct+"% more CTC once you reach the held-offer limit.",
  "Time to answer: your college's minimum offer-response window is "+rules.minResponseHours+
    " hours. Check each offer's recorded deadline.",
  "Internships: confirm with the placement cell whether this specific role counts as placed.",
  "Showing up: check your booked rounds and tell the placement cell if you cannot attend.",
 ];
 const active=held.filter(row=>row.kind==="OFFER"&&
   (row.status==="ISSUED"||row.status==="ACCEPTED"));
 const recorded=active.map(row=>row.annualCtcInr).filter((v):v is number=>v!==null&&
   Number.isFinite(v)&&v>=0);
 const max=recorded.length?Math.max(...recorded):null;
 const money=(inr:number)=>"₹"+(inr/100000).toLocaleString("en-IN",{maximumFractionDigits:2})+" LPA";
 const minNext=max===null?null:Math.ceil(max*(100+rules.upliftPct)/100);
 const personal=active.length===0?"You have no active offers recorded under this college's placement rules.":
  max===null?"You hold an offer, but a verified CTC is not recorded. Review your college rules before applying.":
  active.length>=rules.maxHeldOffers?
    "You're holding an offer of "+money(max)+
    ". You can still apply to drives paying "+money(minNext!)+" and above, or any drive tagged Dream.":
    "You're holding an offer of "+money(max)+". You may still have capacity for another offer under your college's limit.";
 return {points,personal,activeOffers:active.length};
}
