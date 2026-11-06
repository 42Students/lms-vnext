import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createBlockedDate,BlockedDateError} from "@/modules/placements/tpo-blocked-date-write-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const result=await createBlockedDate(__ctx,await request.json());
    return NextResponse.json(result,{status:201,headers:{"Cache-Control":"private, no-store"}});
  },
);
