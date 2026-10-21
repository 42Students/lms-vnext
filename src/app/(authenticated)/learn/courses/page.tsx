import { getCurrentRequestContext } from "@/auth/request-context";
import Link from "next/link";
import {redirect} from "next/navigation";
import {learnerLegacyRouteQuery,resolveLearnerLegacyCourseDelivery} from "@/modules/courses/learner-course-legacy-route-model";
import {Alert} from "@/components/ui/alert";
import {
  LearnerCourseList,
  type LearnerCourseListRow,
} from "@/components/courses/learner-course-list";
import {mapLearnerCourseCardsLimited} from "@/modules/courses/learner-course-list-concurrency-model";
import {getLearnerCourseSetupStatus,listLearnerProgramSemesters} from "@/modules/courses/learner-course-setup-service";
import { learnerCourseInstructorLabels } from "@/modules/courses/learner-course-instructor-labels-model";
import { PageHeader } from "@/components/ui/page-header";
import { loadAuthorizedCourseDisplayContentsIfReady } from "@/modules/courses/course-display-service";
import { selectLearnerOverdueAssignment } from "@/modules/courses/learner-course-overdue-link-model";
import { learnerCourseListSignals } from "@/modules/courses/learner-course-overview-model";
import {
  getLearnerCourseWorkspace,
  listLearnerCourseDeliveries,
  listLearnerCourseInstructors,
} from "@/modules/courses/learner-course-service";

export const dynamic="force-dynamic";

