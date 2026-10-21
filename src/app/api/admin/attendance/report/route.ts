import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getAdminAttendanceGrid} from "@/modules/attendance/admin-service";
import {attendanceIndiaDay} from "@/modules/attendance/admin-grid-model";
export const runtime="nodejs";export const dynamic="force-dynamic";
const query=z.strictObject({
 deliveryId:z.string().uuid(),
 startDate:z.iso.date(),endDate:z.iso.date(),
 view:z.enum(["flat","monthly"]).default("flat"),
 status:z.enum(["ALL","ABSENT","EXCUSED","MEDICAL","LATE","PRESENT","NOT_MARKED"]).default("ALL"),
});
/** Legacy date-range reader migrated to tenant-scoped delivery UUID and
 * inclusive IST dates. No caller-controlled college ID is accepted.
 * Attendance is NOT marked until a session is marked, even when the
 * absence exception row is missing. All cases are bounded to 12 months. */
export async function GET(request:Request){
 try{
  const ctx=await getCurrentRequestContext();
  const collegeId=ctx.adminScope?.collegeId??ctx.membership?.collegeId;
  if(!collegeId)return Response.json({error:"SELECT_COLLEGE"},{status:403});
  const params=new URL(request.url).searchParams;
  if([...params.keys()].some(k=>!["deliveryId","startDate","endDate","view","status"].includes(k))||
   [...new Set(params.keys())].some(k=>params.getAll(k).length!==1))
   return Response.json({error:"INVALID_ATTENDANCE_RANGE"},{status:400});
  const parsed=query.safeParse(Object.fromEntries(params));
  if(!parsed.success)return Response.json({error:"INVALID_ATTENDANCE_RANGE"},{status:400});
  const {deliveryId,startDate,endDate,view,status}=parsed.data;
  if(startDate>endDate)return Response.json({error:"INVALID_ATTENDANCE_RANGE",
   message:"Start date must be on or before end date."},{status:400});
  const first=new Date(startDate+"T00:00:00Z");
  const last=new Date(endDate+"T00:00:00Z");
  if(!Number.isFinite(first.getTime())||!Number.isFinite(last.getTime())||
     last.getTime()-first.getTime()>366*86400000)
   return Response.json({error:"ATTENDANCE_RANGE_TOO_LARGE"},{status:400});
  const months:string[]=[];
  for(let date=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),1));
      date.getTime()<=last.getTime();date.setUTCMonth(date.getUTCMonth()+1)){
   months.push(date.toISOString().slice(0,7));
   if(months.length>13)return Response.json({error:"ATTENDANCE_RANGE_TOO_LARGE"},{status:400});
  }
  const flat:Array<{
   learnerId:string;learner:string;rollNumber:string|null;date:string;
   sessionId:string;sessionTitle:string;status:string;
   markedAt:string|null;markedByUserId:string|null;
  }>=[];
  for(const month of months){
   const grid=await getAdminAttendanceGrid(ctx,{collegeId,deliveryId,month});
   const records=new Map(grid.records.map(r=>[r.scheduleEventId+":"+r.membershipId,r]));
   for(const session of grid.sessions){
    const date=attendanceIndiaDay(session.startsAt.toISOString());
    if(date<startDate||date>endDate)continue;
    for(const learner of grid.roster){
     const record=records.get(session.id+":"+learner.membershipId);
     const kind=session.attendanceStatus!=="MARKED"?"NOT_MARKED":record?.status??"PRESENT";
     if(status!=="ALL"&&status!==kind)continue;
     flat.push({
      learnerId:learner.membershipId,learner:learner.displayName??"Unnamed learner",
      rollNumber:learner.rollNumber,date,sessionId:session.id,
      sessionTitle:session.title,status:kind,
      markedAt:record?.markedAt?.toISOString()??session.attendanceMarkedAt?.toISOString()??null,
      markedByUserId:record?.markedByUserId??session.attendanceMarkedByUserId??null,
     });
     if(flat.length>20000)return Response.json({error:"ATTENDANCE_REPORT_TOO_LARGE",
      message:"Narrow your date range or filters."},{status:413});
    }
   }
  }
  const report=view==="monthly"?{
   classes:[...new Map(flat.map(row=>[row.sessionId,{id:row.sessionId,date:row.date,title:row.sessionTitle}])).values()],
   absentees:flat.filter(row=>["ABSENT","EXCUSED","MEDICAL","LATE"].includes(row.status)),
   rows:flat,
  }:{rows:flat};
  return Response.json({deliveryId,startDate,endDate,view,...report},{
   headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
