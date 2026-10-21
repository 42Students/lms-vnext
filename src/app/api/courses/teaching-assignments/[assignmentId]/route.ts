import { NextResponse } from "next/server";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {legacyIdMap} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { CoursesServiceError } from "@/modules/courses/errors";
import {changeCourseTeachingAssignmentRoleInputSchema} from "@/modules/courses/validation";
import {
  endCourseTeachingAssignment,
  changeCourseTeachingAssignmentRole,
} from "@/modules/courses/teaching-assignment-service";

export const runtime = "nodejs";

/** Old FacultyCourseAssociation.mappingId numeric IDs are not assignment
 * UUIDs. Only a verified same-college import crosswalk can resolve one. */
async function scopedTeachingAssignmentId(context:RequestContext,raw:string){
 if(z.uuid().safeParse(raw).success)return raw;
 const collegeId=context.membership?.collegeId??context.adminScope?.collegeId;
 if(!collegeId||!/^[0-9]{1,18}$/.test(raw))
  throw new CoursesServiceError("TEACHING_ASSIGNMENT_NOT_FOUND");
 const [mapped]=await getDb().select({id:legacyIdMap.newId}).from(legacyIdMap)
  .where(and(eq(legacyIdMap.legacyEntityType,"faculty_course_association"),
    eq(legacyIdMap.legacyId,raw),
    eq(legacyIdMap.newEntityType,"course_teaching_assignment"),
    eq(legacyIdMap.collegeId,collegeId))).limit(1);
 if(!mapped)throw new CoursesServiceError("TEACHING_ASSIGNMENT_NOT_FOUND");
 return mapped.id;
}

type RouteContext = {
  params: Promise<{ assignmentId: string }>;
};

export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { assignmentId } = await params;
    const assignment =
      await endCourseTeachingAssignment(
        context,
        await scopedTeachingAssignmentId(context,assignmentId),
      );

    return NextResponse.json({
      assignment,active:false,endedAt:assignment.endedAt,
      message: "Association deactivated successfully.",
    });
  } catch (error) {
    // Legacy deactivation returned an empty 404 for a missing/already
    // ended association. Keep other access failures in the normal API envelope.
    if (error instanceof CoursesServiceError &&
        error.code === "TEACHING_ASSIGNMENT_NOT_FOUND") {
      return new Response(null, { status: 404 });
    }
    return apiErrorResponse(error);
  }
}

export async function PATCH(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const {assignmentId}=await params;
    const body:unknown=await request.json();
    const parsed=changeCourseTeachingAssignmentRoleInputSchema.safeParse(body);
    if(!parsed.success)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const assignment=await changeCourseTeachingAssignmentRole(context,
      await scopedTeachingAssignmentId(context,assignmentId),parsed.data);
    return NextResponse.json({assignment});
  }catch(error){return apiErrorResponse(error);}
}
