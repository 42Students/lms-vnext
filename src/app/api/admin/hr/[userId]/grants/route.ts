import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { readBoundedJsonRequest } from "@/lib/bounded-json-request";
import {
  grantSuperAdminHrCollegeAccess,
} from "@/modules/placements/super-admin-hr-service";
import {
  grantSuperAdminHrCollegeInputSchema,
} from "@/modules/placements/super-admin-hr-validation";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { userId } = params;
    const parsed = await readBoundedJsonRequest(request, 8192);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    const input =
      grantSuperAdminHrCollegeInputSchema.parse(
        parsed.value,
      );
    await requireRecentDeviceAuthentication(context.user.id);
    const grant =
      await grantSuperAdminHrCollegeAccess(
        context,
        userId,
        input,
      );
    return NextResponse.json(
      { grant },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  },
);
