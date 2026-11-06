import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  TpoCompanyTrustConflict,
  updateConfirmedTpoCompanyTrust,
} from "@/modules/placements/tpo-company-trust-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    return NextResponse.json(await updateConfirmedTpoCompanyTrust(
      context, await request.json(),
    ));
  },
);
