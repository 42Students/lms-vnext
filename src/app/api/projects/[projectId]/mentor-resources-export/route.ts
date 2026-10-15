import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getMentorResourceDirectory} from "@/modules/projects/mentor-resource-directory-service";
import {mentorResourceDirectoryQuerySchema,mentorResourceDirectoryCsv}
 from "@/modules/projects/mentor-resource-directory-model";
import {singleValueMentorExportFilters} from "@/modules/projects/mentor-filter-query";
export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};
export async function GET(request:Request,{params}:RouteContext){
 try{
  const {projectId}=await params,url=new URL(request.url);
  const filters=singleValueMentorExportFilters(url.searchParams,
   ["required","link","description","order","search"]);
  if(!filters)return NextResponse.json({error:"INVALID_RESOURCE_FILTERS"},{status:400,
   headers:{"Cache-Control":"private, no-store"}});
  const query=mentorResourceDirectoryQuerySchema.parse({
   projectId,...filters,page:1,
  });
  const data=await getMentorResourceDirectory(await getCurrentRequestContext(),query);
  if(!data.enabled)return NextResponse.json({error:"PROJECT_ACCESS_DENIED"},{status:403});
  return new Response(mentorResourceDirectoryCsv(data.exportItems,data.exportOmitted),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="mentor-resource-directory.csv"',
    "Cache-Control":"private, no-store","X-Export-Omitted":String(data.exportOmitted)},
  });
 }catch(error){return apiErrorResponse(error);}
}
