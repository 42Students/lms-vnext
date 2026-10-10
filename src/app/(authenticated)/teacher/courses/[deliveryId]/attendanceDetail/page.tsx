import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  FacultyAttendanceWorkspace,
  type FacultyAttendanceWorkspaceData,
} from "@/components/attendance/faculty-attendance-workspace";
import { getFacultyAttendanceWorkspace } from "@/modules/attendance/faculty-service";

export default async function FacultyCourseAttendancePage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { deliveryId } = await params;
  const data =
    await getFacultyAttendanceWorkspace(
      context,
      deliveryId,
    );

  const workspace: FacultyAttendanceWorkspaceData = {
    course: {
      deliveryId: data.course.deliveryId,
      courseName: data.course.courseName,
      courseCode: data.course.courseCode,
      sectionName: data.course.sectionName,
      sectionCode: data.course.sectionCode,
      academicPeriodName:
        data.course.academicPeriodName,
    },
    policy: data.policy,
    roster: data.roster,
    sessions: data.sessions.map((session) => ({
      ...session,
      startsAt: session.startsAt.toISOString(),
      endsAt: session.endsAt.toISOString(),
      markedAt:
        session.markedAt?.toISOString() ?? null,
    })),
    records: data.records.map((record) => ({
      ...record,
      markedAt: record.markedAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-5">
      <Link
        href={`/teach/courses/${deliveryId}`}
        className="inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
      >
        ← Course workspace
      </Link>
      <FacultyAttendanceWorkspace
        workspace={workspace}
      />
    </div>
  );
}
