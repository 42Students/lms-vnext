/** Only the non-sensitive expiry preference is browser-persisted.
 * Share tokens, recipients and private learner data are never remembered. */
export function companySharePreferenceKey(collegeId:string,relationshipId:string){
 return "tpo:company-share-expiry:v1:"+collegeId+":"+relationshipId;
}
export function parseCompanyShareExpiry(raw:unknown):number{
 const n=typeof raw==="string"&&/^[1-7]$/.test(raw)?Number(raw):2;
 return Number.isInteger(n)&&n>=1&&n<=7?n:2;
}
