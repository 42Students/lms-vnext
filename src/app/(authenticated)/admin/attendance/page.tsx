import { getCurrentRequestContext } from "@/auth/request-context";
import {
  AdminAttendanceWorkspace,
  type AdminAttendanceWorkspaceData,
} from "@/components/attendance/admin-attendance-workspace";
import { EmptyState } from "@/components/ui/empty-state";
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

export default async function SuperAdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    deliveryId?: string;
    month?: string;
  }>;
}) {
  const context = await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin · Academics"
          title="Attendance"
          description="Attendance oversight requires an exact college safety scope."
        />
        <EmptyState
          title="Select a college scope"
          description="Choose a college in the Super Admin scope selector before reviewing or correcting attendance."
        />
      </div>
    );
  }

  const query = await searchParams;
  const month = query.month || currentMonth();
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
        eyebrow="Super Admin · Academics"
        title="Attendance"
        description={`Scoped attendance oversight for ${options.college.name}.`}
      />
      <AdminAttendanceWorkspace
        data={data}
        basePath="/admin/attendance"
      />
    </div>
  );
}
