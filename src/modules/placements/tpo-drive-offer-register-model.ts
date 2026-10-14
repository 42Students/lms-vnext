import {z} from "zod";
export const offerRegisterQuery=z.object({jobId:z.string().uuid(),status:z.enum(["ALL","ISSUED","ACCEPTED","DECLINED","WITHDRAWN"]).default("ALL"),page:z.coerce.number().int().min(1).max(10000).default(1),q:z.string().trim().max(100).default(""),joining:z.enum(["ALL","PENDING","JOINED","DEFERRED","DID_NOT_JOIN"]).default("ALL")}).strict();
export type OfferRegisterFact={offer:{id:string;status:string;roleTitle:string;issuedAt:Date;respondedAt:Date|null;expiresAt?:Date|null},joining:{status:string}|null,candidate:{membershipId:string;displayName:string|null}};
export const OFFER_REGISTER_PAGE_SIZE=25;
export function offerExpiryIndicator(status:string,expiresAt:Date|null|undefined,asOf:Date):"EXPIRED"|"DUE_SOON"|"OPEN"|"UNKNOWN"|"NOT_APPLICABLE"{
 if(status!=="ISSUED")return "NOT_APPLICABLE";
 if(!expiresAt)return "UNKNOWN";
 if(expiresAt.getTime()<=asOf.getTime())return "EXPIRED";
 return expiresAt.getTime()-asOf.getTime()<=7*86400000?"DUE_SOON":"OPEN";
}
export function projectOfferRegister(facts:readonly OfferRegisterFact[],status:z.infer<typeof offerRegisterQuery>["status"],requestedPage=1,search="",joiningState:"ALL"|"PENDING"|"JOINED"|"DEFERRED"|"DID_NOT_JOIN"="ALL",asOf=new Date()){
 const counts={all:facts.length,issued:0,accepted:0,declined:0,withdrawn:0};
 for(const f of facts){
  if(f.offer.status==="ISSUED")counts.issued++;
  if(f.offer.status==="ACCEPTED")counts.accepted++;
  if(f.offer.status==="DECLINED")counts.declined++;
  if(f.offer.status==="WITHDRAWN")counts.withdrawn++;
 }
 const term=search.trim().toLocaleLowerCase("en-IN");
 const match=facts.filter(f=>(status==="ALL"||f.offer.status===status)&&(!term||
  [f.candidate.displayName,f.offer.roleTitle].some(value=>value?.toLocaleLowerCase("en-IN").includes(term)))&&
  (joiningState==="ALL"||(f.offer.status==="ACCEPTED"&&(f.joining?.status??"PENDING")===joiningState))).sort((a,b)=>b.offer.issuedAt.getTime()-a.offer.issuedAt.getTime()||a.offer.id.localeCompare(b.offer.id));
 const totalPages=Math.max(1,Math.ceil(match.length/OFFER_REGISTER_PAGE_SIZE));
 const page=Math.max(1,Math.min(requestedPage,totalPages));
 const start=(page-1)*OFFER_REGISTER_PAGE_SIZE;
 return {counts,totalMatching:match.length,page,pageSize:OFFER_REGISTER_PAGE_SIZE,totalPages,rows:match.slice(start,start+OFFER_REGISTER_PAGE_SIZE).map(({offer,candidate,joining})=>({
  id:offer.id,name:candidate.displayName?.trim()||"Unnamed learner",membershipId:candidate.membershipId,role:offer.roleTitle,status:offer.status,
  issued:offer.issuedAt.toISOString(),responded:offer.respondedAt?.toISOString()??null,
  expires:offer.expiresAt?.toISOString()??null,expiryIndicator:offerExpiryIndicator(offer.status,offer.expiresAt,asOf),
  joining:offer.status==="ACCEPTED"?(joining?.status??"PENDING"):null,
 }))};
}
