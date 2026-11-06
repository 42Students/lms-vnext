import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {deleteBlockedDate,BlockedDateError} from "@/modules/placements/tpo-blocked-date-write-service";
export const runtime="nodejs";
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {dateId}=params;
    const body=await request.json() as unknown;
    if(!body||typeof body!=="object"||Array.isArray(body))
   return NextResponse.json({error:"INVALID_INPUT"},{status:400});
    const input=body as Record<string,unknown>;
    const result=await deleteBlockedDate(__ctx,{id:dateId,expectedVersion:input["expectedVersion"]});
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
