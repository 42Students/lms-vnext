import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeCollegeSectionLifecycle,CollegeSectionLifecycleError}
  from "@/modules/academics/college-section-lifecycle-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {sectionId}=params;
    return NextResponse.json({section:await changeCollegeSectionLifecycle(
      __ctx,sectionId,await request.json(),
    )});
  },
);
