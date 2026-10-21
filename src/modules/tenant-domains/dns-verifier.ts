import "server-only";

import { resolveTxt } from "node:dns/promises";
import {
  verificationDnsName,verificationDnsValue,type TenantDomainVerifier,
} from "./service";

function errorCode(error:unknown){
 return error&&typeof error==="object"&&"code" in error&&typeof (error as {code?:unknown}).code==="string"
  ?(error as {code:string}).code:null;
}

/** Accept old DNS hostnames only with the CURRENT domain's high-entropy token.
 * This aids transfer from the old LMS without trusting a previous tenant's
 * unrelated TXT record. Never return received values or the expected token
 * in diagnostics or errors.
 */
export const dnsTenantDomainVerifier:TenantDomainVerifier={
 async verify(host,token){
  const names=[verificationDnsName(host),"_42lms-verify."+host,host];
  const expected=verificationDnsValue(token);
  const legacyValues=["42lms-verification="+token,token];
  const looked=await Promise.allSettled(names.map(name=>resolveTxt(name)));
  let mismatched=false,failed=false;
  for(let i=0;i<looked.length;i++){
   const result=looked[i]!;
   if(result.status==="fulfilled"){
    const values=result.value.map(chunks=>chunks.join(""));
    const targets=i===0?[expected]:legacyValues;
    if(values.some(value=>targets.includes(value)))
     return {verified:true as const,result:"VERIFIED" as const};
    if(values.length)mismatched=true;
   }else{
    const code=errorCode(result.reason);
    if(code!=="ENODATA"&&code!=="ENOTFOUND")failed=true;
   }
  }
  return {verified:false as const,result:
   mismatched?"TXT_VALUE_MISMATCH" as const:
   failed?"DNS_LOOKUP_FAILED" as const:"TXT_RECORD_MISSING" as const};
 },
};
