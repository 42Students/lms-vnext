import { getCurrentRequestContext } from "@/auth/request-context";
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
    month?: string;
  }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) {
    throw new Error("College attendance requires an active membership.");
  }
  const query = await searchParams;
  const month = query.month || currentMonth();
  const collegeId = context.membership.collegeId;
  const options =
    await getAdminAttendanceOptions(
      context,
      collegeId,
    );
  const grid = query.deliveryId
    ? await getAdminAttendanceGrid(context, {
        collegeId,
        deliveryId: query.deliveryId,
        month,
      })
    : null;

  const data: AdminAttendanceWorkspaceData = {
    collegeId,
    collegeName: options.college.name,
    policy: options.policy,
    deliveries: options.deliveries,
    selectedDeliveryId:
      query.deliveryId ?? null,
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
