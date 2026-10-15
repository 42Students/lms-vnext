import {z} from "zod";
import type {CollegeReadinessCheck} from "./readiness-model";
export const superAdminReadinessQuerySchema=z.strictObject({status:z.enum(["ALL","NEEDS_ATTENTION","FAIL","UNKNOWN","PASS"]).default("ALL")});
export type SuperAdminReadinessQuery=z.infer<typeof superAdminReadinessQuerySchema>;
/** Filtering presentation never recomputes the full readiness verdict. */
export function visibleReadinessChecks(checks:readonly CollegeReadinessCheck[],status:SuperAdminReadinessQuery["status"]):CollegeReadinessCheck[]{
 if(status==="ALL")return [...checks];
 if(status==="NEEDS_ATTENTION")return checks.filter(check=>check.status!=="PASS");
 return checks.filter(check=>check.status===status);
}
