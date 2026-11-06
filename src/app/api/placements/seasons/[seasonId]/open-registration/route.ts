import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeTpoSeasonRegistration,TpoSettingsStaleError} from "@/modules/placements/tpo-season-write-service";

export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {seasonId}=params;
    const raw:unknown=await request.json();
    if(!raw||typeof raw!=="object"||Array.isArray(raw))
      return NextResponse.json({error:"INVALID_INPUT"},{status:400});
    const payload={...raw,seasonId};
    const season=await changeTpoSeasonRegistration(__ctx,payload);
    return NextResponse.json({season},{headers:{"Cache-Control":"private, no-store"}});
  },
);
