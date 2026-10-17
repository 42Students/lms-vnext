import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminLearnerAccessTrace} from "@/modules/module-access/admin-trace-service";
import {studentRuleCards} from "@/modules/module-access/admin-student-rule-model";
import {adminModuleTraceQuerySchema} from "@/modules/module-access/admin-trace-service";
export const runtime="nodejs";
/** SA-tenants-modules-31: authenticated, college-scoped read-only autocomplete
 * and explanation, never a way to act as the selected student. */
export async function GET(request:Request,{params}:{params:Promise<{collegeId:string}>}){
 try{
  const query:Record<string,string>={};
  for(const [key,value] of new URL(request.url).searchParams){
   if(Object.hasOwn(query,key)||!["q","membershipId"].includes(key))
    return NextResponse.json({error:"INVALID_FILTER"},{status:400});
   query[key]=value;
  }
  const parsed=adminModuleTraceQuerySchema.parse(query);
  const {collegeId}=await params;
  const result=await getSuperAdminLearnerAccessTrace(
   await getCurrentRequestContext(),collegeId,parsed);
  if(!result)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  const student=result.selected;
  return NextResponse.json({
   learners:result.learners.slice(0,12).map(row=>({
    membershipId:row.membershipId,displayName:row.displayName,rollNumber:row.rollNumber,
   })),
   selected:student?{
    membershipId:student.membershipId,
    displayName:student.displayName,rollNumber:student.rollNumber,
    placementParticipation:student.placementParticipation,
    modules:student.modules.map(item=>({
     module:item.module,label:item.label,enabled:item.enabled,
     winnerLevel:item.winnerLevel,winnerLocked:item.winnerLocked,
     explanation:item.explanation,
    })),
    rules:studentRuleCards(student.modules).filter(item=>item.module!=="placements").map(item=>({
     module:item.module,label:item.label,stored:item.stored,locked:item.locked,
     blocked:student.modules.some(m=>m.module===item.module&&m.winnerLocked&&m.winnerLevel!=="MEMBERSHIP"),
    })),
   }:null,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
