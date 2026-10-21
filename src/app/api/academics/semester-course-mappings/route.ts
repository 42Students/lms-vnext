import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { addCollegeTermMapping, addCollegeTermMappings, reorderCollegeTermMappings, CollegeTermMappingError } from "@/modules/academics/college-term-mapping-service";
import { collegeTermCourseFullOrderSchema, TERM_MAPPING_COPY } from "@/modules/academics/college-term-mapping-model";

export const runtime = "nodejs";
/** Legacy addCourse -> POST, addCourses -> POST {mappings}, reorderCourses
 * -> PUT full ordered set; update/unmap -> PATCH/DELETE /[mappingId].
 * Semester-scoped GET is the college term mapping directory.
 */

export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const input = await request.json();
    const bulk = input && Array.isArray(input.mappings);
    const row = bulk
      ? await addCollegeTermMappings(context, input.mappings)
      : await addCollegeTermMapping(context, input);
    const inserted = bulk ? (row as unknown[]).length : 1;
    return NextResponse.json({ mapping: row,
      action: bulk ? "BULK_ADD" : "ADD", insertedCount: inserted,
      message:TERM_MAPPING_COPY.addedMessage(inserted),
      ...(bulk ? { skippedCount: input.mappings.length - inserted } : {}) },
      { status: bulk && inserted === 0 ? 200 : 201 });
  } catch (error) {
    if (error instanceof CollegeTermMappingError)
      return NextResponse.json({ error: error.code }, { status: error.code.endsWith("NOT_FOUND") ? 404 : 409 });
    if(error instanceof ZodError)
      return NextResponse.json({error:"INVALID_TERM_MAPPING",
        fieldErrors:Object.fromEntries(error.issues.map(issue=>{
          const field=String(issue.path[0]??"course_ids");
          const mapped=field==="programTermId"?"semester_id":
            field==="courseId"?"course_ids":field==="programId"?"program_id":field;
          return [mapped,issue.message];
        }))},{status:400});
    if(error instanceof SyntaxError)
      return NextResponse.json({error:"INVALID_TERM_MAPPING"},{status:400});
    return apiErrorResponse(error);
  }
}
/** Legacy /reorderCourses accepts COMPLETE ordered mapping IDs; PUT
 * performs tenant authorization, a locked set-equality CAS and one transaction.
 * It never mutates credits while updating 1-based displayOrder.
 */
export async function PUT(request:Request){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const input=collegeTermCourseFullOrderSchema.parse(await request.json());
    const result=await reorderCollegeTermMappings(context,input);
    return NextResponse.json({status:"OK",message:"Semester course order updated",
      data:result,result},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof CollegeTermMappingError)
      return NextResponse.json({error:error.code},{status:error.code.endsWith("NOT_FOUND")?404:409});
    if(error instanceof ZodError)
      return NextResponse.json({error:"INVALID_TERM_MAPPING",
        fieldErrors:Object.fromEntries(error.issues.map(issue=>{
          const field=String(issue.path[0]??"course_ids");
          const mapped=field==="programTermId"?"semester_id":
            field==="courseId"?"course_ids":field==="programId"?"program_id":field;
          return [mapped,issue.message];
        }))},{status:400});
    if(error instanceof SyntaxError)
      return NextResponse.json({error:"INVALID_TERM_MAPPING"},{status:400});
    return apiErrorResponse(error);
  }
}
