import { getCurrentRequestContext } from "@/auth/request-context";
import Link from "next/link";
import {ErrorState} from "@/components/ui/error-state";
import {
  AdminAttendanceWorkspace,
  type AdminAttendanceWorkspaceData,
} from "@/components/attendance/admin-attendance-workspace";
import { Alert } from "@/components/ui/alert";
import { SuperAdminAttendanceSettingsEditor } from "@/components/admin/super-admin-attendance-settings-editor";
import { PageHeader } from "@/components/ui/page-header";
import { Disclosure } from "@/components/ui/disclosure";
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
    return <div className="min-w-0">
      <Alert tone="warning" title="Select a college to continue" role="alert">
        <span className="inline-flex items-start gap-2">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5m0 3h.01" /></svg>
          Choose a college in the header above to see its attendance.
        </span>
      </Alert>
    </div>;
  }

  const query = await searchParams;
  const month = query.month || currentMonth();
  // UX-admin-attendance-01: reject hostile/stale month links before the
  // data service's strict India-month parser can throw an unhandled error.
  if(typeof month!=="string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)){
    return <div className="min-w-0 space-y-6">
      <PageHeader title="Attendance" description="Attendance oversight for the selected college."/>
      <ErrorState title="Invalid attendance month"
        description="Choose a month in YYYY-MM format and retry."
        action={<Link href="/admin/attendance" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white w-full md:w-auto justify-center">Reset month filter</Link>}/>
    </div>;
  }
  const optionsResult=await getAdminAttendanceOptions(context,collegeId)
    .then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const}));
  if(!optionsResult.ok)return <div className="min-w-0 space-y-4">
    <PageHeader title="Attendance"
      description="Review monthly attendance by class and course, correct recent records and check the minimum attendance policy."/>
    <ErrorState title="Could not load attendance options"
     description="Class and course choices are temporarily unavailable. No attendance has been changed."
     action={<Link href="/admin/attendance" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry class courses</Link>}/>
   </div>;
  const options=optionsResult.value;
  const requestedDelivery = options.deliveries.find(
    (entry) => entry.deliveryId === query.deliveryId,
  );
  const selectedSectionId =
    query.sectionId ?? requestedDelivery?.sectionId ?? null;
  const selectedCourseId =
    query.courseId ?? requestedDelivery?.courseId ?? null;
  const delivery =
    options.deliveries.find(
      entry => entry.deliveryId === query.deliveryId &&
        entry.sectionId === selectedSectionId && entry.courseId === selectedCourseId,
    ) ?? options.deliveries.find(
      entry => entry.sectionId === selectedSectionId && entry.courseId === selectedCourseId,
    ) ?? null;
  const gridResult=delivery
    ? await getAdminAttendanceGrid(context,{
        collegeId,deliveryId:delivery.deliveryId,month,
      }).then(value=>({ok:true as const,value}))
       .catch(()=>({ok:false as const}))
    :null;
  const grid=gridResult?.ok?gridResult.value:null;

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
        description="Review monthly attendance by class and course, correct recent records, and export the same grid shown on screen."
      />
      <section aria-label="Attendance policy" className="space-y-2 border-b border-border pb-4">
        <h2 className="font-semibold text-foreground">Attendance policy</h2>
        <p className="text-sm text-body">Late marking allowed for
          <strong>{" "+options.policy.correctionWindowHours+" hours"}</strong>
          {" · "}Minimum attendance
          <strong>{" "+options.policy.eligibilityThresholdPercent+"%"}</strong>
        </p>
        <Disclosure title="Edit attendance policy" defaultOpen
          className="min-w-0" contentClassName="pb-[var(--lms-space-4)]">
          <SuperAdminAttendanceSettingsEditor collegeId={collegeId}
            correctionWindowHours={options.policy.correctionWindowHours}
            eligibilityThresholdPercent={options.policy.eligibilityThresholdPercent}/>
        </Disclosure>
      </section>
      {gridResult&&!gridResult.ok?<ErrorState title="Could not load attendance"
        description="The class and course choices remain available. Retry loading this month's records."
        action={<Link href="/admin/attendance" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry class courses</Link>}/>:null}
      <AdminAttendanceWorkspace data={data} basePath="/admin/attendance"/>
    </div>
  );
}
