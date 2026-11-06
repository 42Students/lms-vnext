import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {beginLessonResourceFileUpload} from "@/modules/courses/lesson-resource-file-upload-service";

export const runtime="nodejs";
type Route={params:Promise<{contentId:string}>};
const noStore={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"};

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {contentId}=params;
    const result=await beginLessonResourceFileUpload(
   __ctx,contentId,await request.json());
    return Response.json(result,{status:201,headers:noStore});
  },
);
