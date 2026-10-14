import {z} from "zod";
export const offerRegisterQuery=z.object({jobId:z.string().uuid(),status:z.enum(["ALL","ISSUED","ACCEPTED","DECLINED","WITHDRAWN"]).default("ALL")}).strict();
export type OfferRegisterFact={offer:{id:string;status:string;roleTitle:string;issuedAt:Date;respondedAt:Date|null},joining:{status:string}|null,candidate:{membershipId:string;displayName:string|null}};
export function projectOfferRegister(facts:readonly OfferRegisterFact[],status:z.infer<typeof offerRegisterQuery>["status"]){
 const counts={all:facts.length,issued:0,accepted:0,declined:0,withdrawn:0};
 for(const f of facts){
  if(f.offer.status==="ISSUED")counts.issued++;
  if(f.offer.status==="ACCEPTED")counts.accepted++;
  if(f.offer.status==="DECLINED")counts.declined++;
  if(f.offer.status==="WITHDRAWN")counts.withdrawn++;
 }
 const match=facts.filter(f=>status==="ALL"||f.offer.status===status).sort((a,b)=>b.offer.issuedAt.getTime()-a.offer.issuedAt.getTime()||a.offer.id.localeCompare(b.offer.id));
 return {counts,totalMatching:match.length,truncated:match.length>200,rows:match.slice(0,200).map(({offer,candidate,joining})=>({
  id:offer.id,name:candidate.displayName?.trim()||"Unnamed learner",membershipId:candidate.membershipId,role:offer.roleTitle,status:offer.status,
  issued:offer.issuedAt.toISOString(),responded:offer.respondedAt?.toISOString()??null,
  joining:offer.status==="ACCEPTED"?(joining?.status??"PENDING"):null,
 }))};
}
