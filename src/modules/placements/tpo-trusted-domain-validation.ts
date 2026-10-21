import {z} from "zod";

/** Parse the legacy email / @domain / website spellings into a host without
 * treating an arbitrary URL path, username or query as a trusted domain.
 */
export function normalizeTpoTrustedDomainInput(input:string):string{
 const value=input.trim().toLowerCase();
 try{
  if(/^https?:\/\//.test(value)){
   const url=new URL(value);
   if(url.username||url.password||url.search||url.hash)return "";
   return url.hostname.replace(/^www\./,"");
  }
 }catch{return "";}
 if(value.includes("@"))return value.slice(value.lastIndexOf("@")+1);
 return value.replace(/^www\./,"");
}
/** Strict DNS labels for the existing explicit company-email allowlist. */
export function validTpoTrustedHost(host:string):boolean {
 if(host.length<4||host.length>253)return false;
 const labels=host.split(".");
 if(labels.length<2 || !/^[a-z]{2,63}$/.test(labels[labels.length-1]??""))return false;
 // .local and .localhost are special-use/internal hosts, never public
 // recruiter company mail domains.
 if(["local","localhost","internal"].includes(labels[labels.length-1]??""))return false;
 return labels.every(label=>label.length<=63 &&
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label));
}

/** Legacy CompanyDomainService outcomes are stable across TPO Settings,
 * recruiter onboarding, and the Super Admin company-domain registry.
 * Mail acceptance (NO_MAIL) is determined by the server resolver; client
 * validation must not infer DNS reachability.
 */
export const TPO_TRUSTED_DOMAIN_COPY={
 INVALID:"Enter a valid company email or website",
 PERSONAL_MAIL:"Use a company email. Personal email (Gmail, Yahoo, Outlook and similar) can't be used",
 DISPOSABLE_MAIL:"Temporary email addresses can't be used",
 ACADEMIC:"College and university addresses can't be used for a company",
 IP_ADDRESS:"Use the company's domain name, not an IP address",
 NO_MAIL:"This domain doesn't receive email. Check the spelling",
} as const;
const PERSONAL_DOMAINS=new Set([
 "gmail.com","googlemail.com","yahoo.com","yahoo.co.in","yahoo.in","ymail.com",
 "outlook.com","outlook.in","hotmail.com","live.com","msn.com","icloud.com",
 "me.com","aol.com","rediffmail.com","protonmail.com","proton.me",
 "zohomail.com","zohomail.in","mail.com","gmx.com","yandex.com",
]);
const DISPOSABLE_DOMAINS=new Set([
 "mailinator.com","guerrillamail.com","10minutemail.com","tempmail.com",
 "temp-mail.org","yopmail.com","trashmail.com","throwawaymail.com",
]);
const ACADEMIC_SUFFIXES=[
 ".ac.in",".edu.in",".res.in",".edu",".ac.uk",".edu.au",
 ".ac.nz",".edu.sg",".ac.jp",".edu.cn",
] as const;
export type TpoDomainValidationOutcome=keyof typeof TPO_TRUSTED_DOMAIN_COPY|"OK";
export function tpoTrustedDomainValidationOutcome(
 input:string,mailStatus:"UNKNOWN"|"NO_MAIL"="UNKNOWN",
):TpoDomainValidationOutcome{
 const host=normalizeTpoTrustedDomainInput(input);
 if(/^(?:[0-9.]+|\[[0-9a-f:]+\])$/i.test(host)||host.includes(":"))
  return "IP_ADDRESS";
 if(!validTpoTrustedHost(host))return "INVALID";
 const lower=host.toLowerCase();
 if(PERSONAL_DOMAINS.has(lower))return "PERSONAL_MAIL";
 if(DISPOSABLE_DOMAINS.has(lower))return "DISPOSABLE_MAIL";
 if(ACADEMIC_SUFFIXES.some(suffix=>("."+lower).endsWith(suffix)))
  return "ACADEMIC";
 return mailStatus==="NO_MAIL"?"NO_MAIL":"OK";
}
export function tpoTrustedDomainErrorMessage(
 input:string,mailStatus:"UNKNOWN"|"NO_MAIL"="UNKNOWN",
):string|null{
 const outcome=tpoTrustedDomainValidationOutcome(input,mailStatus);
 return outcome==="OK"?null:TPO_TRUSTED_DOMAIN_COPY[outcome];
}
export const TPO_COMPANY_DOMAIN_ACTION_LABELS={
 title:"Company domains",
 add:"Add company domain",
 remove:"Remove domain",
 empty:"No company domains recorded",
} as const;

export const tpoTrustedCompanyDomainSchema=z.string().trim().min(4).max(254)
 .superRefine((value,ctx)=>{
  const problem=tpoTrustedDomainErrorMessage(value);
  if(problem)ctx.addIssue({code:"custom",message:problem});
 })
 .transform(value=>normalizeTpoTrustedDomainInput(value));
