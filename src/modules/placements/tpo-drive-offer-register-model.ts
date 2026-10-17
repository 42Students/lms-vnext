import {z} from "zod";
import {placementReportCsv} from "./report-model";
export const offerRegisterQuery=z.object({jobId:z.string().uuid(),status:z.enum(["ALL","ISSUED","ACCEPTED","DECLINED","WITHDRAWN"]).default("ALL"),page:z.coerce.number().int().min(1).max(10000).default(1),q:z.string().trim().max(100).default(""),joining:z.enum(["ALL","PENDING","JOINED","DEFERRED","DID_NOT_JOIN"]).default("ALL"),kind:z.enum(["ALL","OFFER","LOI"]).default("ALL"),expiry:z.enum(["ALL","EXPIRED","DUE_SOON","OPEN","UNKNOWN"]).default("ALL"),
 minCtcLpa:z.coerce.number().min(0).max(1000).optional(),
 maxCtcLpa:z.coerce.number().min(0).max(1000).optional(),
}).strict().superRefine((input,ctx)=>{
 if(input.minCtcLpa!==undefined&&input.maxCtcLpa!==undefined&&input.maxCtcLpa<input.minCtcLpa)
  ctx.addIssue({code:"custom",path:["maxCtcLpa"],message:"Maximum package must be at least the minimum package"});
});
export type OfferRegisterFact={offer:{id:string;status:string;roleTitle:string;kind:string;annualCtcInr:number|null;fixedLpa?:string|null;variableLpa?:string|null;joiningBonusLpa?:string|null;bondMonths?:number|null;bondAmount?:string|null;acceptanceChannel?:string|null;acceptedDisputableUntil?:Date|null;issuedAt:Date;respondedAt:Date|null;expiresAt?:Date|null},joining:{status:string}|null,candidate:{membershipId:string;displayName:string|null;email?:string|null;phone?:string|null;rollNumber?:string|null;batch?:string|null;branch?:string|null}};
/** Offer-level states only; campus held-offer policy is intentionally not inferred here. */
export function offerRulesCheck(status:string,kind:string){
 if(kind==="LOI")return "Letter of intent · placement count not established";
 if(status==="ACCEPTED")return "Accepted · review college holding and placement rules";
 if(status==="ISSUED")return "Awaiting learner response · eligibility was checked when issued";
 if(status==="DECLINED")return "Declined · not held";
 if(status==="WITHDRAWN")return "Withdrawn · not held";
 return "Not verified against the current rules";
}
export const OFFER_REGISTER_PAGE_SIZE=25;
export function offerExpiryIndicator(status:string,expiresAt:Date|null|undefined,asOf:Date):"EXPIRED"|"DUE_SOON"|"OPEN"|"UNKNOWN"|"NOT_APPLICABLE"{
 if(status!=="ISSUED")return "NOT_APPLICABLE";
 if(!expiresAt)return "UNKNOWN";
 if(expiresAt.getTime()<=asOf.getTime())return "EXPIRED";
 return expiresAt.getTime()-asOf.getTime()<=7*86400000?"DUE_SOON":"OPEN";
}
export function selectOfferRegisterFacts(facts:readonly OfferRegisterFact[],status:z.infer<typeof offerRegisterQuery>["status"],search="",joiningState:z.infer<typeof offerRegisterQuery>["joining"]="ALL",kind:z.infer<typeof offerRegisterQuery>["kind"]="ALL",
 expiry:z.infer<typeof offerRegisterQuery>["expiry"]="ALL",asOf=new Date(),minCtcLpa?:number,maxCtcLpa?:number){
 const term=search.trim().toLocaleLowerCase("en-IN");
 return facts.filter(f=>(status==="ALL"||f.offer.status===status)&&
  (kind==="ALL"||f.offer.kind===kind)&&
  (minCtcLpa===undefined||f.offer.annualCtcInr!==null&&f.offer.annualCtcInr>=minCtcLpa*100000)&&
  (maxCtcLpa===undefined||f.offer.annualCtcInr!==null&&f.offer.annualCtcInr<=maxCtcLpa*100000)&&
  (expiry==="ALL"||offerExpiryIndicator(f.offer.status,f.offer.expiresAt,asOf)===expiry)&&(!term||
  [f.candidate.displayName,f.candidate.email,f.candidate.phone,f.candidate.rollNumber,f.candidate.batch,f.candidate.branch,f.offer.roleTitle].some(value=>value?.toLocaleLowerCase("en-IN").includes(term)))&&
  (joiningState==="ALL"||(f.offer.status==="ACCEPTED"&&(f.joining?.status??"PENDING")===joiningState))).sort((a,b)=>b.offer.issuedAt.getTime()-a.offer.issuedAt.getTime()||a.offer.id.localeCompare(b.offer.id));
}
export function projectOfferRegister(facts:readonly OfferRegisterFact[],status:z.infer<typeof offerRegisterQuery>["status"],requestedPage=1,search="",joiningState:"ALL"|"PENDING"|"JOINED"|"DEFERRED"|"DID_NOT_JOIN"="ALL",asOf=new Date(),kind:"ALL"|"OFFER"|"LOI"="ALL",
 expiry:"ALL"|"EXPIRED"|"DUE_SOON"|"OPEN"|"UNKNOWN"="ALL",minCtcLpa?:number,maxCtcLpa?:number){
 const counts={all:facts.length,issued:0,accepted:0,declined:0,withdrawn:0};
 for(const f of facts){
  if(f.offer.status==="ISSUED")counts.issued++;
  if(f.offer.status==="ACCEPTED")counts.accepted++;
  if(f.offer.status==="DECLINED")counts.declined++;
  if(f.offer.status==="WITHDRAWN")counts.withdrawn++;
 }
 const match=selectOfferRegisterFacts(facts,status,search,joiningState,kind,expiry,asOf,minCtcLpa,maxCtcLpa);
 const totalPages=Math.max(1,Math.ceil(match.length/OFFER_REGISTER_PAGE_SIZE));
 const page=Math.max(1,Math.min(requestedPage,totalPages));
 const start=(page-1)*OFFER_REGISTER_PAGE_SIZE;
 return {counts,totalMatching:match.length,page,pageSize:OFFER_REGISTER_PAGE_SIZE,totalPages,rows:match.slice(start,start+OFFER_REGISTER_PAGE_SIZE).map(({offer,candidate,joining})=>({
  id:offer.id,name:candidate.displayName?.trim()||"Unnamed learner",membershipId:candidate.membershipId,email:candidate.email??null,phone:candidate.phone??null,rollNumber:candidate.rollNumber??null,batch:candidate.batch??null,branch:candidate.branch??null,role:offer.roleTitle,kind:offer.kind,annualCtcInr:offer.annualCtcInr,fixedLpa:offer.fixedLpa??null,variableLpa:offer.variableLpa??null,joiningBonusLpa:offer.joiningBonusLpa??null,bondMonths:offer.bondMonths??null,bondAmount:offer.bondAmount??null,acceptanceChannel:offer.acceptanceChannel??null,acceptedDisputableUntil:offer.acceptedDisputableUntil?.toISOString()??null,status:offer.status,ruleCheck:offerRulesCheck(offer.status,offer.kind),
  issued:offer.issuedAt.toISOString(),responded:offer.respondedAt?.toISOString()??null,
  expires:offer.expiresAt?.toISOString()??null,respondByHours:offer.status==="ISSUED"&&offer.expiresAt?Math.max(0,Math.ceil((offer.expiresAt.getTime()-asOf.getTime())/3600000)):null,expiryIndicator:offerExpiryIndicator(offer.status,offer.expiresAt,asOf),
  joining:offer.status==="ACCEPTED"?(joining?.status??"PENDING"):null,
 }))};
}

