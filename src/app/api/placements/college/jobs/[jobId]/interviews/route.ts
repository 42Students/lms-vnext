import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegeRoundSlotAppointments,mutateCollegeRoundSlotInterview} from "@/modules/placements/college-round-slot-action-service";
import {driveInterviewsParams} from "@/modules/placements/college-drive-interviews-model";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};
export async function GET(request:Request,{params}:Props){
 try{const {jobId}=await params;
  const query=driveInterviewsParams(Object.fromEntries(new URL(request.url).searchParams));
  if(!query)return NextResponse.json({error:"INVALID_INTERVIEW_FILTERS"},{status:400});
  return NextResponse.json(await getCollegeRoundSlotAppointments(
   await getCurrentRequestContext(),jobId,{
     appointmentPage:query.appointmentPage,
     ...(query.appointmentStatus !== undefined ? {appointmentStatus:query.appointmentStatus} : {}),
     ...(query.appointmentMode !== undefined ? {appointmentMode:query.appointmentMode} : {}),
     appointmentSearch:query.appointmentSearch,
     appointmentPageSize:query.appointmentPageSize,
     appointmentSort:query.appointmentSort,
     ...(query.applicationId !== undefined ? {preferredApplicationId:query.applicationId} : {}),
     candidatePage:query.candidatePage,
     candidatePageSize:query.candidatePageSize,
     candidateSearch:query.candidateSearch,
   }),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:Props){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  return NextResponse.json(await mutateCollegeRoundSlotInterview(await getCurrentRequestContext(),jobId,await request.json()),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
