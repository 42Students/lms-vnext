import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {listSupportSmsDeliveryHistory} from "@/modules/messaging/receipt-history-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
/** POST avoids recording pasted contact details in URLs, browser history or
 * proxy access logs. The service enforces GLOBAL Super Admin access. */
export const POST = route(
  { auth: "user", permission: "admin-scope.select" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const _p=await readBoundedJsonRequest(request,8192);
    if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const body:unknown=_p.value;
    if(body===null||typeof body!=="object"||Array.isArray(body))
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const source=body as Record<string,unknown>;
    const rows=await listSupportSmsDeliveryHistory(context,{
   recipientSuffix:source["recipientSuffix"],purpose:source["purpose"],
   page:source["page"],size:source["size"],
  });
    return privateJson(rows);
  },
);
