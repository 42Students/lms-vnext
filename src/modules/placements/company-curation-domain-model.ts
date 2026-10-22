import {z} from "zod";
import {publicWorkEmailIssue} from "./public-work-email-policy";
import {validTpoTrustedHost} from "./tpo-trusted-domain-validation";
import {PUBLIC_SUFFIX_RULE_DATA} from "./public-suffix-data";

/** PSL registrable-domain boundary. The vendored ICANN + PRIVATE rules
 * include wildcard and exception entries; this prevents unrelated tenants on
 * shared hosts (e.g. *.blogspot.com) collapsing to one corporate identity.
 * This is data-only, not a new runtime package. */
const SUFFIX_RULES=new Set(PUBLIC_SUFFIX_RULE_DATA.split("\n").map(raw=>{
 const marker=raw.startsWith("!")?"!":raw.startsWith("*.")?"*.":"";
 const rule=raw.slice(marker.length);
 try{return marker+new URL("https://"+rule).hostname.toLowerCase()}
 catch{return marker+rule.toLowerCase()}
}));

function registrableCompanyHost(rawHost:string):string{
 let host:string;
 try{
  const parsed=new URL("https://"+rawHost);
  if(parsed.username||parsed.password||parsed.port||parsed.pathname!=="/"||
     parsed.search||parsed.hash)return "";
  host=parsed.hostname.toLowerCase();
 }catch{return ""}
 if(!validTpoTrustedHost(host))return "";
 const labels=host.split(".");
 let ruleSize=1,exceptionSize:number|null=null;
 for(let i=0;i<labels.length;i++){
  const candidate=labels.slice(i).join(".");
  const length=labels.length-i;
  if(SUFFIX_RULES.has("!"+candidate)){exceptionSize=length;break}
  if(SUFFIX_RULES.has(candidate))ruleSize=Math.max(ruleSize,length);
  if(i+1<labels.length&&SUFFIX_RULES.has("*."+labels.slice(i+1).join(".")))
   ruleSize=Math.max(ruleSize,length);
 }
 const publicSuffixLength=exceptionSize===null?ruleSize:exceptionSize-1;
 // A bare public suffix is not a registrable employer-controlled domain.
 return labels.length>publicSuffixLength?
  labels.slice(-(publicSuffixLength+1)).join("."):"";
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
