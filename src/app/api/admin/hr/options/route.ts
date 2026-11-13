import { route } from "@/security/route";
import {
  listSuperAdminHrRelationshipOptions,
  listSuperAdminHrColleges,
} from "@/modules/placements/super-admin-hr-service";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "admin-scope.select" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const collegeId =
      new URL(request.url).searchParams.get(
        "collegeId",
      ) ?? undefined;
    const relationships =
      await listSuperAdminHrRelationshipOptions(
        context,
        collegeId,
      );
    const colleges=await listSuperAdminHrColleges(context);
    return privateJson({relationships,colleges});
  },
);
