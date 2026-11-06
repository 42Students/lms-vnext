import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listCourseDiscussionChanges} from "@/modules/courses/discussion-service";

export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {deliveryId}=params;
    const url=new URL(request.url);
    const values=Object.fromEntries(url.searchParams.entries());
    const result=await listCourseDiscussionChanges(
    __ctx,deliveryId,values,
  );
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
