import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { z } from "zod";
import {
  AdminAttendanceWorkspace,
  type AdminAttendanceWorkspaceData,
} from "@/components/attendance/admin-attendance-workspace";
import { PageHeader } from "@/components/ui/page-header";
import {
  getAdminAttendanceGrid,
  getAdminAttendanceOptions,
} from "@/modules/attendance/admin-service";

function currentMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

export default async function CollegeAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    deliveryId?: string;
    sectionId?: string;
    courseId?: string;
    allCourses?: string;
    month?: string;
  }>;
}) {
  const context = await getCurrentRequestContext();
  const collegeId =
    context.membership?.collegeId ??
    (isSuperAdmin(context) ? context.adminScope?.collegeId : null);
  if (!collegeId) {
    throw new Error("Select an active college to view attendance.");
  }
  const query = z.object({
    deliveryId: z.uuid().optional(),
    sectionId: z.uuid().optional(),
    courseId: z.uuid().optional(),
    allCourses: z.enum(["1"]).optional(),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  }).parse(await searchParams);
  const month = query.month ?? currentMonth();
  const options = await getAdminAttendanceOptions(context, collegeId);
  const requestedDelivery = options.deliveries.find(
    (entry) => entry.deliveryId === query.deliveryId,
  );
  const selectedSectionId =
    query.sectionId ?? requestedDelivery?.sectionId ?? null;
  const selectedCourseId =
    query.courseId ?? requestedDelivery?.courseId ?? null;
  const delivery = options.deliveries.find(
    (entry) => entry.sectionId === selectedSectionId &&
      entry.courseId === selectedCourseId,
  ) ?? requestedDelivery ?? null;
  const grid = delivery
    ? await getAdminAttendanceGrid(context, {
        collegeId,
        deliveryId: delivery.deliveryId,
        month,
      })
    : null;

  const data: AdminAttendanceWorkspaceData = {
    collegeId,
    collegeName: options.college.name,
    policy: options.policy,
    deliveries: options.deliveries,
    courses: options.courses,
    selectedSectionId,
    selectedCourseId,
    showAllCourses: query.allCourses === "1",
    selectedDeliveryId: delivery?.deliveryId ?? null,
    month,
    grid: grid
      ? {
          delivery: grid.delivery,
          roster: grid.roster,
          sessions: grid.sessions.map(
            (session) => ({
              ...session,
              startsAt:
                session.startsAt.toISOString(),
              endsAt:
                session.endsAt.toISOString(),
              attendanceMarkedAt:
                session.attendanceMarkedAt?.toISOString() ??
                null,
            }),
          ),
          records: grid.records.map(
            (record) => ({
              ...record,
              markedAt:
                record.markedAt.toISOString(),
            }),
          ),
        }
      : null,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin · Academics"
        title="Attendance"
        description={`College-wide attendance oversight for ${options.college.name}, including unmarked sessions and admin corrections.`}
      />
      <AdminAttendanceWorkspace
        data={data}
        basePath="/college/attendance"
      />
    </div>
  );
}
