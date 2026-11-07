import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {getBugTrackerIssueForAdmin} from "@/modules/bug-tracker/admin-service";
import {readTrackerLiveLogs} from "@/modules/bug-tracker/tracker-cloud-logs";
import { route } from "@/security/route";

export const runtime="nodejs";
async function handleGET(
  _request:Request,{params}:{params:Promise<{publicId:string}>},
){
  const context=await getCurrentRequestContext();
  if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE"||
     context.adminScope?.collegeId||context.adminScope?.organizationId)
    return NextResponse.json({message:"Not authorized."},{status:403});
  try{
    const {publicId}=await params;
    // This validates the ID and tenant/admin read scope before requesting logs.
    const issue=await getBugTrackerIssueForAdmin(context,publicId);
    const result=await readTrackerLiveLogs(context,{
      windowMinutes:10,
      minimumSeverity:"WARNING",
      anchorAt:issue.report.createdAt.toISOString(),
      query:"",
    });
    return NextResponse.json({...result,anchorAt:issue.report.createdAt.toISOString()},
      {headers:{"Cache-Control":"private, no-store"}});
  }catch{
    return NextResponse.json({message:"Nearby log entries could not be loaded."},{status:503});
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
