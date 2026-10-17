import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listSuperAdminHrRelationshipOptions,
  listSuperAdminHrColleges,
} from "@/modules/placements/super-admin-hr-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context =
      await getCurrentRequestContext();

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
    return NextResponse.json({relationships,colleges});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
