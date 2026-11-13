import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { readBoundedJsonRequest } from "@/lib/request-body";
import {
  createSuperAdminHrAccount,
  listSuperAdminHrAccounts,
} from "@/modules/placements/super-admin-hr-service";
import {
  createSuperAdminHrInputSchema,
} from "@/modules/placements/super-admin-hr-validation";

import { CACHE, privateJson } from "@/security/responses";
export const runtime = "nodejs";

/** Old numeric recruiter account endpoints map to canonical user identities:
 * GET /api/v1/superadmin/recruiters -> this college-aware GET listing;
 * POST /api/v1/superadmin/recruiters -> this same-origin POST;
 * legacy PUT /{numericId} -> PATCH /api/admin/hr/{userId}, after an
 * explicitly verified legacy numeric-id → user UUID crosswalk.
 * No numeric IDs are accepted as vNext user IDs or silently reused.
 */

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const params =
      new URL(request.url).searchParams;
    const result =
      await listSuperAdminHrAccounts(
        context,
        {
          q: params.get("q") ?? undefined,
          status:
            params.get("status") ?? undefined,
          page:
            params.get("page") ?? undefined,
          pageSize:
            params.get("pageSize") ?? undefined,
        },
      );
    return privateJson(result);
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const parsed = await readBoundedJsonRequest(request, 8192);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    const input =
      createSuperAdminHrInputSchema.parse(
        parsed.value,
      );
    await requireRecentDeviceAuthentication(context.user.id);
    const account =
      await createSuperAdminHrAccount(
        context,
        input,
      );
    return NextResponse.json(
      { account, idKind:"USER_UUID" },
      { status: 201, headers:{"Cache-Control":CACHE.PRIVATE} },
    );
  },
);
