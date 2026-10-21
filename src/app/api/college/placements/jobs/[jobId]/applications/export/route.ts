import { getCurrentRequestContext } from "@/auth/request-context";
import { exportCollegeDriveApplicationsCsv } from "@/modules/placements/college-drive-applications-service";
import { driveApplicationsParams } from "@/modules/placements/college-drive-applications-model";

export async function GET(request: Request, {params}: {params:Promise<{jobId:string}>}) {
  const context = await getCurrentRequestContext();
  const {jobId}=await params;
  const search=new URL(request.url).searchParams;
  const query=driveApplicationsParams({
    q:search.get("q") ?? undefined,
    status:search.get("status") ?? undefined,
    screening:search.get("screening") ?? undefined,
    source:search.get("source") ?? undefined,
    stage:search.get("stage") ?? undefined,
    departmentId:search.get("departmentId") ?? undefined,
    programId:search.get("programId") ?? undefined,
    cohortId:search.get("cohortId") ?? undefined,
    appliedFrom:search.get("appliedFrom") ?? undefined,
    appliedTo:search.get("appliedTo") ?? undefined,
  });
  if (!query) return new Response("Invalid export filters",{status:400});
  // A nonexistent automated screening score must never be silently used for filtering.
  if(["minScore","maxScore","scoreFrom","scoreTo"].some(key=>search.has(key)))
    return new Response("Score filtering is not available for this drive.",
      {status:422,headers:{"Cache-Control":"no-store"}});
  const safeJobId=jobId.replace(/[^a-zA-Z0-9-]/g,"").slice(0,80)||"unknown";
  try {
    const result=await exportCollegeDriveApplicationsCsv(context,jobId,query);
    return new Response(result.csv,{status:200,headers:{
      "Content-Type":"text/csv; charset=utf-8",
      "Content-Disposition":`attachment; filename="applications-job-${safeJobId}.csv"`,
      "Cache-Control":"private, no-store",
      "X-Export-Truncated":result.truncated?"true":"false",
      "X-Export-Rows":String(result.exported),
      "X-Export-Matching-Rows":String(result.total),
    }});
  } catch {
    return new Response("Applicants unavailable or access denied",{status:404,headers:{"Cache-Control":"no-store"}});
  }
}
