import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {removeBlockedRange,BlockedDateError} from "@/modules/placements/tpo-blocked-date-write-service";
export const runtime="nodejs";
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await removeBlockedRange(__ctx,await request.json()),{
   headers:{"Cache-Control":"private, no-store"}});
  },
);