export const TPO_DRIVE_OFFERS_CSV_LIMIT=5000;
/** Same persisted fact selector as the TPO register; all untrusted cells formula-neutralized. */
export function tpoDriveOfferRegisterCsv(
 facts:readonly OfferRegisterFact[],
 filters:Pick<z.infer<typeof offerRegisterQuery>,"status"|"q"|"joining"|"kind"|"expiry"|"minCtcLpa"|"maxCtcLpa">,
){
 const asOf=new Date();
 const matches=selectOfferRegisterFacts(facts,filters.status,filters.q,filters.joining,filters.kind,filters.expiry,asOf,filters.minCtcLpa,filters.maxCtcLpa);
 const csvDate=(date:Date|null|undefined)=>date?
  new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(date)+" IST":"Not recorded";
 const rows:(string|number|null)[][]=matches.slice(0,TPO_DRIVE_OFFERS_CSV_LIMIT).map(f=>[
  f.offer.id,f.candidate.displayName?.trim()||"Unnamed learner",f.offer.roleTitle,
  f.offer.kind,f.offer.annualCtcInr,f.offer.fixedLpa??null,f.offer.variableLpa??null,f.offer.joiningBonusLpa??null,f.offer.bondMonths??null,f.offer.bondAmount??null,f.candidate.email??null,f.candidate.phone??null,
  f.candidate.rollNumber??null,f.candidate.batch??null,f.candidate.branch??null,
  f.offer.status,f.offer.status==="ACCEPTED"?(f.joining?.status??"PENDING"):"Not applicable",
  csvDate(f.offer.issuedAt),csvDate(f.offer.respondedAt),csvDate(f.offer.expiresAt),f.offer.acceptanceChannel??null,csvDate(f.offer.acceptedDisputableUntil),
  offerRulesCheck(f.offer.status,f.offer.kind),
  offerExpiryIndicator(f.offer.status,f.offer.expiresAt,asOf),
  f.offer.status==="ISSUED"&&f.offer.expiresAt
    ? Math.max(0,Math.ceil((f.offer.expiresAt.getTime()-asOf.getTime())/3600000)) : null,
 ]);
 rows.push(["Methodology","Every row is a persisted offer version; no final selection or joining evidence inferred.",...Array(23).fill("")]);
 const truncated=matches.length>TPO_DRIVE_OFFERS_CSV_LIMIT;
 if(truncated)rows.push(["TRUNCATED",
  "First "+TPO_DRIVE_OFFERS_CSV_LIMIT+" of "+matches.length+" matching offer versions exported.",...Array(23).fill(null)]);
 return {csv:placementReportCsv(["Offer ID","Student","Role","Kind","Annual CTC (INR)","Fixed (LPA)","Variable (LPA)","Joining bonus (LPA)","Bond (months)","Bond amount (INR)","Email","Phone","Roll number","Batch","Branch","Offer status","Joining status","Issued (IST)","Responded (IST)","Expires (IST)","Acceptance channel","Dispute until (IST)","Rules check","Response timing","Hours to respond"],rows),
  totalMatching:matches.length,truncated};
}
