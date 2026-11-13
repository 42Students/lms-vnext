import { route } from "@/security/route";
import {requireRecentDeviceAuthentication} from "@/auth/recent-device-auth";
import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {reconcileLegacySkillCatalog} from "@/modules/skills/skill-source-import-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
/** Upload the bounded decoded RTF/CSV text through authenticated JSON only.
 * No remote URL fetch, file path, automatic seed or public ingestion route. */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    const decoded=await readBoundedUtf8Body(request,210_000);
    if(decoded.kind==="TOO_LARGE")
   return NextResponse.json({error:"SOURCE_TOO_LARGE"},{status:413});
    if(decoded.kind!=="OK")
   return NextResponse.json({error:"INVALID_SOURCE"},{status:400});
    let body:unknown;
    try{body=JSON.parse(decoded.body);}catch{
   return NextResponse.json({error:"INVALID_SOURCE"},{status:400});
  }
    await requireRecentDeviceAuthentication(context.user.id);
    const result=await reconcileLegacySkillCatalog(context,body);
    return NextResponse.json({report:result},
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
