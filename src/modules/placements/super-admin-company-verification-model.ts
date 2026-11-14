import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const companyGlobalVerificationSchema=z.strictObject({
 companyId:zUuid,verified:z.boolean(),
});
export function canVerifyGlobalCompany(scope?:{collegeId?:string|null;organizationId?:string|null}|null){
 return !scope?.collegeId&&!scope?.organizationId;
}
