import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {BoundedFormDataError,readBoundedFormData} from "@/lib/bounded-form-data";
import {AuthorizationError} from "@/modules/permissions/policy";
import {postTpoTeamEveryoneMessage} from "@/modules/placements/tpo-team-everyone-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const form=await readBoundedFormData(request,16*1024);
    const result=await postTpoTeamEveryoneMessage(context,{body:form.get("body")});
    if(request.headers.get("accept")?.includes("application/json"))
   return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
    return NextResponse.redirect(new URL("/tpo/team/everyone",request.url),303);
  },
);
