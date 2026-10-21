import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { bugTrackerApiError } from "@/lib/bug-tracker-api-error";
import { getBugTrackerIssueForAdmin } from "@/modules/bug-tracker/admin-service";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";
import {parseTrackerActivityCursorParams} from "@/modules/bug-tracker/admin-detail-cursor-model";
import {isSuperAdmin} from "@/modules/identity/context";
import {
  getMyTrackerReport,listMyTrackerReportHistory,listMyTrackerReportScreenshots,
} from "@/modules/bug-tracker/reporter-service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  if (!trackerAdminRuntimeEnabled()) {
    return NextResponse.json(
      { error: "DB10_TRACKER_MIGRATIONS_PENDING" },
      { status: 503 },
    );
  }
  try {
    const context = await getCurrentRequestContext();
    const { publicId } = await params;
    if(!isSuperAdmin(context)){
      if(new URL(request.url).search)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
      const [report,activities,attachments]=await Promise.all([
        getMyTrackerReport(context,publicId),listMyTrackerReportHistory(context,publicId),
        listMyTrackerReportScreenshots(context,publicId),
      ]);
      return NextResponse.json({report,activities,attachments},
        {headers:{"cache-control":"private, no-store"}});
    }
    const query=new URL(request.url).searchParams;
    const raw:Record<string,string>={};
    for(const [key,value] of query){
      if(Object.hasOwn(raw,key))return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
      raw[key]=value;
    }
    const cursor=parseTrackerActivityCursorParams(raw);
    if(!cursor)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const issue = await getBugTrackerIssueForAdmin(context, publicId, cursor);
    return NextResponse.json(issue, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return bugTrackerApiError(error);
  }
}
