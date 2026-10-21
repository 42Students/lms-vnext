import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getLearnerCalendarExtras} from "@/modules/placements/learner-calendar-extras-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Legacy /learner/drives/calendar-extras, using an authenticated membership
 * rather than trusting the caller's learnerId, college or numeric job IDs. */
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  const start=url.searchParams.get("start"),end=url.searchParams.get("end");
  if(!start||!end)
   return NextResponse.json({error:"CALENDAR_RANGE_REQUIRED",
    message:"Supply start and end dates as YYYY-MM-DD (IST)."},{status:400});
  if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end))
   return NextResponse.json({error:"INVALID_CALENDAR_RANGE"},{status:400});
  const result=await getLearnerCalendarExtras(await getCurrentRequestContext(),start,end);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
