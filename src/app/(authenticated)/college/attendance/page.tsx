import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { z } from "zod";
import {
  AdminAttendanceWorkspace,
  type AdminAttendanceWorkspaceData,
} from "@/components/attendance/admin-attendance-workspace";
import { PageHeader } from "@/components/ui/page-header";
import {getCollegeAttendancePolicy} from "@/modules/attendance/policy-service";
import {AttendancePolicySummaryCard} from "@/components/attendance/attendance-policy-summary-card";
import { Tabs } from "@/components/ui/tabs";
import {ErrorState} from "@/components/ui/error-state";
import {Banner} from "@/components/ui/banner";
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
    return <div className="min-w-0 space-y-6">
      <PageHeader title="Attendance" />
      <Banner tone="warning">
        <strong>Admin not assigned to a college</strong>
        <p>You must be assigned to a college to review monthly attendance. Contact your administrator.</p>
      </Banner>
    </div>;
  }
  const parsed = z.object({
    deliveryId: z.uuid().optional(),
    sectionId: z.uuid().optional(),
    courseId: z.uuid().optional(),
    allCourses: z.enum(["1"]).optional(),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  }).safeParse(await searchParams);
  if (!parsed.success) return <div className="min-w-0 space-y-6"><PageHeader title="Attendance" /><ErrorState title="Unable to load attendance" description="These attendance filters are not valid. Clear them and choose a class, course and month again." action={<Link href="/college/attendance" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-[650] text-[var(--lms-body-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto justify-center px-4">Reset attendance filters</Link>}/></div>;
  const query=parsed.data;
  const month = query.month ?? currentMonth();
  const optionsResult = await Promise.allSettled([getAdminAttendanceOptions(context, collegeId)]);
  if (optionsResult[0].status === "rejected") {
    return <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader title="Attendance" />
      <ErrorState title="Couldn't load classes/courses for this college"
        description="Attendance options are unavailable. Your chosen month and filters are preserved."
        action={<Link href={"/college/attendance?" + new URLSearchParams(Object.entries(query).filter((entry): entry is [string,string] => typeof entry[1] === "string")).toString()}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>} />
    </div>;
  }
  const options = optionsResult[0].value;
  const policyRead=await getCollegeAttendancePolicy(context,collegeId)
    .then(value=>({ok:true as const,hasOverride:value.hasCollegeOverride,maxCorrectionHours:value.maxCorrectionHours}))
    .catch(()=>({ok:false as const}));
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
  const gridResult = delivery
    ? await Promise.allSettled([getAdminAttendanceGrid(context, {
        collegeId,
        deliveryId: delivery.deliveryId,
        month,
      })])
    : null;
  const grid = gridResult?.[0].status === "fulfilled" ? gridResult[0].value : null;
  const gridFailed = gridResult?.[0].status === "rejected";

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
    <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
      <PageHeader
        title="Attendance"
        description="Review monthly attendance by class and course, correct recent records, and export the same grid shown on screen."
      />
      <Tabs
        ariaLabel="Attendance views"
        renderPanel={false}
        value="/college/attendance"
        items={[
          { value: "/college/attendance", label: "Overview", href: "/college/attendance" },
          { value: "/college/attendance/departments", label: "Attendance by Department", href: "/college/attendance/departments" },
          { value: "/college/attendance/corrections", label: "Correction windows", href: "/college/attendance/corrections" },
          { value: "/college/attendance/settings", label: "Attendance policy", href: "/college/attendance/settings" },
        ]}
      />
      <AttendancePolicySummaryCard
        correctionWindowHours={options.policy.correctionWindowHours}
        eligibilityThresholdPercent={options.policy.eligibilityThresholdPercent}
        hasCollegeOverride={policyRead.ok?policyRead.hasOverride:null}
        retryHref="/college/attendance"
        settingsHref="/college/attendance/settings"/>
      {gridFailed ? <ErrorState title="Unable to load monthly attendance"
        description="The attendance grid could not be refreshed. Retry with the same filters."
        action={<Link href={"/college/attendance?" + new URLSearchParams(Object.entries(query).filter((entry): entry is [string,string] => typeof entry[1] === "string")).toString()}
          className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>} /> : null}
      <AdminAttendanceWorkspace
        data={data}
        basePath="/college/attendance"
      />
    </div>
  );
}
