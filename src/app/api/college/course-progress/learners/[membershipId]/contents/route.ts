import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getAdminLearnerCurrentContentAttempts } from "@/modules/courses/admin-learner-current-progress-service";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{
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
