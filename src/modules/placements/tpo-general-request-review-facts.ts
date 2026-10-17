/** Safe, explicit review projection for independently scoped learner requests.
 * Never reflect arbitrary payload keys or render submitted URLs as markup. */
export type TpoGeneralRequestFact={label:string;value:string};
export function tpoGeneralRequestReviewFacts(kind:string,payload:Record<string,unknown>){
 const value=(key:string)=>{
  const source=payload[key];
  return typeof source==="string"?source.trim().slice(0,1000):"";
 };
 const entry=(label:string,key:string):TpoGeneralRequestFact=>({label,value:value(key)});
 const facts:TpoGeneralRequestFact[]=kind==="OFF_CAMPUS_OFFER"?
  [entry("Company","companyName"),{label:"Annual CTC",value:value("ctcLpa")?value("ctcLpa")+" LPA":""}]:
  kind==="REGISTRATION_CHANGE"?[entry("Requested after-college choice","choice")]:
  kind==="ABSENCE_DISPUTE"?[entry("Application","applicationId"),entry("Round","roundId")]:
  kind==="CORRECTION_WITH_PROOF"?[entry("Section","section"),entry("Field","field"),entry("Requested value","proposedValue")]:
  kind==="PLACEMENT_AFTER_PLACEMENT"?[entry("Requested drive","requestedJobId"),entry("Justification","justification")]:
  kind==="OFFER_ACCEPTANCE_DISPUTE"?[entry("Offer","offerId")]:[];
 const requiresProof=["OFF_CAMPUS_OFFER","ABSENCE_DISPUTE","CORRECTION_WITH_PROOF"].includes(kind);
 let proofUrl:string|null=null;
 const raw=value("proofUrl");
 if(raw&&raw.length<=2000){
  try{
   const parsed=new URL(raw);
   if(parsed.protocol==="https:"&&parsed.hostname&&!parsed.username&&!parsed.password)
    proofUrl=parsed.href;
  }catch{/* Unsupported or invalid user-supplied proof is never linked. */}
 }
 return {facts:facts.filter(item=>item.value!==""),
  requiresProof,proofUrl:requiresProof?proofUrl:null};
}
