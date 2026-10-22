import { getCurrentRequestContext } from "@/auth/request-context";
import { exportCollegeDriveApplicationsCsv } from "@/modules/placements/college-drive-applications-service";
import { driveApplicationsExportParams } from "@/modules/placements/college-drive-applications-model";

export async function GET(request: Request, {params}: {params:Promise<{jobId:string}>}) {
  const context = await getCurrentRequestContext();
  const {jobId}=await params;
  const search=new URL(request.url).searchParams;
  const parsed=driveApplicationsExportParams(search);
  if(!parsed.ok)return new Response(parsed.message,{
    status:parsed.status,headers:{"Cache-Control":"no-store"},
  });
  const query=parsed.query;
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
