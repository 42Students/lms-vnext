import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {clearGroupRule,refreshGroupRule,GroupRuleServiceError}
 from "@/modules/groups/rules-service";
import {previewCollegeGroupRule} from "@/modules/groups/college-rule-preview-service";
import { noStoreJson } from "@/security/responses";
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
export const POST = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor, params }) => {
    const ctx = __actor!;
    try {
const body=mutation.parse(await boundedRequestJson(request));
const {groupId}=params;
const preview=await previewCollegeGroupRule(ctx,{groupId});
if(preview.projection.incomplete)
   return NextResponse.json({error:"RULE_PREVIEW_INCOMPLETE",
     message:"The learner preview is truncated. Narrow the criteria before applying."},{status:409});
const result=await refreshGroupRule(ctx,groupId,body.expectedGroupVersion);
return noStoreJson(result);
} catch(e){return fail(e);}
  },
);
export const DELETE = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const input=mutation.parse(await boundedRequestJson(request));
const {groupId}=params;
const result=await clearGroupRule(__ctx,groupId,input.expectedGroupVersion);
return noStoreJson(result);
} catch(e){return fail(e);}
  },
);
