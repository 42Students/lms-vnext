import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegePersonAudit} from "@/modules/people/college-person-audit-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request: req, context: __actor, params }) => {
    const __ctx = __actor!;
    const {membershipId}=params;
    const kind=new URL(req.url).searchParams.get("kind");
    return NextResponse.json(await getCollegePersonAudit(__ctx,membershipId,kind),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
