export type LearnerPlacementHeroAction={
 label:string;title:string;detail:string;href:string;when:Date|null;
};
/** LEARNER-placements-05: only saved, authorized action signals may
 * override the generic drive recommendation. Never infer employer selection. */
export function learnerPlacementHeroPriority(input:{
 pendingOffers:number|null;
 registration:{stage:string;choice:string|null}|null;
 acceptedOffer:boolean|null;
 fallback:LearnerPlacementHeroAction|null;
}):LearnerPlacementHeroAction|null{
 if(input.pendingOffers!==null&&input.pendingOffers>0)return {
  label:"Offer waiting",title:"Respond to your placement offer",
  detail:"Review the issued offer terms and saved response deadline before deciding.",
  href:"/learn/my-placements/offers?status=pending",when:null,
 };
 if(input.registration?.stage==="OPEN"&&input.registration.choice!=="PLACEMENTS")return {
  label:"Registration needed",title:"Register for placements",
  detail:"Choose the placements track before taking part in your college's drives.",
  href:"/learn/my-placements#registration",when:null,
 };
 if(input.acceptedOffer===true)return {
  label:"Accepted offer",title:"Review your accepted offer",
  detail:"An official offer is accepted. Review joining details and any college rules for other drives.",
  href:"/learn/my-placements/offers",when:null,
 };
 return input.fallback;
}
