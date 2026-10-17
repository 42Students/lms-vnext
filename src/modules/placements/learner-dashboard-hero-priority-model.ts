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
  label:"You have an offer",title:"Reply to your placement offer",
  detail:"Review the issued offer terms and saved response deadline before deciding.",
  href:"/learn/my-placements/offers?status=pending",when:null,
 };
 if(input.registration?.stage==="OPEN"&&input.registration.choice==="HIGHER_STUDIES")return {
  label:"You chose higher studies",title:"Your next steps",
  detail:"Your saved choice is higher studies. Ask the placement cell if you need to change it.",
  href:"/learn/my-placements/placement",when:null,
 };
 if(input.registration?.stage==="OPEN"&&input.registration.choice==="NOT_INTERESTED")return {
  label:"You are not taking part in placements",title:"Your registration choice",
  detail:"Your saved choice is not to participate. Contact the placement cell if you need to change it.",
  href:"/learn/my-placements/placement",when:null,
 };
 if(input.registration?.stage==="OPEN"&&(input.registration.choice===null||input.registration.choice===""))return {
  label:"First step",title:"Register for placements",
  detail:"Choose the placements track before taking part in your college's drives.",
  href:"/learn/my-placements#registration",when:null,
 };
 if(input.acceptedOffer===true)return {
  label:"Congratulations",title:"Review your accepted offer",
  detail:"An official offer is accepted. Review joining details and any college rules for other drives.",
  href:"/learn/my-placements/offers",when:null,
 };
 if(input.fallback)return input.fallback;
 if(input.pendingOffers===null||input.registration===null||input.acceptedOffer===null)return null;
 return {label:"All caught up",title:"Nothing needs you right now",
 detail:"Your placement updates and next actions will appear here when recorded.",
 href:"/learn/profile",when:null};
}
