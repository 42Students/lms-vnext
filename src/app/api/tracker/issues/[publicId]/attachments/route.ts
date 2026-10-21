import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {bugTrackerApiError} from "@/lib/bug-tracker-api-error";
import {trackerAdminRuntimeEnabled} from "@/modules/bug-tracker/readiness";
import {getMyTrackerReport} from "@/modules/bug-tracker/reporter-service";
import {isSuperAdmin} from "@/modules/identity/context";
export const runtime="nodejs";
type Params={params:Promise<{publicId:string}>};
const headers={"cache-control":"private, no-store"};
import {listMyTrackerReportScreenshots} from "@/modules/bug-tracker/reporter-service";
export async function GET(_request:Request,{params}:Params){
  if(!trackerAdminRuntimeEnabled())
    return NextResponse.json({error:"DB10_TRACKER_MIGRATIONS_PENDING"},{status:503,headers});
  try{
    const context=await getCurrentRequestContext(),{publicId}=await params;
    if(isSuperAdmin(context))return NextResponse.json({error:"USE_ADMIN_ISSUE_DETAIL"},{status:400,headers});
    await getMyTrackerReport(context,publicId);
    return NextResponse.json({items:await listMyTrackerReportScreenshots(context,publicId)},{headers});
  }catch(error){return bugTrackerApiError(error);}
}
