import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/request-body";
import {applyCollegeStudentModuleBulk,previewCollegeStudentModuleBulk}
 from "@/modules/module-access/college-student-bulk-rule-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const command=await readBoundedJsonRequest(request,16384);
    if(!command.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
    const raw:unknown=command.value;
    if(!raw||typeof raw!=="object"||Array.isArray(raw)||!("action" in raw))
     return Response.json({error:"INVALID_REQUEST"},{status:400});
    if(raw.action==="PREVIEW")
     return Response.json(await previewCollegeStudentModuleBulk(
       __ctx,raw),{headers:{"Cache-Control":CACHE.PRIVATE}});
    if(raw.action==="APPLY")
     return Response.json(await applyCollegeStudentModuleBulk(
       __ctx,raw),{headers:{"Cache-Control":CACHE.PRIVATE}});
    return Response.json({error:"INVALID_REQUEST"},{status:400});
  },
);
