import { z } from "zod";
export const companyAliasInputSchema = z.strictObject({
 companyId: z.uuid(), alias: z.string().trim().min(2).max(160),
 expectedVersion: z.number().int().nonnegative(),
});
export function canonicalCompanyAlias(input:string) {
 return input.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("en");
}
export function uniqueCompanyAliases(input:readonly string[]) {
 const seen=new Set<string>();
 return input.filter(value=>{const key=canonicalCompanyAlias(value); if(!key||seen.has(key))return false;seen.add(key);return true;});
}
