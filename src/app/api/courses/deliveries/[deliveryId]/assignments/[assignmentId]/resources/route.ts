import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {
 listOwnLearnerAssignmentMaterialLinks,
 listOwnLearnerAssignmentResources,
} from "@/modules/courses/learner-assignment-materials-service";

export const runtime="nodejs";
type Params={params:Promise<{deliveryId:string;assignmentId:string}>};

/** An enrolled learner's resource list never exposes private object keys.
 * PDF and file links are resolved separately through the signed-read route. */
export const GET = route(
  { auth: "user", permission: "courses.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {deliveryId,assignmentId}=params;
    const [resources,materials]=await Promise.all([
   listOwnLearnerAssignmentResources(context,assignmentId,deliveryId),
   listOwnLearnerAssignmentMaterialLinks(context,assignmentId,deliveryId),
  ]);
    return NextResponse.json({resources,materials},{
   headers:{"Cache-Control":"private, no-store"},
  });
  },
);
