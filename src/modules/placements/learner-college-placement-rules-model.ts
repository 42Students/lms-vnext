export type LearnerCollegeRule={
 countsAsPlacedAt:string;maxHeldOffers:number;upliftPct:number;minResponseHours:number;
};
export type LearnerHeldOfferFact={kind:string;status:string;annualCtcInr:number|null};
/** LEARNER-placements-53: present the college's persisted policy, never
 * a guessed default or company-private offer details. */
export function learnerCollegePlacementRulePoints(rules:LearnerCollegeRule,held:readonly LearnerHeldOfferFact[]){
 const onAccept=rules.countsAsPlacedAt==="OFFER_ACCEPTED";
 const heldLimit=rules.maxHeldOffers;
 const uplift=rules.upliftPct;
 const hours=rules.minResponseHours;
 const points=[
  "When you count as placed: "+(onAccept
   ?"When you accept an offer. An offer you have not accepted yet does not count."
   :"As soon as a company releases an offer to you, even before you accept it."),
  "Offers you can hold: "+(heldLimit===1?"One offer at a time.":"Up to "+heldLimit+" offers at a time.")+
   " Before you accept, you see exactly which of your other offers and applications it would end.",
  "Applying after you are placed: "+(uplift>0
   ?"You can still apply to drives that pay at least "+uplift+"% more than your offer, and to any drive marked Dream."
   :"You can still apply to drives that pay more than your offer, and to any drive marked Dream."),
  "Time to answer an offer: You get at least "+hours+
   " hours to accept or decline. An offer you do not answer in time expires.",
  "Internships: Internship offers do not count as placed, so you can keep applying to full-time drives.",
  "Showing up: Attend every round you are booked for. If you cannot make it, ask to reschedule before the day. The placement cell can bar students who miss rounds from later drives.",
 ];
 const summary="A student counts as placed when the offer is "+
  (onAccept?"accepted":"released")+". They can hold up to "+heldLimit+" "+
  (heldLimit===1?"offer":"offers")+". Once placed, they can apply again only for a CTC at least "+
  uplift+"% higher, or a Dream drive. Offers give "+hours+" hours to respond.";
 const active=held.filter(row=>row.kind==="OFFER"&&
   (row.status==="ISSUED"||row.status==="ACCEPTED"));
 const recorded=active.map(row=>row.annualCtcInr).filter((v):v is number=>v!==null&&
   Number.isFinite(v)&&v>=0);
 const max=recorded.length?Math.max(...recorded):null;
 const money=(inr:number)=>"₹"+(inr/100000).toLocaleString("en-IN",{maximumFractionDigits:2})+" LPA";
 // The legacy learner sentence rounds UP to 0.01 LPA, never down:
 // 0.01 lakh equals 1000 INR.
 const minNext=max===null?null:Math.ceil(max*(100+rules.upliftPct)/100/1000)*1000;
 const personal=active.length===0?"No active counted offers are currently recorded under this college's placement rules.":
  max===null?"You hold an offer, but a verified CTC is not recorded. Review your college rules before applying.":
  "You hold an offer of "+money(max)+". "+
    ((onAccept&&!active.some(row=>row.status==="ACCEPTED"))
      ?"Once you accept it, you can apply only to "
      :"From now on you can apply only to ")+
    "drives paying "+money(minNext!)+" or more, or any drive tagged Dream.";
 return {points,summary,personal,activeOffers:active.length};
}
