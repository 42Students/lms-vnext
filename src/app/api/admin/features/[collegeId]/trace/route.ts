import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminLearnerAccessTrace} from "@/modules/module-access/admin-trace-service";
import {studentRuleCards} from "@/modules/module-access/admin-student-rule-model";
import {adminModuleTraceQuerySchema} from "@/modules/module-access/admin-trace-service";
import { DEFAULT_TIME_ZONE } from "@/config/locale";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
/** SA-tenants-modules-31: authenticated, college-scoped read-only autocomplete
 * and explanation, never a way to act as the selected student. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const query:Record<string,string>={};
    for(const [key,value] of new URL(request.url).searchParams){
   if(Object.hasOwn(query,key)||!["q","membershipId"].includes(key))
    return NextResponse.json({error:"INVALID_FILTER"},{status:400});
   query[key]=value;
  }
    const parsed=adminModuleTraceQuerySchema.parse(query);
    const {collegeId}=params;
    const result=await getSuperAdminLearnerAccessTrace(
   __ctx,collegeId,parsed);
    if(!result)return NextResponse.json({error:"NOT_FOUND"},{status:404});
    const student=result.selected;
    return NextResponse.json({
   learners:result.learners.slice(0,12).map(row=>({
    membershipId:row.membershipId,displayName:row.displayName,rollNumber:row.rollNumber,
   })),
   selected:student?{
    membershipId:student.membershipId,
    displayName:student.displayName,rollNumber:student.rollNumber,
    placementParticipation:{...student.placementParticipation,
     decidedAtDisplay:student.placementParticipation.decidedAt?.toLocaleString("en-IN",{timeZone:DEFAULT_TIME_ZONE})??null},
    modules:student.modules.map(item=>({
     module:item.module,label:item.label,enabled:item.enabled,
     winnerLevel:item.winnerLevel,winnerLocked:item.winnerLocked,
     explanation:item.module==="placements"
       ?"Module availability is a college-level setting; membership, section and cohort placement participation is decided only by placementParticipation."
       :item.explanation,
     ignoredBelowCollegeScopes:item.module==="placements"?["MEMBERSHIP","SECTION","COHORT"]:[],
     participationAuthority:item.module==="placements"?"placementParticipation":null,
    })),
    rules:studentRuleCards(student.modules).filter(item=>item.module!=="placements").map(item=>({
     module:item.module,label:item.label,stored:item.stored,locked:item.locked,
     blocked:student.modules.some(m=>m.module===item.module&&m.winnerLocked&&m.winnerLevel!=="MEMBERSHIP"),
    })),
   }:null,
  },{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
