import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {bugTrackerApiError} from "@/lib/bug-tracker-api-error";
import {trackerAdminRuntimeEnabled} from "@/modules/bug-tracker/readiness";
import {getMyTrackerReport} from "@/modules/bug-tracker/reporter-service";
import {isSuperAdmin} from "@/modules/identity/context";
export const runtime="nodejs";
type Params={params:Promise<{publicId:string}>};
const headers={"cache-control":"private, no-store"};
import {isSameOriginRequest} from "@/auth/origin";
import {bugReportAttachmentPresignSchema} from "@/modules/bug-tracker/reporter-attachment-intent";
export async function POST(request:Request,{params}:Params){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers});
  if(!trackerAdminRuntimeEnabled())
    return NextResponse.json({error:"DB10_TRACKER_MIGRATIONS_PENDING"},{status:503,headers});
  try{
    const context=await getCurrentRequestContext(),{publicId}=await params;
    if(isSuperAdmin(context))return NextResponse.json({error:"USE_ADMIN_ISSUE_DETAIL"},{status:400,headers});
    await getMyTrackerReport(context,publicId);
    const parsed=bugReportAttachmentPresignSchema.safeParse(await request.json().catch(()=>null));
    if(!parsed.success)return NextResponse.json({error:"INVALID_SCREENSHOT",message:parsed.error.issues[0]?.message??"Invalid screenshot."},{status:400,headers});
    // Only the verified private bug-tracker namespace and scanner may issue PUT URLs.
    // A validated payload is not a signed upload: never fabricate credentials.
    return NextResponse.json({error:"SCREENSHOT_STORAGE_UNAVAILABLE",
      message:"Screenshot uploads are temporarily unavailable; submit the issue without attachments."},
      {status:503,headers});
  }catch(error){return bugTrackerApiError(error);}
}
