import { getCurrentRequestContext } from "@/auth/request-context";
import { exportCollegeDriveApplicationsCsv } from "@/modules/placements/college-drive-applications-service";
import { driveApplicationsParams } from "@/modules/placements/college-drive-applications-model";

export async function GET(request: Request, {params}: {params:Promise<{jobId:string}>}) {
  const context = await getCurrentRequestContext();
  const {jobId}=await params;
  const search=new URL(request.url).searchParams;
  // Keep the export query aligned with the visible applications registry.
  // A repeated or unknown filter must not widen a sensitive CSV export.
  const allowed=new Set([
    "q","status","screening","source","stage","departmentId","programId",
    "cohortId","appliedFrom","appliedTo","appliedAfter","appliedBefore",
    "skills","attention","sort","page","size","pageSize","limit",
  ]);
  const raw:Record<string,string|string[]|undefined>={};
  for(const [key,value] of search){
    if(!allowed.has(key)||raw[key]!==undefined)
      return new Response("Invalid export filters",{status:400});
    raw[key]=value;
  }
  // A nonexistent automated score cannot be silently used for filtering.
  if(["minScore","maxScore","scoreFrom","scoreTo"].some(key=>search.has(key)))
    return new Response("Score filtering is not available for this drive.",
      {status:422,headers:{"Cache-Control":"no-store"}});
  const query=driveApplicationsParams(raw);
  if (!query) return new Response("Invalid export filters",{status:400});
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
