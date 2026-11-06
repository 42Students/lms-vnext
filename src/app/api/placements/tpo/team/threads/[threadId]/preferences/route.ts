import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {updateTpoTeamThreadPreferences} from "@/modules/placements/tpo-team-preferences-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {threadId}=params;
    const body=await request.json().catch(()=>null) as {action?:unknown}|null;
    const result=await updateTpoTeamThreadPreferences(__ctx,{
   threadId,action:body?.action,
  });
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
