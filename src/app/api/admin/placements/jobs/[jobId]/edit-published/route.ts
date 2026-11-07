import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readAdminPlacementJson} from "@/modules/placements/admin-request-body-model";
import {editSuperAdminPublishedDrive} from "@/modules/placements/super-admin-published-drive-edit-service";
export const runtime="nodejs";
type Ctx={params:Promise<{jobId:string}>};
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const body=await readAdminPlacementJson(request,49152);
    if(!body.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const {jobId}=params;
    return NextResponse.json(await editSuperAdminPublishedDrive(
   __ctx,jobId,body.value));
  },
);
