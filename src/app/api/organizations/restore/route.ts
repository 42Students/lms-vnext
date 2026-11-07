import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {restoreArchivedEntity} from "@/modules/organizations/service";

export const runtime="nodejs";

/** Legacy POST /restore compatibility for ORGANIZATION and COLLEGE only.
 * Other archived entities retain their role-specific recovery flow. */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const body:unknown=await boundedRequestJson(request);
    const result=await restoreArchivedEntity(context,body);
    return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
  },
);
