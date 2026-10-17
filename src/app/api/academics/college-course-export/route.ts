import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {exportParams} from "@/modules/academics/college-directory-export-model";
import {listCollegeCourseCatalogueExport} from "@/modules/courses/college-course-catalogue-service";
import {renderCollegeCourseCatalogueCsv} from "@/modules/courses/college-course-catalogue-export-model";

export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  const values=exportParams(new URL(request.url).searchParams);
  if(!values)return new Response(JSON.stringify({error:"Invalid course export filters."}),{
   status:400,headers:{"Content-Type":"application/json"},
  });
  const {rows,truncated}=await listCollegeCourseCatalogueExport(context,values);
  return new Response(renderCollegeCourseCatalogueCsv(rows,truncated),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="college-courses.csv"',
    "Cache-Control":"private, no-store"},
  });
 }catch(error){return apiErrorResponse(error);}
}
