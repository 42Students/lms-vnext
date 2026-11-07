import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {editCollegeStudentPlacementProfile} from "@/modules/placements/college-placement-profile-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {membershipId}=params;
    const body=await boundedRequestJson(request) as Record<string,unknown>;
    const result=await editCollegeStudentPlacementProfile(
   __ctx,{...body,membershipId});
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
