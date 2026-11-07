import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {overrideProjectReadiness} from "@/modules/projects/readiness-override-service";
import {legacyBooleanProjectReadinessState} from "@/modules/projects/readiness-override-model";
import {getProjectAdminCollegeId} from "@/modules/projects/admin-college-scope";
export const runtime="nodejs";
const legacyReadinessBody=z.object({
 collegeId:z.string().uuid().optional(),
 override:z.boolean().nullable(),
 note:z.string().optional(),
}).strict();
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId}=params;
    const raw:unknown=await boundedRequestJson(request);
    const legacy=legacyReadinessBody.safeParse(raw);
    if(legacy.success&&legacy.data.collegeId&&
      legacy.data.collegeId!==getProjectAdminCollegeId(context))
      return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
    const payload=legacy.success
      ?legacy.data.override===null?{state:legacyBooleanProjectReadinessState(null)}
       :{state:legacyBooleanProjectReadinessState(legacy.data.override),note:legacy.data.note}
      :raw;
    const override=await overrideProjectReadiness(context,projectId,payload);
    return NextResponse.json({override,message:"Readiness updated"},
      {headers:{"Cache-Control":"private, no-store"}});
  },
);
