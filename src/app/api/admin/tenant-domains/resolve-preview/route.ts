import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {previewTenantHostResolutionWithRuntime} from "@/modules/tenant-domains/runtime";

export const runtime="nodejs";

/** Read-only global administrator preview of the effective verified host. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const query=new URL(request.url).searchParams;
    if([...query.keys()].length!==1||!query.has("host")||!(query.get("host")??"").trim())
   return NextResponse.json({error:"HOST_REQUIRED",
    fieldErrors:{host:"Enter one fully qualified tenant host."}},{status:400,
    headers:{"Cache-Control":"private, no-store"}});
    const resolution=await previewTenantHostResolutionWithRuntime(
   __ctx,query.get("host")!);
    return NextResponse.json(resolution,{headers:{"Cache-Control":"private, no-store"}});
  },
);
