import {z} from "zod";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

const collegeIdsSchema=z.array(z.uuid()).max(100)
 .refine(ids=>new Set(ids).size===ids.length,"Duplicate college");

export function parseModuleMetricsCollegeIds(raw:readonly string[]):string[]{
 const parsed=collegeIdsSchema.safeParse(raw);
 if(!parsed.success)throw new AuthorizationError("college.read");
 return parsed.data;
}

export type ModuleMetricsCollege={id:string;organizationId:string;status:string};
export function assertModuleMetricsCollegeScopes(
 context:RequestContext,requested:readonly string[],stored:readonly ModuleMetricsCollege[],
):void{
 requirePermission(context,"admin-scope.select");
 if(stored.length!==requested.length ||
    stored.some(row=>row.status!=="ACTIVE"||!requested.includes(row.id)))
  throw new AuthorizationError("college.read");
 for(const row of stored){
  requirePermission(context,"college.read",{
   collegeId:row.id,organizationId:row.organizationId,
  });
 }
}
