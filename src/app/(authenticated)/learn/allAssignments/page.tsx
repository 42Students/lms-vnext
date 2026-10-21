import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerAssessmentOverview,
  type LearnerAssignmentOverviewItem,
} from "@/components/courses/learner-assessment-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";

export default async function LearnerAssignmentsPage({searchParams}:{searchParams:Promise<{course?:string|string[]}>}) {
  const [context,query] = await Promise.all([getCurrentRequestContext(),searchParams]);
  const overview =
    await getLearnerAssessmentOverview(
      context,{courseId:query.course},
    );

  const items: LearnerAssignmentOverviewItem[] =
    overview.assignments.map(
      (assignment) => ({
        kind: "ASSIGNMENT",
        id: assignment.id,
        deliveryId:
          assignment.deliveryId,
        courseId: assignment.courseId,
        courseName:
          assignment.courseName,
        courseCode:
          assignment.courseCode,
        lessonId:
          assignment.lessonId,
        lessonName:
          assignment.lessonName,
        title: assignment.title,
        description:
          assignment.description,
        dueAt:
          assignment.dueAt?.toISOString() ??
          null,
        createdAt:
          assignment.createdAt.toISOString(),
        maxPoints: assignment.maxPoints,
        submissionId:
          assignment.submissionId,
        submissionType:
          assignment.submissionType,
        submissionText:
          assignment.submissionText,
        submissionUrl:
          assignment.submissionUrl,
        // Additional repository/website links and files are loaded inside
        // the authenticated assignment drawer using the persisted submission ID.
        // The first submissionType is not the full multipart history.
        submissionReadUnavailable:false,
        submittedAt:
          assignment.submittedAt?.toISOString() ??
          null,
        gradePublished:
          assignment.gradePublished,
        pointsAwarded:
          assignment.pointsAwarded,
        feedback:
          assignment.feedback,
      }),
    );

  return (
    <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
      <PageHeader
        title="All Assignments"
      />
      <LearnerAssessmentOverview
        key={overview.selectedCourseId??"all"}
        initialCourseId={overview.selectedCourseId??""}
        fileUploadsEnabled={assignmentFilesRuntimeEnabled()}
        courses={overview.courses}
        classScope={overview.classScope}
        items={items}
        kind="ASSIGNMENT"
        snapshotNowMs={overview.snapshotNowMs}
      />
    </div>
  );
}
