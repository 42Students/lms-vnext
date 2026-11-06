import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {writeCollegeGroupDetail,CollegeGroupDetailWriteError}
  from "@/modules/groups/college-group-detail-write-service";
export const runtime="nodejs";
type RouteContext={params:Promise<{groupId:string}>};
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {groupId}=params;
    return NextResponse.json(await writeCollegeGroupDetail(
      __ctx,groupId,await request.json(),
    ));
  },
);
