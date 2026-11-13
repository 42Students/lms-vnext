import { route } from "@/security/route";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getAdminLearnerCurrentContentAttempts } from "@/modules/courses/admin-learner-current-progress-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {membershipId}=params;
    const url=new URL(request.url);
    const data=await getAdminLearnerCurrentContentAttempts(
     __ctx,membershipId,url.searchParams.get("deliveryId")??"",
   );
    return privateJson(data);
  },
);
