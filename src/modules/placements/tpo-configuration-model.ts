import {z} from "zod";
export const tpoConfigVersionSchema=z.iso.datetime({offset:true});
export function hasCurrentTpoConfigVersion(current:Date|undefined,expected:string){
 return (current?.toISOString()??"none")===expected;
}
export const tpoJobTypeNameSchema=z.string().trim().min(1).max(100);
export const tpoBlockedDaySchema=z.iso.date();

export const tpoPrepConfigSchema=z.object({
 courseIds:z.array(z.string().uuid()).max(40),
 minimumCompleted:z.number().int().min(0).max(40),
}).passthrough().refine(x=>x.minimumCompleted<=x.courseIds.length);
