import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoDriveEligibilityReachPreview} from "@/modules/placements/tpo-drive-edit-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"} as const;
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {jobId}=params;
const data=await getTpoDriveEligibilityReachPreview(
   __ctx,jobId);
return NextResponse.json(data,{headers:noStore});
} catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store");
  return response;
 }
  },
);
