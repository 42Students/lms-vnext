import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {isSuperAdmin} from "@/modules/identity/context";
import {zeptoMailTemplateReadiness,logInitialZeptoMailTemplateReadiness} from "@/modules/notifications/zeptomail-template-readiness";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor }) => {
    const context = actor!;
    if(!isSuperAdmin(context)||context.adminScope?.collegeId||context.adminScope?.organizationId)
   return NextResponse.json({error:"FORBIDDEN"},{status:403,headers:{"Cache-Control":"private, no-store"}});
    logInitialZeptoMailTemplateReadiness();
    return NextResponse.json(zeptoMailTemplateReadiness(),{headers:{"Cache-Control":"private, no-store"}});
  },
);
