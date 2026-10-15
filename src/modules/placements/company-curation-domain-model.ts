import {z} from "zod";
export const companyDomainSchema=z.string().trim().toLowerCase().min(4).max(253).regex(/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/);
export const curateCompanyDomainSchema=z.strictObject({companyId:z.uuid(),domain:companyDomainSchema,expectedVersion:z.number().int().nonnegative()});
export function companyDomainFromWebsite(website:string):string|null {
 try { const url=new URL(website);if(url.protocol!=="https:"&&url.protocol!=="http:")return null;
 const host=url.hostname.toLowerCase().replace(/^www\./,"");return companyDomainSchema.safeParse(host).success?host:null;
 } catch {return null;}
}
