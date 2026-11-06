import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeCollegeElectiveLifecycle,ElectiveLifecycleError}
  from "@/modules/electives/college-elective-lifecycle-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {slotId}=params;
    return NextResponse.json({slot:await changeCollegeElectiveLifecycle(
      __ctx,slotId,await request.json(),
    )});
  },
);
