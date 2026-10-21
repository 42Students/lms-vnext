import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {collegeInterviewFilters,listCollegeInterviewDirectory}
 from "@/modules/placements/college-interview-directory-service";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
const escape=(value:string)=>value.replaceAll("\\","\\\\").replaceAll(";","\\;")
 .replaceAll(",","\\,").replaceAll("\n","\\n");
const stamp=(d:Date)=>d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
export async function GET(request:Request){
 try{
  const q=new URL(request.url).searchParams;
  const data=await listCollegeInterviewDirectory(await getCurrentRequestContext(),{
   q:q.get("q")??"",status:q.get("status")??"ALL",type:q.get("type")??"ALL",
   mode:q.get("mode")??"ALL",companyId:q.get("companyId")??undefined,
   interviewId:q.get("interviewId")??undefined,
   departmentId:q.get("departmentId")??undefined,sort:q.get("sort")??"UPCOMING",page:1,
  },{exportAll:true});
  if(!data.ready)return NextResponse.json({error:"INTERVIEW_STORAGE_PENDING"},{status:503});
  if(q.get("interviewId") && data.rows.length===0)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//42Students//College interviews//EN",
   "CALSCALE:GREGORIAN","METHOD:PUBLISH"];
  for(const row of data.rows){
   const end=new Date(row.start.getTime()+row.duration*60000);
   lines.push("BEGIN:VEVENT","UID:"+row.id+"@42students",
    "DTSTAMP:"+stamp(new Date()),"DTSTART:"+stamp(row.start),"DTEND:"+stamp(end),
    "SUMMARY:"+escape(row.kind+" · "+row.job+" · "+row.company),
    "DESCRIPTION:"+escape("Applicant: "+row.student+"; Round: "+row.roundName+"; Interviewer: "+(row.interviewerName??"Not set")+"; Application: "+row.applicationId+"; Status: "+row.status),
    "LOCATION:"+escape(row.venue??row.meetingUrl??""),
    "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.join("\r\n")+"\r\n",{headers:{
   "Content-Type":"text/calendar; charset=utf-8",
   "Content-Disposition":"attachment; filename="+(q.get("interviewId")?"interview.ics":"college-interviews.ics"),
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff",
   ...(data.limited?{"X-Export-Truncated":"true"}:{}),
  }});
 }catch(error){return apiErrorResponse(error);}
}
