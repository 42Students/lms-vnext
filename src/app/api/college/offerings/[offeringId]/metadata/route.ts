import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateCollegeOfferingMetadata,CollegeOfferingMetadataError}
  from "@/modules/courses/college-offering-metadata-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {offeringId}=params;
    return NextResponse.json({offering:await updateCollegeOfferingMetadata(
      __ctx,offeringId,await request.json(),
    )});
  },
);
