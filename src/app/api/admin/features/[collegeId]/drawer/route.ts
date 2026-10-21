import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminLearnerAccessTrace} from "@/modules/module-access/admin-trace-service";
import {studentRuleCards} from "@/modules/module-access/admin-student-rule-model";

export const runtime="nodejs";
const query=z.strictObject({
 q:z.string().trim().min(2).max(100).optional(),
 membershipId:z.uuid().optional(),
 view:z.enum(["suggestions","overrides","locked"]).default("suggestions"),
 page:z.coerce.number().int().min(1).max(10000).default(1),
});
export async function GET(request:Request,{params}:{params:Promise<{collegeId:string}>}){
 try{
  const input:Record<string,string>={};
  for(const [key,value] of new URL(request.url).searchParams){
   if(Object.hasOwn(input,key)||!["q","membershipId","view","page"].includes(key))
    return NextResponse.json({error:"INVALID_FILTER"},{status:400});
   input[key]=value;
  }
  const parsed=query.parse(input);
  const context=await getCurrentRequestContext();
  const {collegeId}=await params;
  // A separate global-admin read reuses the established tenant, membership and
  // permission gates; it never resolves a legacy numeric user ID.
  const isOverrides=parsed.view!=="suggestions";
  const firstIndex=(parsed.page-1)*15;
  const firstPage=isOverrides?Math.floor(firstIndex/25)+1:1;
  const first=await getSuperAdminLearnerAccessTrace(context,collegeId,{
   q:parsed.q??"",membershipId:parsed.membershipId,
   overridesOnly:isOverrides?(parsed.view==="locked"?"locked":"only"):"all",
   page:firstPage,
  });
  if(!first)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  let learners=first.learners;
  if(isOverrides){
   const offset=firstIndex%25;
   if(offset+15>25&&firstPage<first.totalPages){
    const second=await getSuperAdminLearnerAccessTrace(context,collegeId,{
     q:parsed.q??"",overridesOnly:parsed.view==="locked"?"locked":"only",page:firstPage+1,
    });
    learners=[...first.learners,...(second?.learners??[])];
   }
   learners=learners.slice(offset,offset+15);
  }else learners=learners.slice(0,10);
  const student=first.selected;
  return NextResponse.json({
   learners:learners.map(item=>({
    membershipId:item.membershipId,displayName:item.displayName,rollNumber:item.rollNumber,
   })),
   roster:{page:parsed.page,total:first.total,totalPages:Math.max(1,Math.ceil(first.total/15))},
   selected:student?{
    membershipId:student.membershipId,displayName:student.displayName,
    rollNumber:student.rollNumber,
    placementParticipation:{...student.placementParticipation,
     decidedAtDisplay:student.placementParticipation.decidedAt?.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})??null},
    modules:student.modules.map(item=>({
     module:item.module,label:item.label,enabled:item.enabled,
     winnerLevel:item.winnerLevel,winnerLocked:item.winnerLocked,
     explanation:item.explanation,
     steps:item.steps.map(step=>({
      level:step.level,inChain:step.inChain,source:step.source,
      value:step.value,locked:step.locked,ignored:step.ignored,
      winner:step.winner,reason:step.reason,
     })),
    })),
    rules:studentRuleCards(student.modules).filter(item=>item.module!=="placements").map(item=>({
     module:item.module,label:item.label,stored:item.stored,locked:item.locked,
     blocked:student.modules.some(m=>m.module===item.module&&m.winnerLocked&&m.winnerLevel!=="MEMBERSHIP"),
    })),
   }:null,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
