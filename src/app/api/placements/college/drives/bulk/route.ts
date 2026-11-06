import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {previewCollegeBulkDrives,updateCollegeBulkDrives} from "@/modules/placements/college-bulk-drive-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const ctx = __actor!;
    const raw=await request.json();
    return NextResponse.json(raw?.confirmStage==="PREVIEW"?
   await previewCollegeBulkDrives(ctx,{action:raw.action,jobIds:raw.jobIds}):
   await updateCollegeBulkDrives(ctx,{action:raw.action,jobIds:raw.jobIds,confirmed:raw.confirmed}),
  {headers:{"Cache-Control":"private, no-store"}});
  },
);
