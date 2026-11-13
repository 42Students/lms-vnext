import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireProjectReadAccess} from "@/modules/projects/access";
import {apiErrorResponse} from "@/lib/api-error";
import {legacyProjectSectionOrder,projectLegacyCompatibilityRoutes}
 from "@/modules/projects/legacy-project-api-crosswalk";
import { ROLE } from "@/modules/identity/roles";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {projectId}=params;
    const scope=await requireProjectReadAccess(__ctx,projectId);
    const role=scope.access==="ADMIN"?"ADMIN":scope.access===ROLE.LEARNER?"LEARNER":
    scope.member?.role===ROLE.LEARNER?"LEARNER":"MENTOR";
    return NextResponse.json({
   projectId:scope.project.id,
   response:"OK",
   message:"Project workspace sections loaded",
   sections:legacyProjectSectionOrder[role],
   routes:projectLegacyCompatibilityRoutes(scope.project.id,role,
      scope.access!=="OBSERVER"),
  },{headers:{"Cache-Control":"private, no-store"}});
  },
);
