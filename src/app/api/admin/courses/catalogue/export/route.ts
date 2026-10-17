import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getDb } from "@/db/client";
import { courses, departments } from "@/db/schema";
import { apiErrorResponse } from "@/lib/api-error";
import { requireSuperAdminSelectedCollege } from "@/modules/admin-ui/super-admin-selected-college";
import {
  COLLEGE_COURSE_EXPORT_CAP,
  collegeCourseCatalogueExportQuerySchema,
  renderCollegeCourseCatalogueCsv,
} from "@/modules/courses/college-course-catalogue-export-model";

export const runtime = "nodejs";

/** SA-academics-people-54: selected-college CSV, not the College Admin endpoint. */
export async function GET(request: Request): Promise<Response> {
  try {
    const params=new URL(request.url).searchParams;
    if([...params.keys()].some((key,index,keys)=>keys.indexOf(key)!==index)){
      return Response.json({error:"INVALID_FILTERS",message:"Choose one value per filter."},{status:400});
    }
    const input=Object.fromEntries(params);
    const query=collegeCourseCatalogueExportQuerySchema.safeParse(input);
    if(!query.success){
      return Response.json({error:"INVALID_FILTERS",message:"Check the search and sort filters."},{status:400});
    }
    const context=await getCurrentRequestContext();
    const scope=requireSuperAdminSelectedCollege(context,"courses.read");
    const term="%"+query.data.q.replace(/[\\%_]/g,"\\$&")+"%";
    const {sort}=query.data;
    const order=sort==="CODE_ASC"?[asc(courses.code),asc(courses.id)]:
      sort==="CODE_DESC"?[desc(courses.code),asc(courses.id)]:
      sort==="NAME_DESC"?[desc(courses.name),asc(courses.id)]:[asc(courses.name),asc(courses.id)];
    const rows=await getDb().select({
      name:courses.name,code:courses.code,departmentName:departments.name,
      description:courses.description,status:courses.status,
    }).from(courses)
      .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,scope.collegeId)))
      .where(and(eq(courses.status,"ACTIVE"),query.data.q?or(ilike(courses.name,term),ilike(courses.code,term),ilike(departments.name,term)):undefined))
      .orderBy(...order).limit(COLLEGE_COURSE_EXPORT_CAP+1);
    const truncated=rows.length>COLLEGE_COURSE_EXPORT_CAP;
    const csv=renderCollegeCourseCatalogueCsv(rows.slice(0,COLLEGE_COURSE_EXPORT_CAP),truncated);
    return new Response("\uFEFF"+csv,{headers:{
      "Content-Type":"text/csv; charset=utf-8",
      "Content-Disposition":'attachment; filename="courses.csv"',
      "Cache-Control":"private, no-store",
      "X-Content-Type-Options":"nosniff",
      "X-Export-Truncated":String(truncated),
    }});
  } catch(error) {
    return apiErrorResponse(error);
  }
}
