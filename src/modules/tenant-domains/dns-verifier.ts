import "server-only";

import { Resolver } from "node:dns/promises";
import {
  verificationDnsName,verificationDnsValue,type TenantDomainVerifier,
} from "./service";

function errorCode(error:unknown){
 return error&&typeof error==="object"&&"code" in error&&typeof (error as {code?:unknown}).code==="string"
  ?(error as {code:string}).code:null;
}

/** Bound each DNS lookup to 2 seconds with one resolver attempt. The
 * environment-selected system resolver stays authoritative by default.
 * GCP South India deployments can opt in to public fallback only after
 * confirming outbound DNS access and resolver policy; no unbounded retries.
 * DNS errors and observed TXT values are deliberately never logged. */
function dnsResolver(servers?:readonly string[]){
 const resolver=new Resolver({timeout:2000,tries:1});
 if(servers)resolver.setServers([...servers]);
 return resolver;
}
async function inspectTxt(names:readonly string[],token:string,resolver:Resolver){
 const expected=verificationDnsValue(token);
 const legacyValues=["42lms-verification="+token,token];
 const looked=await Promise.allSettled(names.map(name=>resolver.resolveTxt(name)));
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
}
/** Preserve legacy verification names only when the current domain's exact
 * high-entropy token matches; never trust another tenant's TXT record. */
export const dnsTenantDomainVerifier:TenantDomainVerifier={
 async verify(host,token){
  const names=[verificationDnsName(host),"_42lms-verify."+host,host];
  const primary=await inspectTxt(names,token,dnsResolver());
  if(primary.verified||process.env.TENANT_DNS_PUBLIC_FALLBACK!=="true")return primary;
  // The legacy service used Google/Cloudflare public DNS as bounded backup.
  // A mismatch from the local resolver still requires an exact token match
  // from backup; public resolvers can never force a false verification.
  try{
   const fallback=await inspectTxt(names,token,dnsResolver(["8.8.8.8","1.1.1.1"]));
   if(fallback.verified)return fallback;
   return {verified:false as const,result:
    primary.result==="TXT_VALUE_MISMATCH"||fallback.result==="TXT_VALUE_MISMATCH"
     ?"TXT_VALUE_MISMATCH" as const:
    primary.result==="DNS_LOOKUP_FAILED"||fallback.result==="DNS_LOOKUP_FAILED"
     ?"DNS_LOOKUP_FAILED" as const:"TXT_RECORD_MISSING" as const};
  }catch{return primary;}
 },
};
