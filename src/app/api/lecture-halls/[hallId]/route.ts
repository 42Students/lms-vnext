import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  LectureHallError,
  updateLectureHall,
} from "@/modules/academics/lecture-hall-service";
import { lectureHallErrorResponse } from "../error-response";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ hallId: string }> };

/** Edit a hall, or archive / restore it with {"status": "ARCHIVED" | "ACTIVE"}. */
export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const context = await getCurrentRequestContext();
    const { hallId } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }
    return NextResponse.json({
      hall: await updateLectureHall(context, hallId, body),
    });
  } catch (error) {
    if (error instanceof LectureHallError) return lectureHallErrorResponse(error);
    return apiErrorResponse(error);
  }
}


/** Legacy PUT shares the same validated, tenant-scoped update service. */
export async function PUT(request:Request,context:RouteContext){
 return PATCH(request,context);
}

/** Destructive legacy DELETE is migrated to safe, reversible archive.
 * Future scheduled classes still block the operation inside the row lock. */
export async function DELETE(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {hallId}=await params;
  const hall=await updateLectureHall(context,hallId,{status:"ARCHIVED"});
  return NextResponse.json({hall,archived:true,
   message:"Lecture hall archived. Scheduled history was preserved."});
 }catch(error){
  if(error instanceof LectureHallError)return lectureHallErrorResponse(error);
  return apiErrorResponse(error);
 }
}
