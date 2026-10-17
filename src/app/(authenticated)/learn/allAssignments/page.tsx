import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerAssessmentOverview,
  type LearnerAssignmentOverviewItem,
} from "@/components/courses/learner-assessment-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";

export default async function LearnerAssignmentsPage() {
  const context =
    await getCurrentRequestContext();
  const overview =
    await getLearnerAssessmentOverview(
      context,
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
    <div className="space-y-6">
      <PageHeader
        title="All Assignments"
      />
      <LearnerAssessmentOverview
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
