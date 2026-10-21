import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminRecruiterGrantAudit} from "@/modules/placements/super-admin-recruiter-grant-audit-service";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{
 params:Promise<{userId:string}>;
}){
 try{
  const {userId}=await params;
  const audit=await getSuperAdminRecruiterGrantAudit(await getCurrentRequestContext(),userId);
  return NextResponse.json(audit,{headers:{"cache-control":"no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
