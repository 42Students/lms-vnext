import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegeLearnerProgressReport} from "@/modules/courses/college-learner-progress-service";

export const runtime="nodejs";
const quote=(value:unknown)=>'"'+String(value??"").replace(/"/g,'""')+'"';

/** Export the same authorized active-enrollment audience as the live report. */
export async function GET(request:Request){
 try{
  const context=await getCurrentRequestContext();
  const url=new URL(request.url);
  const {report}=await getCollegeLearnerProgressReport(context,{
   offeringId:url.searchParams.get("offeringId")??undefined,
   deliveryId:url.searchParams.get("deliveryId")??undefined,
  });
  if(!report)return NextResponse.json({error:"SELECT_CLASS_AND_COURSE"},{status:400});
  const rows=[
   ["Student ID","Student","Roll number","Videos completed","Videos total",
    "Assignments completed","Assignments total","Quizzes completed","Quizzes total",
    "Progress (%)","Completed","Items measured"],
   ...report.rows.map(row=>[
    row.membershipId,row.name??"",row.rollNumber??"",
    row.videoDone,report.totalVideos,row.assignmentDone,report.totalAssignments,
    row.quizDone,report.totalQuizzes,row.progress,row.completed,report.itemsMeasured,
   ]),
  ];
  if(report.truncated)rows.push([
   "NOTICE","Report limited to first 2,000 enrolled learners",
   "","", "", "", "", "", "", "", "", "",
  ]);
  const csv="\uFEFF"+rows.map(row=>row.map(quote).join(",")).join("\r\n")+"\r\n";
  return new Response(csv,{status:200,headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="college-learner-course-progress.csv"',
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff",
  }});
 }catch(error){return apiErrorResponse(error);}
}
