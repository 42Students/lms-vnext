import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  listSuperAdminHrRelationshipOptions,
  listSuperAdminHrColleges,
} from "@/modules/placements/super-admin-hr-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
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
    return NextResponse.json({relationships,colleges},{headers:{"Cache-Control":"private, no-store"}});
  },
);
