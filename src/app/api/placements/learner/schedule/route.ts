import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {apiErrorResponse} from "@/lib/api-error";
import {partitionLearnerPlacementSchedule} from "@/modules/placements/learner-placement-schedule-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Legacy learner /schedule adapter. Caller identity is session-owned; never
 * accept learnerId, collegeId, or applicationId as an authorization bypass. */
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  if([...url.searchParams.keys()].some(key=>key!=="view"))
   return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  const requested=url.searchParams.get("view")??"ahead";
  if(!["ahead","past","month","all"].includes(requested))
   return NextResponse.json({error:"INVALID_VIEW"},{status:400});
  const context=await getCurrentRequestContext();
  const own=await getLearnerPlacementRequestWorkspace(context);
  const now=new Date();
  const {ahead,past,undated}=partitionLearnerPlacementSchedule(own.rounds,now);
  const filter=requested==="past"?past:requested==="ahead"?[...ahead,...undated]:own.rounds;
  return NextResponse.json({
   status:"success",message:filter.length?"Schedule retrieved":"No scheduled rounds",
   data:filter.slice(0,500).map(row=>({
    applicationId:row.applicationId,roundId:row.roundId,
    roundName:row.roundName,roundKind:row.roundKind,
    companyName:row.companyName,roleTitle:row.roleTitle,
    scheduledAt:(row.exception?.scheduledAt??row.scheduledAt)?.toISOString()??null,
    endsAt:row.scheduledAt&&row.durationMinutes?
      new Date((row.exception?.scheduledAt??row.scheduledAt).getTime()+row.durationMinutes*60_000).toISOString():null,
    timezone:row.exception?.timezone??row.timezone??"Asia/Kolkata",
    venue:row.exception?.venue??row.venue,
    meetingUrl:row.exception?.meetingUrl??row.meetingUrl,
    whatToBring:row.whatToBring??null,
    booked:row.booked,learnerConfirmed:row.learnerConfirmedAt!==null,
   })),
   total:filter.length,truncated:filter.length>500,
   fromOwnMembership:true,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
