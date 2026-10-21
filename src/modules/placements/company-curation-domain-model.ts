import {z} from "zod";
import {publicWorkEmailIssue} from "./public-work-email-policy";
import {validTpoTrustedHost} from "./tpo-trusted-domain-validation";

/** Preserve the common multi-label suffixes from legacy imports. This is
 * a conservative, local fallback (not a complete Public Suffix List); adding
 * a dependency is prohibited in this lane. Ownership is still checked under
 * the company row lock before the canonical value is persisted. */
const MULTI_LABEL_SUFFIXES=new Set([
 "co.in","com.in","net.in","org.in","firm.in","gen.in","ind.in","ac.in","edu.in","gov.in","res.in",
 "co.uk","org.uk","ac.uk","gov.uk","me.uk","ltd.uk","plc.uk","sch.uk",
 "com.au","net.au","org.au","edu.au","gov.au","asn.au","id.au",
 "co.nz","org.nz","govt.nz","ac.nz","geek.nz",
 "com.sg","net.sg","org.sg","edu.sg","gov.sg",
 "co.jp","ne.jp","or.jp","ac.jp","go.jp",
 "co.kr","or.kr","go.kr","ac.kr","com.br","com.mx","com.tr",
 "com.cn","net.cn","org.cn","com.hk","com.tw","co.za","com.my",
]);
function registrableCompanyHost(host:string):string{
 if(!validTpoTrustedHost(host))return host;
 const labels=host.split(".");
 const suffix=labels.slice(-2).join(".");
 return labels.slice(-(MULTI_LABEL_SUFFIXES.has(suffix)?3:2)).join(".");
}
/** Accept email, @domain, raw host and http(s) website spellings. */
function domainFromInput(raw:string):string{
 const value=raw.trim().toLowerCase();
 if(!value)return "";
 if(/^https?:\/\//.test(value)){
  try {
   const url=new URL(value);
   if((url.protocol!=="https:"&&url.protocol!=="http:")||
      url.username||url.password||url.port)return "";
   return registrableCompanyHost(url.hostname.toLowerCase().replace(/^www\./,""));
  }catch{return "";}
 }
 if(value.startsWith("@"))return registrableCompanyHost(value.slice(1).replace(/^www\./,""));
 const email=/^[^\s@]+@([^\s@]+)$/.exec(value);
 if(email)return registrableCompanyHost((email[1]??"").replace(/^www\./,""));
 return registrableCompanyHost(value.replace(/^www\./,""));
}

export const companyDomainSchema=z.string().trim().max(2048)
 .transform(domainFromInput)
 .superRefine((domain,ctx)=>{
  if(/^\d{1,3}(?:\.\d{1,3}){3}$/.test(domain)||/^\[[0-9a-f:.]+\]$/.test(domain)){
   ctx.addIssue({code:"custom",message:"Use the company's domain name, not an IP address"});
   return;
  }
  if(!validTpoTrustedHost(domain)){
   ctx.addIssue({code:"custom",message:"Enter a valid company domain"});
   return;
  }
  if(publicWorkEmailIssue("owner@"+domain)!==null){
   ctx.addIssue({code:"custom",message:"Use a company domain, not a personal, temporary or academic domain"});
  }
 });
export const curateCompanyDomainSchema=z.strictObject({companyId:z.uuid(),domain:companyDomainSchema,expectedVersion:z.number().int().nonnegative()});
export function companyDomainFromWebsite(website:string):string|null {
 try {
  const url=new URL(website);
  if((url.protocol!=="https:"&&url.protocol!=="http:")||
     url.username||url.password||url.port)return null;
  const parsed=companyDomainSchema.safeParse(url.hostname);
  return parsed.success?parsed.data:null;
 }catch{return null;}
}
