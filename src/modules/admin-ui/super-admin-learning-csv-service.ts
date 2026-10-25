import "server-only";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requirePermission} from "@/modules/permissions/policy";
import {apiErrorResponse} from "@/lib/api-error";
import {placementReportCsv} from "@/modules/placements/report-model";
import {listCollegeLessons,listCollegeCourseProgress} from "@/modules/courses/college-learning-directory-service";
import {listCollegeAssessmentAggregate} from "@/modules/courses/college-assessment-aggregate-service";
import {adminLearningQuerySchema} from "@/modules/courses/admin-learning-read-model";
import {adminAssessmentQuerySchema} from "@/modules/courses/admin-assessment-directory-model";
type Kind="LESSONS"|"PROGRESS"|"ASSIGNMENT"|"QUIZ";
export async function exportSuperAdminLearningDirectory(request:Request,kind:Kind,
 reader:typeof listCollegeAssessmentAggregate=listCollegeAssessmentAggregate):Promise<Response>{
 try{
  // Exports are private Super Admin endpoints. Deny stale or lower-privilege
  // contexts before echoing even generic filter validation feedback.
  const context=await getCurrentRequestContext();
  requirePermission(context,"admin-scope.select");
  const searchParams=new URL(request.url).searchParams;
  // Repeated query parameters are ambiguous across proxies and frameworks:
  // do not silently keep the final value or bypass the selected-college filters.
  if([...searchParams.keys()].some(key=>searchParams.getAll(key).length!==1))
    return Response.json({error:"INVALID_FILTERS"},{status:400});
  const query=Object.fromEntries(searchParams);
  const pageOnly=(kind==="ASSIGNMENT"||kind==="QUIZ")&&query["exportMode"]==="PAGE";
  if(query["exportMode"]!==undefined&&!pageOnly)
    return Response.json({error:"INVALID_FILTERS"},{status:400});
  if(pageOnly)delete query["exportMode"];
  const assessment=kind==="ASSIGNMENT"||kind==="QUIZ";
  const params=(assessment?adminAssessmentQuerySchema:adminLearningQuerySchema).safeParse(query);
  if(!params.success ||
     (kind==="ASSIGNMENT"&&(query["status"]==="CLOSED"||
       (query["results"]!==undefined&&query["results"]!=="ALL"))))
    return Response.json({error:"INVALID_FILTERS"},{status:400});
  const headers:string[]=pageOnly?
    (kind==="QUIZ"?["Title","Course","Status","Points","Due"]:
     ["Title","Course","Scope","Points","Deadline","Submitted","Total students","Graded"]):
    kind==="LESSONS"?["id","lessonName","sequence","status","courseName","courseCode","cohort","semester","contentCount","publishedContentCount"]:
   kind==="PROGRESS"?["offeringId","courseName","courseCode","cohort","semester","status","recordedRows","completedRows","learnersWithRecords"]:
   ["id","title","courseName","courseCode","lessonName","status","dueAt","points","activityCount","eligibleLearners","submittedLearners","gradedLearners","resultsPublished"];
  const rows:(string|number|null)[][]=[];
  let total=0;
  let collegeId:string|null=null;
  const pages=pageOnly?[params.data.page]:Array.from({length:20},(_,index)=>index+1);
  for(const page of pages){
   if(kind==="LESSONS"){
    const data=await listCollegeLessons(context,{...params.data,page,pageSize:100});
    total=data.total;
    rows.push(...data.items.map(item=>[item.id,item.name,item.sequence,item.status,item.courseName,item.courseCode,item.cohortName,item.periodName,item.contentCount,item.publishedContentCount]));
    if(page>=data.totalPages)break;
   }else if(kind==="PROGRESS"){
    const data=await listCollegeCourseProgress(context,{...params.data,page,pageSize:100});
    total=data.total;
    rows.push(...data.items.map(item=>[item.offeringId,item.courseName,item.courseCode,item.cohortName,item.periodName,item.offeringStatus,item.recordedRows,item.completedRows,item.learnersWithRecords]));
    if(page>=data.totalPages)break;
   }else{
    const data=await reader(context,kind,{...params.data,page});
    total=data.total;
    collegeId=data.collegeId;
    if(pageOnly){
      const localDate=(date:Date|null)=>date?new Intl.DateTimeFormat("sv-SE",{
        timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
        hour:"2-digit",minute:"2-digit",hourCycle:"h23",
      }).format(date):"";
      rows.push(...data.items.map(item=>kind==="QUIZ"?
        [item.title||"Untitled quiz",item.courseName||item.courseCode,
         item.status||"DRAFT",item.points,localDate(item.dueAt)]:
        [item.title||"Untitled",item.courseName||item.courseCode,
         item.deliverySpecific?"Section-specific":"All eligible sections",
         item.points,localDate(item.dueAt),item.submittedLearners,
         item.eligibleLearners,item.gradedLearners]));
    }else rows.push(...data.items.map(item=>[
      item.id,item.title,item.courseName,item.courseCode,item.lessonName,item.status,
      item.dueAt?.toISOString()??null,item.points,item.activityCount,
      item.eligibleLearners,item.submittedLearners,item.gradedLearners,
      String(item.resultsPublished??""),
    ]));
    if(page>=data.totalPages)break;
   }
  }
  const max=pageOnly?20:kind==="LESSONS"||kind==="PROGRESS"?2000:500;
  const items=rows.slice(0,max);
  if(!pageOnly&&total>max)items.push(["TRUNCATED: first "+max+" records","Narrow filters to export remaining records."]);
  const filename=pageOnly?
    (kind==="QUIZ"?"quizzes-college-":"assignments-college-")+collegeId+"-page-"+params.data.page+".csv":
    kind.toLowerCase().replace("progress","course-progress")+".csv";
  return new Response("\uFEFF"+placementReportCsv(headers,items),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="'+filename+'"',
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Truncated":String(!pageOnly&&total>max),
  }});
 }catch(error){return apiErrorResponse(error);}
}
