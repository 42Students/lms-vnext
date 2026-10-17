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
 const emailDomain=raw.includes("@")?raw.split("@").at(-1)??"":raw;
 const normalized=emailDomain.trim().toLowerCase().replace(/^www\./,"");
 if(!companyDomainSchema.safeParse(normalized).success)throw new Error("Enter a valid company domain.");
 if(PERSONAL_EMAIL_HOSTS.has(normalized))throw new Error("Personal email domains cannot be claimed.");
 return normalized;
}
export function normalizeCompanyAlias(raw:string){
 const alias=raw.normalize("NFKC").trim().replace(/\s+/g," ");
 if(alias.length<2||alias.length>160||!canonicalCompanyAlias(alias))
  throw new Error("Other name must be 2 to 160 characters.");
 return alias;
}
