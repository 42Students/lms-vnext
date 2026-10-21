import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {clearGroupRule,refreshGroupRule,GroupRuleServiceError}
 from "@/modules/groups/rules-service";
import {previewCollegeGroupRule} from "@/modules/groups/college-rule-preview-service";
export const runtime="nodejs";
type Ctx={params:Promise<{groupId:string}>};
const mutation=z.strictObject({confirmed:z.literal(true),
 expectedGroupVersion:z.number().int().nonnegative()});
function fail(e:unknown){
 if(e instanceof GroupRuleServiceError)return NextResponse.json({error:e.code},{
  status:e.code==="GROUP_RULE_NOT_FOUND"?404:409});
 return apiErrorResponse(e);
}
/** Manual apply is separate from Save: re-check authorized scope and rule
 * under locks, with an optimistic group version. */
export async function POST(request:Request,{params}:Ctx){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const ctx=await getCurrentRequestContext();
  const body=mutation.parse(await request.json());
  const {groupId}=await params;
  const preview=await previewCollegeGroupRule(ctx,{groupId});
  if(preview.projection.incomplete)
   return NextResponse.json({error:"RULE_PREVIEW_INCOMPLETE",
     message:"The learner preview is truncated. Narrow the criteria before applying."},{status:409});
  const result=await refreshGroupRule(ctx,groupId,body.expectedGroupVersion);
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(e){return fail(e);}
}
export async function DELETE(request:Request,{params}:Ctx){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const input=mutation.parse(await request.json());
  const {groupId}=await params;
  const result=await clearGroupRule(await getCurrentRequestContext(),groupId,input.expectedGroupVersion);
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(e){return fail(e);}
}
