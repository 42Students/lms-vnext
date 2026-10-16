import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
import { CollegeDashboardCards } from "@/components/admin/college-dashboard-cards";
import { CollegeAdminQuickActions } from "@/components/admin/admin-dashboard-actions";
import { getCollegeDashboardCards } from "@/modules/admin-ui/college-dashboard-cards-service";
import { getCollegeDashboardAttendance } from "@/modules/admin-ui/college-dashboard-attendance-service";
import { getCollegeDashboardLowAttendance } from "@/modules/admin-ui/college-dashboard-risk-service";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listColleges } from "@/modules/colleges/service";
import { formatCollegeHeaderDate } from "@/modules/admin-ui/college-dashboard-cards-model";
import { COLLEGE_LEGACY_PAGE_TITLES } from "@/modules/people/college-page-title-model";

export default async function CollegeOverviewPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;

  if (!membership) {
    redirect("/dashboard");
  }

  const colleges = await listColleges(
    context,
    membership.organizationId,
  );
  const college = colleges.find((item) => item.id === membership.collegeId);

  if (!college) {
    return (
      <EmptyState
        title="College unavailable"
        description="Your active membership no longer resolves to an active college."
      />
    );
  }

  const [dashboard, attendance, lowAttendance] = await Promise.all([
    getCollegeDashboardCards(context, {}),
    getCollegeDashboardAttendance(context),
    getCollegeDashboardLowAttendance(context),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={COLLEGE_LEGACY_PAGE_TITLES.dashboard}
        description={`${college.name} · ${formatCollegeHeaderDate(new Date())}`}
        actions={
          <>
            <Link href="/college/contacts"
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle">
              Contacts
            </Link>
            <Link href="/college/announcements"
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle">
              Announcements
            </Link>
            <Link href="/college/verification"
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle">
              Verification
            </Link>
            <Link
              href="/college/branding"
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
            >
              Branding
            </Link>
            <CollegeEditDialog
              college={college}
              triggerLabel="Edit college"
            />
          </>
        }
      />
      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Code
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {college.code}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            City
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {college.city || "—"}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            State
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {college.state || "—"}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Country
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {college.country || "—"}
          </p>
        </div>
      </section>
      <CollegeDashboardCards cards={dashboard.cards} />
      <section aria-label="Today" className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Today</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Classes scheduled today", value: attendance.today.scheduled },
            { label: "Held so far", value: attendance.today.held },
            { label: "With attendance taken", value: attendance.today.marked },
          ].map(item => <div key={item.label}
            className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-primary-text">
              {item.value.toLocaleString("en-IN")}
            </p>
          </div>)}
        </div>
      </section>
      <section aria-label="Attendance not taken" className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Attendance not taken</h2>
            <p className="text-sm text-muted-foreground">
              {attendance.unattendedCount} held session(s) in the last 7 days without marked attendance.
            </p>
          </div>
          <Link href="/college/attendance"
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Open attendance
          </Link>
        </div>
        {attendance.unattended.length === 0
          ? <p className="text-sm text-muted-foreground">All held sessions have attendance recorded.</p>
          : <ul className="divide-y divide-border">
            {attendance.unattended.map(event => <li key={event.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{event.title} · {event.section}</p>
                <p className="text-muted-foreground">{event.faculty} · {new Date(event.when).toLocaleString("en-IN", {timeZone:"Asia/Kolkata"})}</p>
              </div>
              <Link href="/college/attendance"
                className="font-semibold text-primary-text hover:underline">Open attendance</Link>
            </li>)}
          </ul>}
        {attendance.unattendedCount > attendance.unattended.length &&
          <p className="text-xs text-muted-foreground">Showing the 20 most recent sessions. Open attendance to review more.</p>}
      </section>

      <section aria-label="Low attendance" className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            Under {lowAttendance.threshold}% attendance
          </h2>
          <Link href="/college/attendance"
            className="font-semibold text-primary-text hover:underline">Review attendance</Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Last 30 days · marked sessions only · {lowAttendance.rows.length} learner(s) shown
        </p>
        {lowAttendance.rows.length === 0
          ? <p className="text-sm text-muted-foreground">No learners below the attendance threshold.</p>
          : <div className="max-h-72 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-border">
                <th scope="col" className="py-2">Student</th>
                <th scope="col" className="py-2">Attendance</th>
                <th scope="col" className="py-2">Sessions attended</th>
              </tr></thead>
              <tbody>{lowAttendance.rows.map(row => <tr key={row.membershipId}
                className="border-b border-border">
                <td className="py-2 font-semibold">{row.displayName ?? row.membershipId}</td>
                <td className="py-2">{row.percent}%</td>
                <td className="py-2">{row.attended} / {row.marked}</td>
              </tr>)}</tbody>
            </table>
          </div>}
        {lowAttendance.rows.length === 200 &&
          <p className="text-xs text-muted-foreground">Showing first 200 at-risk learners. Open attendance for full reports.</p>}
      </section>
      <CollegeAdminQuickActions />
      <CollegeSetupChecklist phases={dashboard.setup.phases} />
    </div>
  );
}
