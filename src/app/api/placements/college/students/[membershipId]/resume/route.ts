import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {grantCollegeStudentPlacementResume} from "@/modules/placements/college-student-resume-service";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{membershipId:string}>};

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const context = __actor!;
    try {
const {membershipId}=params;
const grant=await grantCollegeStudentPlacementResume(context,membershipId);
return NextResponse.redirect(grant.url,{status:303,headers:{
   "Cache-Control":CACHE.PRIVATE_STRICT,
   "Referrer-Policy":"no-referrer",
   "X-Content-Type-Options":"nosniff",
  }});
} catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
  },
);
