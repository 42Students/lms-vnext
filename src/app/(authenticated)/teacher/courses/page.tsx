import {and,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {assignmentSubmissions,courseAssignments} from "@/db/schema";
import {getFacultyAttendanceWorkspace} from "@/modules/attendance/faculty-service";
import {facultyCourseMonthAttendanceEvidence} from "@/modules/courses/faculty-course-month-attendance-model";
import { parseFacultyCourseListLocation } from "@/modules/courses/faculty-course-list-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseList } from "@/components/courses/faculty-course-list";
import { FacultyCoordinatedCourses } from "@/components/courses/faculty-coordinated-courses";
import { FacultyPrototypeCourseDirectory } from "@/components/courses/faculty-prototype-course-directory";
import { getFacultyCourseList } from "@/modules/courses/faculty-course-list-service";
import {loadAuthorizedCourseDisplayContentsIfReady} from "@/modules/courses/course-display-service";
import {ErrorState} from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { listFacultyCourseCardSummaries } from "@/modules/courses/faculty-course-card-summary-service";
import { listFacultyCourseAssignmentDiagnostics } from "@/modules/courses/faculty-course-service";
import { FacultyCoursesRetry } from "./faculty-courses-retry";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
import { createDateFormatter } from "@/lib/format-date";

export default async function TeacherCoursesPage({searchParams}: {
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  const query=parseFacultyCourseListLocation(await searchParams);
  if(!query)return <div className="min-w-0 max-w-full space-y-5">
    <PageHeader title="My Courses" />
    <Alert tone="error" className="min-w-0">
      The Course filters could not be understood. No other Section has been loaded.
      <TextLink href="/teacher/courses"
        className="ml-2 inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)]">
        Reset filters
      </TextLink>
    </Alert>
  </div>;
  const listResult=await getFacultyCourseList(context,query).then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}));
  if(!listResult.ok)return <div className="min-w-0 space-y-4">
   <PageHeader title="My Courses"/>
   <ErrorState title="Failed to load courses. Please try again."
    description="Your authorized course list could not be loaded. No empty roster has been assumed."
    action={<FacultyCoursesRetry />}/>
  </div>;
  const list=listResult.value;
  const [summaries,display,diagnosticResult]=await Promise.all([
   listFacultyCourseCardSummaries(list.items),
   loadAuthorizedCourseDisplayContentsIfReady(list.items.map(course=>course.courseId))
    .catch(()=>new Map<string,{thumbnailUrl:string|null}>()),
   listFacultyCourseAssignmentDiagnostics(context).then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const})),
  ]);
  const rows = list.items.flatMap((course) => {
    const workspace = summaries.get(course.deliveryId);
    return workspace ? [{ course, workspace, thumbnailUrl:display.get(course.courseId)?.thumbnailUrl??null }] : [];
  });
  const deliveryIds=[...new Set(rows.map(row=>row.course.deliveryId))];
  const waiting=deliveryIds.length?await getDb().select({
   deliveryId:assignmentSubmissions.deliveryId,
   total:sql<number>`count(*)::int`,
  }).from(assignmentSubmissions)
   .innerJoin(courseAssignments,eq(courseAssignments.id,assignmentSubmissions.assignmentId))
   .where(and(inArray(assignmentSubmissions.deliveryId,deliveryIds),
    eq(courseAssignments.status,"PUBLISHED"),
    sql`${assignmentSubmissions.gradingStatus} <> 'GRADED'`))
   .groupBy(assignmentSubmissions.deliveryId):[];
  const pendingByDelivery=Object.fromEntries(waiting.map(row=>[row.deliveryId,row.total] as const));
  const now=new Date();
  const dateParts=createDateFormatter("en-GB", {
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",
  }).formatToParts(now);
  const month=dateParts.find(part=>part.type==="year")!.value+"-"+
    dateParts.find(part=>part.type==="month")!.value;
  // A month rate requires marked sessions AND current authorized roster.
  // The existing attendance service enforces each delivery's faculty scope
  // and protects learners' data; do not scan raw attendance across colleges.
  // Bound concurrent reads on high-course-count lists.
  const attendanceByDelivery:Record<string,{present:number;possible:number}|null>={};
  let cursor=0;
  await Promise.all(Array.from({length:Math.min(4,deliveryIds.length)},async()=>{
    while(cursor<deliveryIds.length){
      const id=deliveryIds[cursor++]!;
      const evidence=await getFacultyAttendanceWorkspace(context,id,month)
        .then(result=>facultyCourseMonthAttendanceEvidence(result,now))
        .catch(()=>null);
      attendanceByDelivery[id]=evidence;
    }
  }));
  return (
    <div className="min-w-0 max-w-full space-y-6">
      <FacultyCoordinatedCourses context={context} />
      <FacultyPrototypeCourseDirectory rows={rows} totalAssignments={list.scopeCount} pendingByDelivery={pendingByDelivery} attendanceByDelivery={attendanceByDelivery}/>
      <Disclosure title="Advanced teaching filters, class assignments and detailed course cards" className="min-w-0">
        <div className="mt-4">
          <FacultyCourseList rows={rows} diagnostics={diagnosticResult.ok?diagnosticResult.value:[]}
            diagnosticsUnavailable={!diagnosticResult.ok} query={list.query} pagination={list} scopeCount={list.scopeCount} periods={list.periods} sections={list.sections} assignmentChoices={list.assignmentChoices} />
        </div>
      </Disclosure>
    </div>
  );
}
