import "server-only";
import {z} from "zod";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {getSuperAdminLearnerAccessTrace} from "./admin-trace-service";
import {writeSuperAdminStudentRule} from "./admin-student-rule-write";

/** Placements intentionally excluded: its inheritance ignores membership scope.
 * Never claim a per-student placement override changed access. */
const inputSchema=z.strictObject({
 membershipIds:z.array(z.uuid()).min(1).max(25).refine(ids=>new Set(ids).size===ids.length),
 module:z.enum(["projects","electives"]),
 action:z.enum(["ENABLE","DISABLE","INHERIT"]),confirmed:z.literal(true),
});
export async function updateSuperAdminStudentRulesInBulk(context:RequestContext,raw:unknown){
 if(!isSuperAdmin(context))throw new AuthorizationError("college.manage");
 const acting=await resolveActingCollege(context,"college.manage");
 const input=inputSchema.parse(raw);
 const applied:string[]=[],failures:{id:string;error:string}[]=[];
 for(const membershipId of input.membershipIds){
  try{
   const trace=await getSuperAdminLearnerAccessTrace(context,acting.collegeId,{membershipId});
   if(!trace?.selected)throw new Error("LEARNER_NOT_FOUND");
   const moduleTrace=trace.selected.modules.find(entry=>entry.module===input.module);
   if(!moduleTrace)throw new Error("MODULE_NOT_SUPPORTED");
   const stored=moduleTrace.steps.find(step=>step.level==="MEMBERSHIP");
   const expected=stored?.source==="PERSISTED"&&stored.value!==null
    ?{enabled:stored.value,locked:stored.locked}:null;
   const action=input.action==="INHERIT"
    ?{action:"INHERIT" as const,module:input.module,expected}
    :{action:"SET" as const,module:input.module,enabled:input.action==="ENABLE",locked:false,expected};
   await writeSuperAdminStudentRule(context,acting.collegeId,membershipId,action);
   applied.push(membershipId);
  }catch(e){failures.push({id:membershipId,error:e instanceof Error?e.message:"UPDATE_FAILED"});}
 }
 return {requested:input.membershipIds.length,applied:applied.length,failures};
}
