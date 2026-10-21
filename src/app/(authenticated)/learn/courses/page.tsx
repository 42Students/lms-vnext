import { getCurrentRequestContext } from "@/auth/request-context";
import Link from "next/link";
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

export default async function LearnerCoursesPage() {
  const context = await getCurrentRequestContext();
  let directoryError:string|null=null;
  const courses=await listLearnerCourseDeliveries(context,{includeHistorical:true})
   .catch(error=>{
    directoryError=error instanceof Error&&/ACCESS_DENIED|PERMISSION|AUTH|403/i.test(error.message)
     ?"You do not have permission to view these courses."
     :"Failed to load courses. Please try again.";
    return [];
   });

  let displays=new Map<string,{thumbnailUrl:string|null}>();
  try{
    displays=await loadAuthorizedCourseDisplayContentsIfReady(courses
      .map(course=>course.courseId).filter(id=>typeof id==="string"&&/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)));
  }catch{
    // Optional display metadata must not hide authenticated course cards.
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
  return (
    <div className="min-w-0 max-w-full space-y-[16px]">
      <PageHeader title="Courses" />
      {directoryError?<Alert tone="error" role="alert">
       {directoryError} <Link href="/learn/courses" className="inline-flex min-h-11 items-center font-semibold underline md:min-h-9">Try again</Link>
      </Alert>:<LearnerCourseList rows={rows} setupStatus={setupStatus} programSemesters={programSemesters}
       semestersLoadError={semesterResult.error} />}
      {/* A failed authorized directory request is not a confirmed empty list. */}
    </div>
  );
}
