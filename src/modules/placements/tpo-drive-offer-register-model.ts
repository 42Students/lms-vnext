import {z} from "zod";
import {placementReportCsv} from "./report-model";
export const offerRegisterQuery=z.object({jobId:z.string().uuid(),status:z.enum(["ALL","ISSUED","ACCEPTED","DECLINED","WITHDRAWN"]).default("ALL"),page:z.coerce.number().int().min(1).max(10000).default(1),q:z.string().trim().max(100).default(""),joining:z.enum(["ALL","PENDING","JOINED","DEFERRED","DID_NOT_JOIN"]).default("ALL"),kind:z.enum(["ALL","OFFER","LOI"]).default("ALL")}).strict();
export type OfferRegisterFact={offer:{id:string;status:string;roleTitle:string;kind:string;annualCtcInr:number|null;issuedAt:Date;respondedAt:Date|null;expiresAt?:Date|null},joining:{status:string}|null,candidate:{membershipId:string;displayName:string|null;email?:string|null;rollNumber?:string|null;batch?:string|null;branch?:string|null}};
export const OFFER_REGISTER_PAGE_SIZE=25;
export function offerExpiryIndicator(status:string,expiresAt:Date|null|undefined,asOf:Date):"EXPIRED"|"DUE_SOON"|"OPEN"|"UNKNOWN"|"NOT_APPLICABLE"{
 if(status!=="ISSUED")return "NOT_APPLICABLE";
 if(!expiresAt)return "UNKNOWN";
 if(expiresAt.getTime()<=asOf.getTime())return "EXPIRED";
 return expiresAt.getTime()-asOf.getTime()<=7*86400000?"DUE_SOON":"OPEN";
}
export function selectOfferRegisterFacts(facts:readonly OfferRegisterFact[],status:z.infer<typeof offerRegisterQuery>["status"],search="",joiningState:z.infer<typeof offerRegisterQuery>["joining"]="ALL",kind:z.infer<typeof offerRegisterQuery>["kind"]="ALL"){
 const term=search.trim().toLocaleLowerCase("en-IN");
 return facts.filter(f=>(status==="ALL"||f.offer.status===status)&&(kind==="ALL"||f.offer.kind===kind)&&(!term||
  [f.candidate.displayName,f.candidate.rollNumber,f.candidate.batch,f.candidate.branch,f.offer.roleTitle].some(value=>value?.toLocaleLowerCase("en-IN").includes(term)))&&
  (joiningState==="ALL"||(f.offer.status==="ACCEPTED"&&(f.joining?.status??"PENDING")===joiningState))).sort((a,b)=>b.offer.issuedAt.getTime()-a.offer.issuedAt.getTime()||a.offer.id.localeCompare(b.offer.id));
}
export function projectOfferRegister(facts:readonly OfferRegisterFact[],status:z.infer<typeof offerRegisterQuery>["status"],requestedPage=1,search="",joiningState:"ALL"|"PENDING"|"JOINED"|"DEFERRED"|"DID_NOT_JOIN"="ALL",asOf=new Date(),kind:"ALL"|"OFFER"|"LOI"="ALL"){
 const counts={all:facts.length,issued:0,accepted:0,declined:0,withdrawn:0};
 for(const f of facts){
  if(f.offer.status==="ISSUED")counts.issued++;
  if(f.offer.status==="ACCEPTED")counts.accepted++;
  if(f.offer.status==="DECLINED")counts.declined++;
  if(f.offer.status==="WITHDRAWN")counts.withdrawn++;
 }
 const match=selectOfferRegisterFacts(facts,status,search,joiningState,kind);
 const totalPages=Math.max(1,Math.ceil(match.length/OFFER_REGISTER_PAGE_SIZE));
 const page=Math.max(1,Math.min(requestedPage,totalPages));
 const start=(page-1)*OFFER_REGISTER_PAGE_SIZE;
 return {counts,totalMatching:match.length,page,pageSize:OFFER_REGISTER_PAGE_SIZE,totalPages,rows:match.slice(start,start+OFFER_REGISTER_PAGE_SIZE).map(({offer,candidate,joining})=>({
  id:offer.id,name:candidate.displayName?.trim()||"Unnamed learner",membershipId:candidate.membershipId,email:candidate.email??null,rollNumber:candidate.rollNumber??null,batch:candidate.batch??null,branch:candidate.branch??null,role:offer.roleTitle,kind:offer.kind,annualCtcInr:offer.annualCtcInr,status:offer.status,
  issued:offer.issuedAt.toISOString(),responded:offer.respondedAt?.toISOString()??null,
  expires:offer.expiresAt?.toISOString()??null,respondByHours:offer.status==="ISSUED"&&offer.expiresAt?Math.max(0,Math.ceil((offer.expiresAt.getTime()-asOf.getTime())/3600000)):null,expiryIndicator:offerExpiryIndicator(offer.status,offer.expiresAt,asOf),
  joining:offer.status==="ACCEPTED"?(joining?.status??"PENDING"):null,
 }))};
}

export const TPO_DRIVE_OFFERS_CSV_LIMIT=500;
/** Same persisted fact selector as the TPO register; all untrusted cells formula-neutralized. */
export function tpoDriveOfferRegisterCsv(
 facts:readonly OfferRegisterFact[],
 filters:Pick<z.infer<typeof offerRegisterQuery>,"status"|"q"|"joining"|"kind">,
){
 const matches=selectOfferRegisterFacts(facts,filters.status,filters.q,filters.joining,filters.kind);
 const csvDate=(date:Date|null|undefined)=>date?
  new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(date)+" IST":"Not recorded";
 const rows:(string|number|null)[][]=matches.slice(0,TPO_DRIVE_OFFERS_CSV_LIMIT).map(f=>[
  f.offer.id,f.candidate.displayName?.trim()||"Unnamed learner",f.offer.roleTitle,
  f.offer.kind,f.offer.annualCtcInr,f.candidate.email??null,
  f.offer.status,f.offer.status==="ACCEPTED"?(f.joining?.status??"PENDING"):"Not applicable",
  csvDate(f.offer.issuedAt),csvDate(f.offer.respondedAt),csvDate(f.offer.expiresAt),
 ]);
 rows.push(["Methodology","Every row is a persisted offer version; no final selection or joining evidence inferred.","","","","","","","","",""]);
 const truncated=matches.length>TPO_DRIVE_OFFERS_CSV_LIMIT;
 if(truncated)rows.push(["TRUNCATED",
  "First "+TPO_DRIVE_OFFERS_CSV_LIMIT+" of "+matches.length+" matching offer versions exported.",null,null,null,null,null,null,null,null,null]);
 return {csv:placementReportCsv(["Offer ID","Student","Role","Kind","Annual CTC (INR)","Email","Offer status","Joining status","Issued (IST)","Responded (IST)","Expires (IST)"],rows),
  totalMatching:matches.length,truncated};
}
