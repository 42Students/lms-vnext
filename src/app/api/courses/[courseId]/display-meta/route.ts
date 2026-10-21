import {NextResponse} from "next/server";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {courses,departments} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {requirePermission} from "@/modules/permissions/policy";
import {loadCourseScope} from "@/modules/courses/scope";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{
 params:Promise<{courseId:string}>;
}){
 try{
  const context=await getCurrentRequestContext();
  const {courseId}=await params;
  const id=z.string().uuid().parse(courseId);
  const scope=await loadCourseScope(id);
  requirePermission(context,"courses.manage",{
   collegeId:scope.collegeId,organizationId:scope.organizationId,
  });
  const [metadata]=await getDb().select({
   id:courses.id,name:courses.name,code:courses.code,
   shortTitle:courses.shortTitle,officialCode:courses.officialCode,
   cardColor:courses.cardColor,description:courses.description,
   updatedAt:courses.updatedAt,
  }).from(courses).innerJoin(departments,and(
    eq(departments.id,courses.departmentId),eq(departments.collegeId,scope.collegeId),
  )).where(eq(courses.id,id)).limit(1);
  if(!metadata)return NextResponse.json({error:"COURSE_NOT_FOUND"},{status:404});
  return NextResponse.json({metadata},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
