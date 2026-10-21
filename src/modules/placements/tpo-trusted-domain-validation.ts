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

export const tpoTrustedCompanyDomainSchema=z.string().trim().min(4).max(254)
 .transform(value=>normalizeTpoTrustedDomainInput(value))
 .refine(value=>validTpoTrustedHost(value) && !new Set([
  "gmail.com","googlemail.com","yahoo.com","yahoo.co.in","yahoo.in","ymail.com",
  "outlook.com","outlook.in","hotmail.com","live.com","msn.com","icloud.com","me.com","aol.com",
  "rediffmail.com","protonmail.com","proton.me","zohomail.com","zohomail.in",
  "mail.com","gmx.com","yandex.com",
 ]).has(value),"Use a valid non-free company domain");
