import {z} from "zod";
import {publicWorkEmailIssue} from "./public-work-email-policy";
import {validTpoTrustedHost} from "./tpo-trusted-domain-validation";
import {registrableCompanyHost} from "./public-suffix-policy";

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
