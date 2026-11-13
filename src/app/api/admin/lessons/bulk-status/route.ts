import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {bulkSuperAdminLessonVisibility} from "@/modules/courses/super-admin-lesson-bulk-visibility";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const _p=await readBoundedJsonRequest(request,16384);
    if(!_p.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
    const body:unknown=_p.value;
    const result=await bulkSuperAdminLessonVisibility(__ctx,body);
    return Response.json({...result,operation:"LESSON_STATUS_UPDATE",
   lessonStatusChanged:result.changed>0},
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
