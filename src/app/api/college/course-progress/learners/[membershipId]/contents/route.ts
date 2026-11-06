import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getAdminLearnerCurrentContentAttempts } from "@/modules/courses/admin-learner-current-progress-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handleGET(request:Request,{params}:{
 params:Promise<{membershipId:string}>;
}) {
 try {
   const {membershipId}=await params;
   const url=new URL(request.url);
   const data=await getAdminLearnerCurrentContentAttempts(
     await getCurrentRequestContext(),membershipId,url.searchParams.get("deliveryId")??"",
   );
   return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
 } catch(error) { return apiErrorResponse(error); }
}
export const GET = secured(handleGET);
