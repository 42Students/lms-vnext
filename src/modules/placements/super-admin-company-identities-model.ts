import {z} from "zod";
import {companyDomainSchema} from "./company-curation-domain-model";
import {canonicalCompanyAlias} from "./company-curation-alias-model";

const action=z.enum(["ADD","REMOVE"]);
export const companyDomainCommandSchema=z.strictObject({
 companyId:z.uuid(),action,domain:z.string().trim().min(4).max(253),
});
export const companyAliasCommandSchema=z.strictObject({
 companyId:z.uuid(),action,alias:z.string().trim().min(2).max(160),
});
export const PERSONAL_EMAIL_HOSTS=new Set([
 "gmail.com","yahoo.com","outlook.com","hotmail.com","live.com","icloud.com",
 "proton.me","protonmail.com","aol.com","rediffmail.com",
]);
export function normalizeCompanyDomain(raw:string){
 // Use the transformed, registrable value for persistence and uniqueness.
 // Validating then returning raw input previously stored mail.company.co.in
 // separately from company.co.in and bypassed the public-mail blocklist.
 const parsed=companyDomainSchema.safeParse(raw);
 if(!parsed.success){
  const message=parsed.error.issues[0]?.message;
  if(message==="Use the company's domain name, not an IP address")throw new Error(message);
  if(message?.includes("personal, temporary or academic"))
   throw new Error("Use a company domain, not a personal, temporary or academic domain");
  throw new Error("Enter a valid company domain.");
 }
 const normalized=parsed.data;
 if(PERSONAL_EMAIL_HOSTS.has(normalized))throw new Error("Personal email domains cannot be claimed.");
 if(normalized.endsWith(".edu")||normalized.endsWith(".ac.in"))
  throw new Error("A college domain cannot be claimed by a company.");
 return normalized;
}
export function normalizeCompanyAlias(raw:string){
 const alias=raw.normalize("NFKC").trim().replace(/\s+/g," ");
 if(alias.length<2||alias.length>160||!canonicalCompanyAlias(alias))
  throw new Error("Other name must be 2 to 160 characters.");
 return alias;
}
