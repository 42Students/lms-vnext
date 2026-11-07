import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getInboundMailDetailForAdmin} from "@/modules/inbound-mail/admin-service";

export const runtime="nodejs";
type Params={params:Promise<{id:string}>};
/** Full plain text is available only after a separate global-Super-Admin read.
 * An unknown ID returns the same generic 404 as a deleted email. */
export const GET = route(
  { auth: "user", permission: "admin-scope.select" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {id}=params;
    const message=await getInboundMailDetailForAdmin(__ctx,id);
    if(!message)return NextResponse.json({error:"INBOUND_MAIL_NOT_FOUND"},{status:404,
    headers:{"Cache-Control":"private, no-store"}});
    return NextResponse.json({message},{
   headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  },
);
