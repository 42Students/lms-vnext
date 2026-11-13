import { route } from "@/security/route";

import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {isSuperAdmin} from "@/modules/identity/context";
import {zeptoMailTemplateReadiness,logInitialZeptoMailTemplateReadiness} from "@/modules/notifications/zeptomail-template-readiness";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor }) => {
    const context = actor!;
    if(!isSuperAdmin(context)||context.adminScope?.collegeId||context.adminScope?.organizationId)
   return privateJson({error:"FORBIDDEN"}, { status: 403 });
    logInitialZeptoMailTemplateReadiness();
    return privateJson(zeptoMailTemplateReadiness());
  },
);
