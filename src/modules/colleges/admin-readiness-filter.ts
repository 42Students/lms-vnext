import {z} from "zod";
import type {CollegeReadinessCheck} from "./readiness-model";
export const superAdminReadinessQuerySchema=z.strictObject({status:z.enum(["ALL","NEEDS_ATTENTION","FAIL","UNKNOWN","PASS"]).default("ALL"),area:z.enum(["ALL","LIFECYCLE","ACADEMICS","PEOPLE","PLACEMENTS","DOMAINS"]).default("ALL")});
export type SuperAdminReadinessQuery=z.infer<typeof superAdminReadinessQuerySchema>;
/** Filtering presentation never recomputes the full readiness verdict. */
export function visibleReadinessChecks(checks:readonly CollegeReadinessCheck[],status:SuperAdminReadinessQuery["status"],area:SuperAdminReadinessQuery["area"]="ALL"):CollegeReadinessCheck[]{
 const areaChecks=checks.filter(check=>{
  if(area==="ALL")return true;
  const classified:Record<SuperAdminReadinessQuery["area"],readonly string[]>={
    ALL:[],LIFECYCLE:["COLLEGE_ACTIVE"],ACADEMICS:["DEPARTMENTS","PROGRAMS","COHORTS"],
    PEOPLE:["COLLEGE_ADMIN","LEARNERS","FACULTY"],PLACEMENTS:["TPO","PLACEMENT_SEASON"],DOMAINS:["TENANT_DOMAIN"]
  };
  return classified[area].includes(check.id);
 });
 if(status==="ALL")return areaChecks;
 if(status==="NEEDS_ATTENTION")return areaChecks.filter(check=>check.status!=="PASS");
 return areaChecks.filter(check=>check.status===status);
}

/** No first-value wins for repeated readiness filters or unknown keys. */
export function parseSuperAdminReadinessParams(raw:Record<string,string|string[]|undefined>):SuperAdminReadinessQuery|null{
 if(Object.keys(raw).some(key=>key!=="status"&&key!=="area"))return null;
 if(Object.values(raw).some(Array.isArray))return null;
 const result=superAdminReadinessQuerySchema.safeParse({
  status:raw["status"]===""?undefined:raw["status"],
  area:raw["area"]===""?undefined:raw["area"],
 });
 return result.success?result.data:null;
}
