import { z } from "zod";

/** Legacy V218 alias schema and UI limit new aliases to 150 characters;
 * creator provenance lives on each placement_company_aliases row via
 * addedByUserId and every write has an audited active Super Admin actor.
 * Existing imported values longer than 150 must not be silently truncated. */
export const LEGACY_COMPANY_ALIAS_MAX_LENGTH=150;
/** Legacy alias names are trimmed and collapsed to single spaces before saving. */
export function displayCompanyAlias(input:string) {
 return input.trim().replace(/\s+/g," ");
}

export const companyAliasInputSchema = z.strictObject({
 companyId: z.uuid(),
 alias: z.string().transform(displayCompanyAlias)
  .pipe(z.string().min(2,"An alias needs 2 to 150 characters")
   .max(LEGACY_COMPANY_ALIAS_MAX_LENGTH,"An alias needs 2 to 150 characters")),
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
 return input.filter(value=>{const display=displayCompanyAlias(value);const key=canonicalCompanyAlias(display);
  if(display.length<2||display.length>LEGACY_COMPANY_ALIAS_MAX_LENGTH||!key||seen.has(key))return false;
  seen.add(key);return true;});
}
