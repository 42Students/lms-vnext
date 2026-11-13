import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {editCollegeStudentPlacementProfile} from "@/modules/placements/college-placement-profile-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {membershipId}=params;
    const body=await boundedRequestJson(request) as Record<string,unknown>;
    const result=await editCollegeStudentPlacementProfile(
   __ctx,{...body,membershipId});
    return privateJson(result);
  },
);
