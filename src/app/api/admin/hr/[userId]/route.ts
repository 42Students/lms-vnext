import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { readBoundedJsonRequest } from "@/lib/bounded-json-request";
import {
  getSuperAdminHrAccount,
  updateSuperAdminHrAccount,
} from "@/modules/placements/super-admin-hr-service";
import {
  updateSuperAdminHrInputSchema,
} from "@/modules/placements/super-admin-hr-validation";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { userId } = params;
    const account =
      await getSuperAdminHrAccount(
        context,
        userId,
      );
    return NextResponse.json({ account }, { headers: { "Cache-Control": "private, no-store" } });
  },
);

export const PATCH = route(
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
      updateSuperAdminHrInputSchema.parse(
        parsed.value,
      );
    await requireRecentDeviceAuthentication(context.user.id);
    const account =
      await updateSuperAdminHrAccount(
        context,
        userId,
        input,
      );
    return NextResponse.json({ account }, { headers: { "Cache-Control": "private, no-store" } });
  },
);
