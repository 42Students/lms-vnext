import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getFacultyAssignmentMethods} from "@/modules/courses/faculty-assignment-authoring-service";
import {parseFacultyAssignmentMethodsQuery} from "@/modules/courses/faculty-assignment-methods-query";

export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    const {deliveryId}=params;
    const {assignmentId}=parseFacultyAssignmentMethodsQuery(request.url);
    const methods=await getFacultyAssignmentMethods(context,{deliveryId},assignmentId);
    return Response.json({methods},{headers:{"Cache-Control":"private, no-store"}});
  },
);
