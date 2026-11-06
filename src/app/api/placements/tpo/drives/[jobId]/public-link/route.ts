import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoExternalJobShare,createTpoExternalJobShare} from "@/modules/placements/tpo-public-join-link-service";
export const runtime="nodejs";
type Props={params:Promise<{jobId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(await getTpoExternalJobShare(__ctx,jobId),
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(await createTpoExternalJobShare(__ctx,jobId),
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
