import { getCurrentRequestContext } from "@/auth/request-context";
import Link from "next/link";
import {ErrorState} from "@/components/ui/error-state";
import {
  AdminAttendanceWorkspace,
  type AdminAttendanceWorkspaceData,
} from "@/components/attendance/admin-attendance-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import { SuperAdminAttendanceSettingsEditor } from "@/components/admin/super-admin-attendance-settings-editor";
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
    sectionId?: string;
    courseId?: string;
    allCourses?: string;
    month?: string;
  }>;
}) {
  const context = await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader
          
          title="Attendance"
          description="Attendance oversight requires an exact college safety scope."
        />
        <EmptyState
          title="Select a college to continue"
          description="Choose a college in the header above to see its attendance."
        />
      </div>
    );
  }

  const query = await searchParams;
  const month = query.month || currentMonth();
  // UX-admin-attendance-01: reject hostile/stale month links before the
  // data service's strict India-month parser can throw an unhandled error.
  if(typeof month!=="string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)){
    return <div className="min-w-0 space-y-5">
      <PageHeader title="Attendance" description="Attendance oversight for the selected college."/>
      <ErrorState title="Invalid attendance month"
        description="Choose a month in YYYY-MM format and retry."
        action={<Link href="/admin/attendance" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 font-semibold text-primary-text hover:bg-primary-subtle">Reset month filter</Link>}/>
    </div>;
  }
  const options =
    await getAdminAttendanceOptions(
      context,
      collegeId,
    );
  const requestedDelivery = options.deliveries.find(
    (entry) => entry.deliveryId === query.deliveryId,
  );
  const selectedSectionId =
    query.sectionId ?? requestedDelivery?.sectionId ?? null;
  const selectedCourseId =
    query.courseId ?? requestedDelivery?.courseId ?? null;
  const delivery =
    options.deliveries.find(
      (entry) =>
        entry.sectionId === selectedSectionId &&
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
    <div className="min-w-0 space-y-6">
      <PageHeader
        
        title="Attendance"
        description={`Scoped attendance oversight for ${options.college.name}.`}
      />
      <SuperAdminAttendanceSettingsEditor collegeId={collegeId}
        correctionWindowHours={options.policy.correctionWindowHours}
        eligibilityThresholdPercent={options.policy.eligibilityThresholdPercent} />
      <AdminAttendanceWorkspace
        data={data}
        basePath="/admin/attendance"
      />
    </div>
  );
}
