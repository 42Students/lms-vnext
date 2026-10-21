import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {z} from "zod";
import {overrideProjectReadiness} from "@/modules/projects/readiness-override-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};
const legacyReadinessBody=z.object({
 collegeId:z.string().uuid().optional(),
 override:z.boolean().nullable(),
 note:z.string().optional(),
}).strict();
export async function POST(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const {projectId}=await params;
    const raw:unknown=await request.json();
    const legacy=legacyReadinessBody.safeParse(raw);
    // Old collegeId is only a deprecated hint: the project access service
    // derives the authorized college from the persisted project and membership.
    const payload=legacy.success
      ?legacy.data.override===null?{state:"CLEAR" as const}
       :{state:legacy.data.override?"FORCE_UNLOCK" as const:"FORCE_BLOCK" as const,
          note:legacy.data.note}
      :raw;
    const override=await overrideProjectReadiness(context,projectId,payload);
    return NextResponse.json({override});
  }catch(error){return apiErrorResponse(error);}
}
