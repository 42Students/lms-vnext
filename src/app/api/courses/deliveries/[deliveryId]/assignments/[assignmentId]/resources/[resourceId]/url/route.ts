import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {createLearnerAssignmentResourceReadGrant}
 from "@/modules/courses/learner-assignment-materials-service";

export const runtime="nodejs";
type Params={params:Promise<{deliveryId:string;assignmentId:string;resourceId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {deliveryId,assignmentId,resourceId}=params;
    const grant=await createLearnerAssignmentResourceReadGrant(
   __ctx,assignmentId,deliveryId,resourceId);
    return NextResponse.json(grant,{headers:{"Cache-Control":"private, no-store"}});
  },
);
