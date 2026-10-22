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
  // Legacy CSV headers and order, followed by vNext completion diagnostics.
  const rows=[
   ["learnerId","name","rollNumber","videos","videoTotal",
    "assignments","assignmentTotal","quizzes","quizTotal",
    "percent","completed","itemsMeasured"],
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
  // Use imported identifiers where available; UUID fallback is section-scoped.
  const safeNamePart=(value:string|number)=>String(value).replace(/[^a-zA-Z0-9_-]/g,"_");
  const filename="course-progress-"+safeNamePart(report.chosen.legacyOfferingId??report.chosen.offeringId)+
   "-class-"+safeNamePart(report.chosen.legacyClassId??report.chosen.sectionId)+".csv";
  return new Response(csv,{status:200,headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="'+filename+'"',
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff",
  }});
 }catch(error){return apiErrorResponse(error);}
}
