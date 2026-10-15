import {z} from "zod";
export const tpoConfigVersionSchema=z.iso.datetime({offset:true});
export function hasCurrentTpoConfigVersion(current:Date|undefined,expected:string){
 return (current?.toISOString()??"none")===expected;
}
export const tpoJobTypeNameSchema=z.string().trim().min(1).max(100);
export const tpoBlockedDaySchema=z.iso.date();
