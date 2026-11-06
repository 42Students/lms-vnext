import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  LectureHallError,
  updateLectureHall,
  getLectureHallDetail,
  normalizeLegacyLectureHallUpdate,
} from "@/modules/academics/lecture-hall-service";
import { lectureHallErrorResponse } from "../error-response";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ hallId: string }> };
/** Scoped by-ID read; old integer hall ID must first be mapped to UUID. */
async function handleGET(_request:Request,{params}:RouteContext){
 try{
  const ctx=await getCurrentRequestContext();
  const hall=await getLectureHallDetail(ctx,(await params).hallId);
  return NextResponse.json({hall},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof LectureHallError)return lectureHallErrorResponse(error);
  return apiErrorResponse(error);
 }
}
export const GET = secured(handleGET);


/** Edit a hall, or archive / restore it with {"status": "ARCHIVED" | "ACTIVE"}. */
async function handlePATCH(request: Request, { params }: RouteContext) {
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
      hall: await updateLectureHall(context, hallId,
        new URL(request.url).searchParams.get("legacy") === "1"
          ? normalizeLegacyLectureHallUpdate(body) : body),
    });
  } catch (error) {
    if (error instanceof LectureHallError) return lectureHallErrorResponse(error);
    return apiErrorResponse(error);
  }
}
export const PATCH = secured(handlePATCH, { csrf: "enforce" });


/** Legacy PUT shares the same validated, tenant-scoped update service. */
async function handlePUT(request:Request,context:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 return PATCH(request,context);
}
export const PUT = secured(handlePUT, { csrf: "enforce" });

/** Destructive legacy DELETE is migrated to safe, reversible archive.
 * Future scheduled classes still block the operation inside the row lock. */
async function handleDELETE(request:Request,{params}:RouteContext){
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
export const DELETE = secured(handleDELETE, { csrf: "enforce" });
