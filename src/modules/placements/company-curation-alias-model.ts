import { z } from "zod";

/** Legacy alias names are trimmed and collapsed to single spaces before saving. */
export function displayCompanyAlias(input:string) {
 return input.trim().replace(/\s+/g," ");
}

export const companyAliasInputSchema = z.strictObject({
 companyId: z.uuid(),
 alias: z.string().transform(displayCompanyAlias)
  .pipe(z.string().min(2,"An alias needs 2 to 150 characters")
   .max(150,"An alias needs 2 to 150 characters")),
 expectedVersion: z.number().int().nonnegative(),
});
export function canonicalCompanyAlias(input:string) {
 return displayCompanyAlias(input).normalize("NFKC").toLocaleLowerCase("en");
}

/** Present the legacy collision message without trusting a database error string. */
export function companyAliasCollisionMessage(
 alias:string, companyName:string, kind:"ALIAS"|"COMPANY_NAME",
):string {
 const name=companyName.replace(/\.+$/,"");
 const value=displayCompanyAlias(alias);
 return kind==="ALIAS"
  ? `"${value}" is already an alias of ${name}`
  : `"${value}" is the name of another company, ${name}. Merge them instead.`;
}
export function uniqueCompanyAliases(input:readonly string[]) {
 const seen=new Set<string>();
 return input.filter(value=>{const key=canonicalCompanyAlias(value); if(!key||seen.has(key))return false;seen.add(key);return true;});
}
