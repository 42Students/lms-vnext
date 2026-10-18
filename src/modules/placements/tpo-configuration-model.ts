import {z} from "zod";
export const tpoConfigVersionSchema=z.iso.datetime({offset:true});
export function hasCurrentTpoConfigVersion(current:Date|undefined,expected:string){
 return (current?.toISOString()??"none")===expected;
}
export const tpoJobTypeNameSchema=z.string().trim().min(2).max(40)
 .regex(/^[\p{L}\p{M}\p{N}+&\/().,\u0027 -]+$/u,"2-40 letters, digits or simple punctuation")
 .refine(value=>/[\p{L}\p{N}]/u.test(value),"Include at least one letter or digit");
export const tpoBlockedDaySchema=z.iso.date();

export const tpoPrepConfigSchema=z.object({
 courseIds:z.array(z.string().uuid()).max(40)
  .refine(ids=>new Set(ids).size===ids.length,"Select each preparation course only once."),
 minimumCompleted:z.number().int().min(0).max(40),
}).passthrough().refine(x=>x.minimumCompleted<=x.courseIds.length);
