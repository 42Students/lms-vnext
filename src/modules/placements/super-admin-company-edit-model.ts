import {z} from "zod";
export const globalCompanyEditSchema=z.strictObject({
 companyId:z.uuid(),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 name:z.string().trim().min(2).max(150),
 website:z.union([z.string().trim().url().refine(v=>v.startsWith("https://"),"Use HTTPS"),z.literal("")]).transform(v=>v||null),
 industry:z.string().trim().max(160).nullable(),
 about:z.string().trim().max(3000).nullable(),
 logoPublicUrl:z.union([z.string().trim().url().refine(v=>v.startsWith("https://"),"Use HTTPS"),z.literal("")]).transform(v=>v||null),
});
export function isGlobalCompanyScope(scope?:{collegeId?:string|null;organizationId?:string|null}|null) {
 return !scope?.collegeId&&!scope?.organizationId;
}
