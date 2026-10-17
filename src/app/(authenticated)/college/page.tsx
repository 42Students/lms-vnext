import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
import { CollegeDashboardCards } from "@/components/admin/college-dashboard-cards";
import {CollegeDashboardSectionFailure} from "@/components/admin/college-dashboard-section-failure";
import {CollegeClosingQuizzesCard} from "@/components/admin/college-closing-quizzes-card";
import {getCollegeClosingQuizzes} from "@/modules/admin-ui/college-dashboard-quizzes-service";
import { CollegeAdminQuickActions } from "@/components/admin/admin-dashboard-actions";
import { getCollegeDashboardCards } from "@/modules/admin-ui/college-dashboard-cards-service";
import { getCollegeDashboardAttendance } from "@/modules/admin-ui/college-dashboard-attendance-service";
import { getCollegeDashboardLowAttendance } from "@/modules/admin-ui/college-dashboard-risk-service";
import { getCollegeDashboardUnstaffedCourses } from "@/modules/admin-ui/college-dashboard-staffing-service";
import { getCollegeDashboardPendingGrades } from "@/modules/admin-ui/college-dashboard-grading-service";
import { getCollegeDashboardSetupGaps } from "@/modules/admin-ui/college-dashboard-setup-gaps-service";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listColleges } from "@/modules/colleges/service";
import { formatCollegeHeaderDate } from "@/modules/admin-ui/college-dashboard-cards-model";
import { COLLEGE_LEGACY_PAGE_TITLES } from "@/modules/people/college-page-title-model";

export default async function CollegeOverviewPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;

  if (!membership) {
    return <EmptyState title="Admin not assigned to a college"
      description="Your account does not have an active college assignment. Contact a platform administrator." />;
  }

  const colleges = await listColleges(
    context,
    membership.organizationId,
  );
  const college = colleges.find((item) => item.id === membership.collegeId);

  if (!college) {
    return (
      <EmptyState
        title="Admin not assigned to a college"
        description="Your active membership no longer resolves to an active college."
      />
    );
  }

  // A secondary feed failing must not hide other dashboard sections or suggest
  // that missing data is a real zero. Keep each result independently visible.
  const [dashboardResult,attendanceResult,riskResult,staffingResult,
    gradingResult,setupResult,closingResult]=await Promise.allSettled([
    getCollegeDashboardCards(context, {}),
    getCollegeDashboardAttendance(context),
    getCollegeDashboardLowAttendance(context),
    getCollegeDashboardUnstaffedCourses(context),
    getCollegeDashboardPendingGrades(context),
    getCollegeDashboardSetupGaps(context),
    getCollegeClosingQuizzes(context),
  ]);
  const dashboard=dashboardResult.status==="fulfilled"?dashboardResult.value:null;
  const attendance=attendanceResult.status==="fulfilled"?attendanceResult.value:null;
  const lowAttendance=riskResult.status==="fulfilled"?riskResult.value:null;
  const unstaffed=staffingResult.status==="fulfilled"?staffingResult.value:null;
  const pendingGrades=gradingResult.status==="fulfilled"?gradingResult.value:null;
  const setupGaps=setupResult.status==="fulfilled"?setupResult.value:null;
  const closingQuizzes=closingResult.status==="fulfilled"?closingResult.value:null;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title={COLLEGE_LEGACY_PAGE_TITLES.dashboard}
        description={`${college.name} · ${formatCollegeHeaderDate(new Date())}`}
        actions={
          <>
            <Link href="/college/contacts"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle">
              Contacts
            </Link>
            <Link href="/college/announcements"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle">
              Announcements
            </Link>
            <Link href="/college/verification"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle">
              Verification
            </Link>
            <Link
              href="/college/branding"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
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
      {dashboard?<CollegeDashboardCards cards={dashboard.cards}/>:<CollegeDashboardSectionFailure title="At a glance"/>}
      {closingQuizzes?<CollegeClosingQuizzesCard data={closingQuizzes}/>:<CollegeDashboardSectionFailure title="Closing quizzes"/>}
      {attendance?<>
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
      </>:<CollegeDashboardSectionFailure title="Today"/>}
      {attendance?<>
      <section aria-label="Attendance not taken" className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Attendance not taken</h2>
            <p className="text-sm text-muted-foreground">
              {attendance.unattendedCount} held session(s) in the last 7 days without marked attendance.
            </p>
          </div>
          <Link href="/college/attendance"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
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
      </>:<CollegeDashboardSectionFailure title="Attendance not taken"/>}
      {lowAttendance?<>
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
              <thead className="sticky top-0 z-10 bg-surface"><tr className="border-b border-border">
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
      </>:<CollegeDashboardSectionFailure title="Low attendance"/>}
      {unstaffed?<>
      <section aria-label="Courses with no teacher" className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Courses with no teacher</h2>
          <Link href="/college/faculty-assignment" className="font-semibold text-primary-text hover:underline">
            Manage faculty
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {unstaffed.length} active course(s) with unstaffed sections this semester.
        </p>
        {unstaffed.length === 0 ? <p className="text-sm text-muted-foreground">
          All active semester deliveries have a teaching assignment.
        </p> : <ul className="divide-y divide-border">
          {unstaffed.map(course => <li key={course.courseId}
            className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
            <div>
              <p className="font-semibold">{course.name} ({course.code})</p>
              <p className="text-muted-foreground">{course.sections.length} unstaffed class(es): {course.sections.join(", ")}</p>
            </div>
            <Link href="/college/faculty-assignment"
              className="font-semibold text-primary-text hover:underline">Assign faculty</Link>
          </li>)}
        </ul>}
      </section>
      </>:<CollegeDashboardSectionFailure title="Courses with no teacher"/>}
      {pendingGrades?<>
      <section aria-label="Waiting to be graded" className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Waiting to be graded</h2>
          <Link href="/college/assignments" className="font-semibold text-primary-text hover:underline">
            Review assignments
          </Link>
        </div>
        {pendingGrades.length === 0
          ? <p className="text-sm text-muted-foreground">No assignment submissions awaiting a grade.</p>
          : <ul className="divide-y divide-border">
            {pendingGrades.map(item => <li key={item.courseId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div>
                <p className="font-semibold">{item.courseName} ({item.courseCode})</p>
                <p className="text-muted-foreground">
                  {item.pending} submission(s) · Oldest: {item.oldest?.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) ?? "—"}
                </p>
              </div>
              <Link href="/college/assignments" className="font-semibold text-primary-text hover:underline">Review</Link>
            </li>)}
          </ul>}
      </section>
      </>:<CollegeDashboardSectionFailure title="Waiting to be graded"/>}
      {setupGaps?<>
      <section aria-label="Setup gaps" className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">Setup gaps</h2>
        <p className="text-sm text-muted-foreground">Records still missing a critical academic relationship.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {setupGaps.map(item => <Link key={item.label} href={item.href}
            className="rounded-lg border border-border p-4 hover:border-primary">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums">{item.count}</p>
            <span className="text-xs font-semibold text-primary-text">Review →</span>
          </Link>)}
        </div>
        {setupGaps.every(item => item.count === 0) && <p role="status" className="text-sm text-muted-foreground">
          No setup gaps found.
        </p>}
      </section>
      </>:<CollegeDashboardSectionFailure title="Setup gaps"/>}
      <CollegeAdminQuickActions />
      {dashboard?<CollegeSetupChecklist phases={dashboard.setup.phases}/>:<CollegeDashboardSectionFailure title="College setup checklist"/>}
    </div>
  );
}
