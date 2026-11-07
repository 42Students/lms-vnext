import { boundedRequestJson } from "@/lib/bounded-request-json";
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
import { route } from "@/security/route";

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
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);


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
      body = await boundedRequestJson(request);
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
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePATCH(request as Parameters<typeof handlePATCH>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePATCH>[1]),
);


/** Legacy PUT shares the same validated, tenant-scoped update service. */
async function handlePUT(request:Request,context:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 return PATCH(request,context);
}
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePUT(request as Parameters<typeof handlePUT>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePUT>[1]),
);

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
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);
