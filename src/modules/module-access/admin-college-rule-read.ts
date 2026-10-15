import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {colleges,moduleAccessRules} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {OPTIONAL_MODULE_KEYS} from "./service";
import {collegeRuleReadSnapshot} from "./admin-college-rule-model";
/** An exact persisted tenant lookup precedes any returned rule state. */
export async function getSuperAdminCollegeFeatureSnapshot(context:RequestContext,collegeInput:string){
 if(!isSuperAdmin(context))throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
 const collegeId=z.uuid().parse(collegeInput),db=getDb();
 const [college]=await db.select({id:colleges.id,organizationId:colleges.organizationId,name:colleges.name,status:colleges.status})
  .from(colleges).where(eq(colleges.id,collegeId)).limit(1);
 if(!college||college.status!=="ACTIVE")return null;
 requirePermission(context,"college.read",{collegeId:college.id,organizationId:college.organizationId});
 const rules=await db.select({module:moduleAccessRules.module,enabled:moduleAccessRules.enabled,locked:moduleAccessRules.locked})
  .from(moduleAccessRules).where(and(eq(moduleAccessRules.scopeType,"COLLEGE"),eq(moduleAccessRules.scopeId,collegeId),
    inArray(moduleAccessRules.module,[...OPTIONAL_MODULE_KEYS])));
 return {college:{id:college.id,name:college.name},rules:collegeRuleReadSnapshot(rules)};
}
