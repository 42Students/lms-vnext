import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegeRoundSlotAppointments,mutateCollegeRoundSlotInterview} from "@/modules/placements/college-round-slot-action-service";
import {driveInterviewsParams} from "@/modules/placements/college-drive-interviews-model";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    const query=driveInterviewsParams(Object.fromEntries(new URL(request.url).searchParams));
    if(!query)return NextResponse.json({error:"INVALID_INTERVIEW_FILTERS"},{status:400});
    return NextResponse.json(await getCollegeRoundSlotAppointments(
   __ctx,jobId,{
     ...(query.appointmentPage !== undefined ? {appointmentPage:query.appointmentPage} : {}),
     ...(query.appointmentStatus !== undefined ? {appointmentStatus:query.appointmentStatus} : {}),
     ...(query.appointmentMode !== undefined ? {appointmentMode:query.appointmentMode} : {}),
     ...(query.appointmentSearch !== undefined ? {appointmentSearch:query.appointmentSearch} : {}),
     ...(query.appointmentPageSize !== undefined ? {appointmentPageSize:query.appointmentPageSize} : {}),
     ...(query.appointmentSort !== undefined ? {appointmentSort:query.appointmentSort} : {}),
     ...(query.applicationId !== undefined ? {preferredApplicationId:query.applicationId} : {}),
     ...(query.candidatePage !== undefined ? {candidatePage:query.candidatePage} : {}),
     ...(query.candidatePageSize !== undefined ? {candidatePageSize:query.candidatePageSize} : {}),
     ...(query.candidateSearch !== undefined ? {candidateSearch:query.candidateSearch} : {}),
   }),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {jobId}=params;
    return NextResponse.json(await mutateCollegeRoundSlotInterview(__ctx,jobId,await boundedRequestJson(request)),
   {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