export default async function LearnerCoursesPage({
 searchParams,
}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const context = await getCurrentRequestContext();
  const params=await searchParams;
  const legacyRequested=Object.keys(params).some(key=>
   ["legacyCourseId","legacyClassId","legacySemesterCourseId"].includes(key));
  const rawAlias=legacyRequested?learnerLegacyRouteQuery.safeParse(params):null;
  let directoryError:string|null=null;
  const courses=await listLearnerCourseDeliveries(context,{includeHistorical:true})
   .catch(error=>{
    directoryError=error instanceof Error&&/ACCESS_DENIED|PERMISSION|AUTH|403/i.test(error.message)
     ?"You do not have permission to view these courses."
     :"Failed to load courses. Please try again.";
    return [];
   });

  if(legacyRequested){
    if(!rawAlias?.success||directoryError){
      return <section className="min-w-0 space-y-4">
        <PageHeader title="Courses"/>
        <Alert tone="error" title="Cannot open the old course link">
          {directoryError??"The old course link needs a valid numeric course ID and optional class/semester-course IDs."}
          <Link href="/learn/courses" className="ml-2 inline-flex min-h-9 font-semibold text-link underline">View my courses</Link>
        </Alert>
      </section>;
    }
    const resolved=resolveLearnerLegacyCourseDelivery(courses,rawAlias.data);
    if(resolved.kind==="RESOLVED")redirect("/learn/courses/"+encodeURIComponent(resolved.deliveryId));
    return <section className="min-w-0 space-y-4">
      <PageHeader title="Courses"/>
      <Alert tone="warning" title="Old course link needs review">
        {resolved.kind==="AMBIGUOUS"
         ?"This course appears in more than one enrolled class or semester. Choose the class from the current Courses page."
         :"No course in your selected college enrollment matches this old link."}
        <Link href="/learn/courses" className="ml-2 inline-flex min-h-9 font-semibold text-link underline">Choose a course</Link>
      </Alert>
    </section>;
  }

  let displayLoadFailed=false;
  let displays=new Map<string,{thumbnailUrl:string|null}>();
  try{
    displays=await loadAuthorizedCourseDisplayContentsIfReady(courses
      .map(course=>course.courseId).filter(id=>typeof id==="string"&&/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)));
  }catch{
    // Optional display metadata must not hide authenticated course cards.
    displayLoadFailed=true;
    displays=new Map();
  }
  // Each delivery fails independently; one corrupt or temporarily unavailable
  // course must never hide the learner's remaining course cards.
  const seenDeliveries = new Set<string>();
  const seenMappings = new Set<string>();
  const rows: LearnerCourseListRow[] = await mapLearnerCourseCardsLimited(
    courses, async (course, index) => {
      const mappingKey=[course.courseId,course.academicPeriodId,course.sectionCode].join(":");
      const duplicate=seenDeliveries.has(course.deliveryId)||seenMappings.has(mappingKey);
      seenDeliveries.add(course.deliveryId);seenMappings.add(mappingKey);
      const baseCourse = {
        deliveryId: duplicate || !course.deliveryId ? "unavailable-" + index : course.deliveryId,
        courseId: course.courseId,
        courseName: course.courseName || "Course name unavailable",
        courseCode: course.courseCode,
        courseDescription: course.courseDescription,
        courseEnabled:course.courseEnabled,
        courseStatus:course.courseStatus,
        courseAllowedForDisplay:course.courseAllowedForDisplay,
        offeringType: course.offeringType,
        credits: course.credits,
        sectionName: course.sectionName,
        sectionCode: course.sectionCode,
        cohortName: course.cohortName,
        academicPeriodId: course.academicPeriodId,
        academicPeriodName: course.academicPeriodName,
        programName: course.programName,
        programCode: course.programCode,
        periodStartDate: course.periodStartDate,
        periodEndDate: course.periodEndDate,
      };
      const unavailable = (label: string): LearnerCourseListRow => ({
        course: baseCourse,
        thumbnailUrl: null,
        instructorNames: [],
        summary: {overallPercent: null, itemsCompleted: 0, itemsTotal: 0},
        lastActivity: null,
        nextDue: null,
        readOnly: true,
        learningPathReady: false,
        nextItem: null,
        unavailable: true,
        unavailableLabel: label,
      });
      if (duplicate) return unavailable("Duplicate course mapping " + (index + 1));
      if (!course.deliveryId || !course.courseId || !course.academicPeriodId ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(course.deliveryId)) {
        return unavailable("Invalid course record " + (index + 1));
      }
      const historical=Boolean(course.deliveryEndedAt)||
       course.courseStatus!=="ACTIVE"||!course.courseEnabled||
       course.courseAllowedForDisplay===0||
       course.sectionEnrollmentStatus!=="ACTIVE"||
       course.programEnrollmentStatus!=="ACTIVE"||
       course.periodStatus==="CLOSED";
      // Legacy renders historic cards for reference, without loading their
      // entire lesson and assessment trees or authorizing a click.
      // Limit expensive dashboard expansion to a single active 48-card page.
      if(historical||index>=48){
       return {
        ...unavailable(""),unavailable:false,
        thumbnailUrl:displays.get(course.courseId)?.thumbnailUrl??null,
        readOnly:historical,learningPathReady:Boolean(course.learningPathId),
       };
      }
      try {
        const [workspace, instructors] = await Promise.all([
          getLearnerCourseWorkspace(context, course.deliveryId),
          listLearnerCourseInstructors(context, course.deliveryId),
        ]);
        const signals = learnerCourseListSignals(
          workspace.lessons, workspace.summary, new Date(workspace.snapshotNowMs),
        );
        return {
          thumbnailUrl: displays.get(course.courseId)?.thumbnailUrl ?? null,
          lastActivity: signals.lastActivity,
          overdueAssignments: signals.overdueAssignments,
          firstOverdue: selectLearnerOverdueAssignment(workspace.lessons,workspace.snapshotNowMs),
          nextDue: signals.nextDue,
          course: baseCourse,
          instructorNames: learnerCourseInstructorLabels(instructors),
          summary: {
            overallPercent: signals.percentage,
            itemsCompleted: workspace.summary.itemsCompleted,
            itemsTotal: workspace.summary.itemsTotal,
          },
          readOnly:
            course.courseStatus!=="ACTIVE"||!course.courseEnabled||
            course.courseAllowedForDisplay===0||
            Boolean(course.deliveryEndedAt) ||
            course.sectionEnrollmentStatus !== "ACTIVE" ||
            course.programEnrollmentStatus !== "ACTIVE" ||
            course.periodStatus === "CLOSED",
          learningPathReady: workspace.learningPath !== null,
          nextItem: workspace.nextItem
            ? {
                lessonId: workspace.nextItem.lessonId,
                lessonName: workspace.nextItem.lessonName,
                kind: workspace.nextItem.kind,
                itemId: workspace.nextItem.itemId,
                title: workspace.nextItem.title,
              }
            : null,
        };
      } catch {
        // Never show internal access, database or content-fetch errors to learners.
        return unavailable("Course temporarily unavailable");
      }
    }, 4,
  );

  const [setupStatus,semesterResult]=await Promise.all([
    rows.length===0&&directoryError===null
      ?getLearnerCourseSetupStatus(context).catch(()=>null):Promise.resolve(null),
    listLearnerProgramSemesters(context)
      .then(value=>({semesters:value,error:null as "LOAD_FAILED"|null}))
      .catch(()=>({semesters:[],error:"LOAD_FAILED" as const})),
  ]);
  const programSemesters=semesterResult.semesters;
  const malformedCount=rows.filter(row=>row.unavailable&&
    /^(?:Invalid course record|Duplicate course mapping)/.test(row.unavailableLabel??"")).length;
  const invalidCredits=courses.filter(course=>course.credits!==null&&
    (!Number.isFinite(course.credits)||course.credits<0)).length;
  return (
    <div className="min-w-0 max-w-full space-y-[16px]">
      <PageHeader title="Courses" />
      {malformedCount>0?<Alert tone="warning" role="alert" title="Some course records need attention">
        {malformedCount} course mapping{malformedCount===1?" is":"s are"} missing required data. Your other courses are still available. Contact your administrator.
      </Alert>:null}
      {invalidCredits>0?<Alert tone="warning" role="alert" title="Some credits could not be counted">
        {invalidCredits} course credit value{invalidCredits===1?" is":"s are"} invalid. Please contact your administrator.
      </Alert>:null}
      {displayLoadFailed?<Alert tone="warning" role="status">
        Course images could not be refreshed. Course details remain available.
      </Alert>:null}
      {directoryError?<Alert tone="error" role="alert">
       {directoryError} <Link href="/learn/courses" className="inline-flex min-h-11 items-center font-semibold underline md:min-h-9">Try again</Link>
      </Alert>:<LearnerCourseList rows={rows} setupStatus={setupStatus} programSemesters={programSemesters}
       semestersLoadError={semesterResult.error} />}
      {/* A failed authorized directory request is not a confirmed empty list. */}
    </div>
  );
}
