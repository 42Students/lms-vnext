import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { z } from "zod";
import {
  AdminAttendanceWorkspace,
  type AdminAttendanceWorkspaceData,
} from "@/components/attendance/admin-attendance-workspace";
import { PageHeader } from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
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
    return <ErrorState title="Choose a college to view attendance" description="Select an active college in your scope switcher, then try again." action={<Link href="/college" className="font-semibold text-primary-text underline">Return to college dashboard</Link>}/>;
  }
  const parsed = z.object({
    deliveryId: z.uuid().optional(),
    sectionId: z.uuid().optional(),
    courseId: z.uuid().optional(),
    allCourses: z.enum(["1"]).optional(),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  }).safeParse(await searchParams);
  if (!parsed.success) return <ErrorState title="Unable to load attendance" description="These attendance filters are not valid. Clear them and choose a class, course and month again." action={<Link href="/college/attendance" className="font-semibold text-primary-text underline">Reset attendance filters</Link>}/>;
  const query=parsed.data;
  const month = query.month ?? currentMonth();
  const options = await getAdminAttendanceOptions(context, collegeId);
  const requestedDelivery = options.deliveries.find(
    (entry) => entry.deliveryId === query.deliveryId,
  );
  const selectedSectionId =
    query.sectionId ?? requestedDelivery?.sectionId ?? null;
  const selectedCourseId =
    query.courseId ?? requestedDelivery?.courseId ?? null;
  // The selected delivery takes precedence over a same-course offering in
  // another academic period. Never silently show a different term's records.
  const delivery = options.deliveries.find(
    (entry)=>entry.deliveryId===query.deliveryId &&
      entry.sectionId===selectedSectionId && entry.courseId===selectedCourseId,
  ) ?? options.deliveries.find(
    (entry) => entry.sectionId === selectedSectionId &&
      entry.courseId === selectedCourseId,
  ) ?? null;
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
        eyebrow="College Admin · Academics"
        title="Attendance"
        description={`College-wide attendance oversight for ${options.college.name}, including unmarked sessions and admin corrections.`}
        actions={
          <div className="flex flex-wrap gap-3">
          <Link href="/college/attendance/departments"
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
            Attendance by Department
          </Link>
          <Link
            href="/college/attendance/corrections"
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
            Correction windows
          </Link>
          <Link
            href="/college/attendance/settings"
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle"
          >
            Attendance policy
          </Link>
          </div>
        }
      />
      <AdminAttendanceWorkspace
        data={data}
        basePath="/college/attendance"
      />
    </div>
  );
}
