import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getFacultyScheduleReassignOptions,reassignFacultyUpcomingSchedules}
 from "@/modules/people/college-faculty-schedule-reassignment-service";
export const runtime="nodejs";
type Params={params:Promise<{membershipId:string}>};
export async function GET(_req:Request,{params}:Params){
 try{const {membershipId}=await params;
  return NextResponse.json(await getFacultyScheduleReassignOptions(await getCurrentRequestContext(),membershipId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(req:Request,{params}:Params){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {membershipId}=await params;
  return NextResponse.json(await reassignFacultyUpcomingSchedules(await getCurrentRequestContext(),
   membershipId,await req.json()),{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
