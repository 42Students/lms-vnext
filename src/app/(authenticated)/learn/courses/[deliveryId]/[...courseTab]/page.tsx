import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCourseAttendance } from "@/components/courses/learner-course-attendance";
import { LearnerCourseDiscussion } from "@/components/courses/learner-course-discussion";
import { LearnerCourseOverview } from "@/components/courses/learner-course-overview";
import { LearnerCourseTabs, learnerCourseTabs } from "@/components/courses/learner-course-tabs";
import { LearnerCourseWorkspace } from "@/components/courses/learner-course-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerAttendanceWorkspace } from "@/modules/attendance/learner-service";
import { listCourseDiscussionMessages } from "@/modules/courses/discussion-service";
import { loadCourseDisplayContentIfReady } from "@/modules/courses/course-display-service";
import {
  getLearnerCourseWorkspace,
  listLearnerCourseDeliveries,
  listLearnerCourseInstructors,
} from "@/modules/courses/learner-course-service";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LearnerCourseTabPage({
  params,
  searchParams,
}: {
  params: Promise<{
    deliveryId: string;
    courseTab: string[];
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { deliveryId, courseTab } = await params;
  const query = await searchParams;
  const activeTab = courseTab[0] ?? "home";

  if (!learnerCourseTabs.some((tab) => tab.path === activeTab)) {
    notFound();
  }

  const context = await getCurrentRequestContext();
  const [workspace, deliveries, instructors] = await Promise.all([
    getLearnerCourseWorkspace(context, deliveryId),
    listLearnerCourseDeliveries(
      context,
      { includeHistorical: true },
    ),
    listLearnerCourseInstructors(context, deliveryId),
  ]);

  const courseMeta = deliveries.find(
    (delivery) => delivery.deliveryId === deliveryId,
  );

  if (!courseMeta) {
    notFound();
  }

  const readOnly =
    Boolean(courseMeta.deliveryEndedAt) ||
    courseMeta.sectionEnrollmentStatus !== "ACTIVE" ||
    courseMeta.programEnrollmentStatus !== "ACTIVE" ||
    courseMeta.periodStatus === "CLOSED";

  let content: ReactNode;

  if (activeTab === "home") {
    const [discussion, display] =
      await Promise.all([
        listCourseDiscussionMessages(
          context,
          deliveryId,
        ),
        loadCourseDisplayContentIfReady(
          workspace.course.id,
        ),
      ]);
    const courseUpdates = discussion.messages
      .filter((message) => message.senderRole !== "LEARNER")
      .sort((left, right) => {
        if (left.pinned !== right.pinned) {
          return left.pinned ? -1 : 1;
        }
        return right.createdAt.getTime() - left.createdAt.getTime();
      });

    content = (
      <LearnerCourseOverview
        deliveryId={deliveryId}
        workspace={workspace}
        meta={{
          courseDescription: courseMeta.courseDescription,
          introductionText:
            display?.introductionText ?? null,
          bodyHtml:
            display?.bodyHtml ?? null,
          takeaways:
            display?.takeaways ?? [],
          offeringType: courseMeta.offeringType,
          credits: courseMeta.credits,
          sectionName: courseMeta.sectionName,
          sectionCode: courseMeta.sectionCode,
          academicPeriodName: courseMeta.academicPeriodName,
          instructors,
        }}
        readOnly={readOnly}
        courseUpdates={courseUpdates}
      />
    );
  } else if (activeTab === "roadmap") {
    content = (
      <LearnerCourseWorkspace
        deliveryId={deliveryId}
        workspace={workspace}
        filter={first(query.filter) ?? "all"}
        focusLessonId={first(query.lesson) ?? null}
        focusContentId={first(query.content) ?? null}
        readOnly={readOnly}
      />
    );
  } else if (activeTab === "attendanceDetail") {
    const attendance = await getLearnerAttendanceWorkspace(
      context,
      { includeHistorical: true },
    );
    content = (
      <LearnerCourseAttendance
        deliveryId={deliveryId}
        workspace={attendance}
      />
    );
  } else {
    content = <LearnerCourseDiscussion deliveryId={deliveryId} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={workspace.course.code}
        title={workspace.course.name}
        description={readOnly ? "Past semester course · Read only" : "Course workspace"}
        actions={
          <Link
            href="/learn/courses"
            className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
          >
            Back to Courses
          </Link>
        }
      />
      <LearnerCourseTabs
        deliveryId={deliveryId}
        activeTab={activeTab}
      />
      {content}
    </div>
  );
}
