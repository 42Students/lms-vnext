import {z} from "zod";
export const companyGlobalVerificationSchema=z.strictObject({
 companyId:z.uuid(),verified:z.boolean(),
});
export function canVerifyGlobalCompany(scope?:{collegeId?:string|null;organizationId?:string|null}|null){
 return !scope?.collegeId&&!scope?.organizationId;
}
