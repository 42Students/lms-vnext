import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import {previewSuperAdminDriveArchive,archiveSuperAdminDrive}
 from "@/modules/placements/super-admin-drive-archive-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
type Ctx={params:Promise<{jobId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(await previewSuperAdminDriveArchive(__ctx,jobId),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    const parsed=await readBoundedJsonRequest(request,8192);
    if(!parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    return NextResponse.json(await archiveSuperAdminDrive(__ctx,jobId,parsed.value));
  },
);
