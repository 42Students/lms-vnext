import { notFound } from "next/navigation";
import { courseSectionDeliveryIdSchema } from "@/modules/courses/validation";
import { hidesFacultyCourseRouteError } from "@/modules/courses/faculty-course-route-errors";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseWorkspace } from "@/components/courses/faculty-course-workspace";
import {
  getFacultyCourseWorkspace,
} from "@/modules/courses/faculty-course-service";
import {
  getFacultyCourseHomeSignals,
} from "@/modules/courses/faculty-course-home-service";
import {
  loadCourseDisplayContentIfReady,
} from "@/modules/courses/course-display-service";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";

export default async function FacultyCoursePage({
  params,
}: {
  params: Promise<{
    deliveryId: string;
  }>;
}) {
  const context =
    await getCurrentRequestContext();
  const { deliveryId } = await params;
  if (!courseSectionDeliveryIdSchema.safeParse(deliveryId).success) notFound();
  let workspace: Awaited<ReturnType<typeof getFacultyCourseWorkspace>>;
  try {
    workspace = await getFacultyCourseWorkspace(context, deliveryId);
  } catch (error) {
    if (hidesFacultyCourseRouteError(error)) notFound();
    throw error;
  }
  const [homeSignals, display] =
    await Promise.all([
      getFacultyCourseHomeSignals(
        context,
        workspace,
      ),
      loadCourseDisplayContentIfReady(
        workspace.course.courseId,
      ),
    ]);

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <nav aria-label="Course navigation" className="flex min-w-0 flex-col gap-2 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
        <TextLink variant="bare"
          href="/teach/courses"
          className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-[var(--lms-teal-deep)] hover:text-primary-hover focus-ring"
        >
          ← My Teaching Courses
        </TextLink>
        <Disclosure title="Course shortcuts" className="min-w-0">
          <div className="flex min-w-0 flex-col gap-1 pb-2 md:flex-row md:flex-wrap md:gap-3">
          <TextLink
            href={`/teacher/courses/${deliveryId}/students`}
            className="inline-flex min-h-11 items-center px-2 text-sm md:min-h-9"
          >
            Students
          </TextLink>
          <ButtonLink variant="secondary"
            href={`/teacher/courses/${deliveryId}/attendanceDetail`}
          >
            Attendance
          </ButtonLink>
          <ButtonLink variant="secondary"
            href={`/teacher/courses/${deliveryId}/discussions`}
          >
            Discussions
          </ButtonLink>
          </div>
        </Disclosure>
      </nav>
      <FacultyCourseWorkspace
        workspace={workspace}
        homeSignals={homeSignals}
        display={display}
      />
    </div>
  );
}
