import {z} from "zod";
export const tpoConfigVersionSchema=z.iso.datetime({offset:true});
export function hasCurrentTpoConfigVersion(current:Date|undefined,expected:string){
 return (current?.toISOString()??"none")===expected;
}
/** Consistent with the old TPO custom-type names: Unicode compatibility
 * normalization and repeated whitespace collapse precede 2–40 validation.
 * Compare canonical folded forms, not raw user input or byte counts. */
export function canonicalTpoJobTypeName(value:string){
 return value.normalize("NFKC").trim().replace(/\s+/gu," ");
}
export function tpoJobTypeCompareKey(value:string){
 return canonicalTpoJobTypeName(value).toLocaleLowerCase("en-IN");
}
export const tpoJobTypeNameSchema=z.string()
 .transform(canonicalTpoJobTypeName)
 .pipe(z.string().min(2).max(40)
  .regex(/^[\p{L}\p{N} +&\/().,\u0027-]+$/u,"2-40 letters, digits or simple punctuation"));
export const tpoBlockedDaySchema=z.iso.date();

export const tpoPrepConfigSchema=z.object({
 courseIds:z.array(z.string().uuid()).max(40)
  .refine(ids=>new Set(ids).size===ids.length,"Select each preparation course only once."),
 minimumCompleted:z.number().int().min(0).max(40),
}).passthrough().refine(x=>x.minimumCompleted<=x.courseIds.length);
