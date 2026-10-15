import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
export function canManageCollegeDirectoryRow(context:RequestContext,college:{id:string;organizationId:string}){
 return can(context,"college.manage",{collegeId:college.id,organizationId:college.organizationId});
}
