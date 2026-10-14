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
  });
  if (!query) return new Response("Invalid export filters",{status:400});
  try {
    const result=await exportCollegeDriveApplicationsCsv(context,jobId,query);
    return new Response(result.csv,{status:200,headers:{
      "Content-Type":"text/csv; charset=utf-8",
      "Content-Disposition":"attachment; filename=\"college-drive-applicants.csv\"",
      "Cache-Control":"private, no-store",
      "X-Export-Truncated":result.truncated?"true":"false",
      "X-Export-Rows":String(result.exported),
    }});
  } catch {
    return new Response("Applicants unavailable or access denied",{status:404,headers:{"Cache-Control":"no-store"}});
  }
}
