import {z} from "zod";
export const hrDisplayNamePatchSchema=z.strictObject({
 displayName:z.string().trim().min(2).max(160).regex(/^[^\r\n<>]+$/),
 expectedUpdatedAt:z.iso.datetime(),
});
export function normalizeHrDisplayName(value:string){
 return value.trim().replace(/\s+/g," ");
}
export function sameHrNameVersion(actual:Date,expected:string){
 const parsed=Date.parse(expected);
 return Number.isFinite(parsed)&&actual.getTime()===parsed;
}
