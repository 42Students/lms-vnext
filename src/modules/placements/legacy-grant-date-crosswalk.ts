/** Historic grant validUntil was a college-local DATE inclusive of that day.
 * A new timestamptz expiration is exclusive, so store the first instant of
 * the NEXT IST day rather than truncating a local evening to UTC midnight.
 * This avoids granting an extra day or prematurely expiring at 05:30 IST.
 */
export function legacyRecruiterGrantExclusiveExpiry(dateIso:string):Date|null{
 const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
 if(!m)return null;
 const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]);
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)
   return null;
 return new Date(Date.UTC(year,month-1,day+1)-330*60_000);
}
/** Legacy indefinite access is not equivalent to a far-future invented date. */
export function legacyRecruiterGrantEndMapping(value:string|null|undefined){
 if(!value)return {expiresAt:null,sourceValidUntil:null,requiresPolicyReview:true};
 const expiresAt=legacyRecruiterGrantExclusiveExpiry(value);
 return {expiresAt,sourceValidUntil:value,requiresPolicyReview:expiresAt===null};
}
