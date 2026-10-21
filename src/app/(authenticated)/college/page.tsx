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
import { getCollegeDashboardUnstaffedCourses, getCollegeDashboardUnstaffedDeliveriesCount } from "@/modules/admin-ui/college-dashboard-staffing-service";
import { getCollegeDashboardPendingGrades, getCollegeDashboardPendingGradesCount } from "@/modules/admin-ui/college-dashboard-grading-service";
import { getCollegeDashboardSetupGaps } from "@/modules/admin-ui/college-dashboard-setup-gaps-service";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { listColleges } from "@/modules/colleges/service";
import { formatCollegeHeaderDate } from "@/modules/admin-ui/college-dashboard-cards-model";
import { COLLEGE_LEGACY_PAGE_TITLES } from "@/modules/people/college-page-title-model";

export default async function CollegeOverviewPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;

  const limitedAccess=<div className="min-w-0 space-y-4">
    <PageHeader title={COLLEGE_LEGACY_PAGE_TITLES.dashboard}/>
    <Alert tone="warning">
      Admin not assigned to a college. Some features are limited. Contact your administrator.
    </Alert>
    <section aria-label="Quick Actions" className="space-y-2 border-t border-border pt-3">
      <h2 className="text-base font-semibold text-[var(--lms-heading)]">Quick Actions</h2>
      <Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
        Choose an available workspace
      </Link>
      <p className="text-xs text-muted-foreground">College-specific changes remain disabled until your membership is verified.</p>
    </section>
  </div>;
  if (!membership) return limitedAccess;

  const colleges = await listColleges(
    context,
    membership.organizationId,
  );
  const college = colleges.find((item) => item.id === membership.collegeId);

  if (!college) return limitedAccess;

  // A secondary feed failing must not hide other dashboard sections or suggest
  // that missing data is a real zero. Keep each result independently visible.
  const [dashboardResult,attendanceResult,riskResult,staffingResult,
    gradingResult,setupResult,closingResult,gradingCountResult,staffingCountResult]=await Promise.allSettled([
    getCollegeDashboardCards(context, {}),
    getCollegeDashboardAttendance(context),
    getCollegeDashboardLowAttendance(context),
    getCollegeDashboardUnstaffedCourses(context),
    getCollegeDashboardPendingGrades(context),
    getCollegeDashboardSetupGaps(context),
    getCollegeClosingQuizzes(context),
    getCollegeDashboardPendingGradesCount(context),
    getCollegeDashboardUnstaffedDeliveriesCount(context),
  ]);
  const dashboard=dashboardResult.status==="fulfilled"?dashboardResult.value:null;
  const attendance=attendanceResult.status==="fulfilled"?attendanceResult.value:null;
  const lowAttendance=riskResult.status==="fulfilled"?riskResult.value:null;
  const unstaffed=staffingResult.status==="fulfilled"?staffingResult.value:null;
  const unstaffedDeliveriesCount=staffingCountResult.status==="fulfilled"?staffingCountResult.value:null;
  const pendingGrades=gradingResult.status==="fulfilled"?gradingResult.value:null;
  const pendingGradesCount=gradingCountResult.status==="fulfilled"?gradingCountResult.value:null;
  const setupGaps=setupResult.status==="fulfilled"?setupResult.value:null;
  const closingQuizzes=closingResult.status==="fulfilled"?closingResult.value:null;

  return (
    <div className="min-w-0 max-w-full space-y-[16px]">
      <PageHeader
        title={COLLEGE_LEGACY_PAGE_TITLES.dashboard}
        description={`${college.name} · ${formatCollegeHeaderDate(new Date())}`}
        actions={<CollegeEditDialog college={college} triggerLabel="Edit college" />}
      />
      <details className="min-w-0 border-b border-border pb-3">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Other college actions</summary>
        <nav aria-label="College overview tools" className="flex min-w-0 flex-wrap items-center gap-2 pt-3">
            <Link href="/college/contacts"
              className="inline-flex min-h-11 md:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
              Contacts
            </Link>
            <Link href="/college/announcements"
              className="inline-flex min-h-11 md:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
              Announcements
            </Link>
            <Link href="/college/verification"
              className="inline-flex min-h-11 md:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
              Verification
            </Link>
            <Link
              href="/college/branding"
              className="inline-flex min-h-11 md:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
            >
              Branding
            </Link>

        </nav>
      </details>
      <section className="grid min-w-0 grid-cols-2 gap-4 border-b border-border pb-4 md:grid-cols-4">
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
      {dashboard?<CollegeDashboardCards cards={dashboard.cards}/>:<div className="space-y-2">
        <CollegeDashboardSectionFailure title="At a glance"/>
        <p className="text-xs text-muted-foreground">Summary is temporarily unavailable. Refresh to try again. Previous counts are not inferred.</p>
        <Link href="/college" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>
      </div>}
      {closingQuizzes?<CollegeClosingQuizzesCard data={closingQuizzes}/>:<CollegeDashboardSectionFailure title="Closing quizzes"/>}
      {attendance?<>
      <section aria-label="Today" className="space-y-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h2 className="text-base font-semibold leading-6 text-[var(--lms-heading)]">Today</h2>
          <form method="get" action="/college">
            <Button type="submit" variant="secondary" className="min-h-11 md:min-h-9">Refresh</Button>
          </form>
        </div>
        <div className="grid gap-[8px] md:grid-cols-3">
          {[
            { label: "Classes scheduled today", value: attendance.today.scheduled },
            { label: "Held so far", value: attendance.today.held },
            { label: "With attendance taken", value: attendance.today.marked },
          ].map(item => <div key={item.label}
            className="border-b border-border py-3">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-primary-text">
              {item.value.toLocaleString("en-IN")}
            </p>
          </div>)}
        </div>
      </section>
      </>:<div className="space-y-2">
        <CollegeDashboardSectionFailure title="Today"/>
        <p className="text-xs text-muted-foreground">Couldn&apos;t load this. Refresh to try again.</p>
        <Link href="/college" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Refresh</Link>
      </div>}
      {attendance?<>
      <section aria-label="Attendance not taken" className="space-y-3 border-t border-border pt-[16px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold leading-6 text-[var(--lms-heading)]">Attendance not taken</h2>
            <p className="text-sm text-muted-foreground">
              {attendance.unattendedCount} held session(s) in the last 7 days without marked attendance.
            </p>
          </div>
          <Link href="/college/attendance"
            className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Open attendance
          </Link>
        </div>
        {attendance.unattended.length === 0
          ? <p className="text-sm text-muted-foreground">Every class held in last 7 days has attendance</p>
          : <ul className="divide-y divide-border">
            {attendance.unattended.map(event => <li key={event.id}
              className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{event.title} · {event.section}</p>
                <p className="text-muted-foreground">{event.faculty} · {new Date(event.when).toLocaleString("en-IN", {timeZone:"Asia/Kolkata"})}</p>
              </div>
              <Link href="/college/attendance"
                className="min-h-11 md:min-h-9 inline-flex items-center font-semibold text-primary-text hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open attendance</Link>
            </li>)}
          </ul>}
        {attendance.unattendedCount > attendance.unattended.length &&
          <p className="text-xs text-muted-foreground">and {attendance.unattendedCount - attendance.unattended.length} more · Open attendance to review more.</p>}
      </section>
      </>:<CollegeDashboardSectionFailure title="Attendance not taken"/>}
      <details className="min-w-0 border-t border-border pt-2">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Low attendance</summary>
      {lowAttendance?<>
      <section aria-label="Low attendance" className="space-y-3 border-t border-border pt-[16px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold leading-6 text-[var(--lms-heading)]">
            Under {lowAttendance.threshold}% attendance
          </h2>
          <Link href="/college/attendance"
            className="min-h-11 md:min-h-9 inline-flex items-center font-semibold text-primary-text hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Review attendance</Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Last 30 days · marked sessions only · {lowAttendance.total} learner(s) below threshold
        </p>
        {lowAttendance.rows.length === 0
          ? <p className="text-sm text-muted-foreground">No learners below the attendance threshold.</p>
          : <DataTable rows={lowAttendance.rows} getRowKey={row=>row.membershipId}
            caption="Learners below attendance threshold"
            columns={[
              {key:"name",header:"Student",mobilePriority:"primary",cell:row=>row.displayName??row.membershipId},
              {key:"roll",header:"Roll No.",mobilePriority:"secondary",cell:row=>row.rollNumber??"—"},
              {key:"class",header:"Class",mobilePriority:"secondary",cell:row=>row.className},
              {key:"attendance",header:"Attendance",mobilePriority:"secondary",cell:row=>row.percent+"%"},
              {key:"sessions",header:"Sessions attended",mobilePriority:"secondary",cell:row=>row.attended+" / "+row.marked},
            ]}
            empty={<p className="text-sm text-muted-foreground">No learners below the attendance threshold.</p>}/>}
        {lowAttendance.total > lowAttendance.rows.length &&
          <p className="text-xs text-muted-foreground">and {lowAttendance.total - lowAttendance.rows.length} more · Open attendance for full reports.</p>}
      </section>
      </>:<CollegeDashboardSectionFailure title="Low attendance"/>}
      </details>
      <details className="min-w-0 border-t border-border pt-2">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Courses with no teacher</summary>
      {unstaffed?<>
      <section aria-label="Courses with no teacher" className="space-y-3 border-t border-border pt-[16px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold leading-6 text-[var(--lms-heading)]">Courses with no teacher</h2>
          <Link href="/college/faculty-assignment" className="min-h-11 md:min-h-9 inline-flex items-center font-semibold text-primary-text hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Manage faculty
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {unstaffedDeliveriesCount === null ? "—" : unstaffedDeliveriesCount} unstaffed section-course delivery(ies) this semester.
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
              className="min-h-11 md:min-h-9 inline-flex items-center font-semibold text-primary-text hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Assign faculty</Link>
          </li>)}
        </ul>}
        {unstaffedDeliveriesCount !== null && unstaffedDeliveriesCount > unstaffed.length &&
          <p className="text-xs text-muted-foreground">Showing up to eight section-course gaps. Open faculty assignment for all {unstaffedDeliveriesCount}.</p>}
      </section>
      </>:<CollegeDashboardSectionFailure title="Courses with no teacher"/>}
      </details>
      <details className="min-w-0 border-t border-border pt-2">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Waiting to be graded</summary>
      {pendingGrades?<>
      <section aria-label="Waiting to be graded" className="space-y-3 border-t border-border pt-[16px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold leading-6 text-[var(--lms-heading)]">Waiting to be graded</h2>
          <Link href="/college/assignments" className="min-h-11 md:min-h-9 inline-flex items-center font-semibold text-primary-text hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Review assignments
          </Link>
        </div>
        {pendingGradesCount !== null && <p className="text-sm text-muted-foreground">{pendingGradesCount} ungraded submission(s) across the college.</p>}
        {pendingGrades.length === 0
          ? <p className="text-sm text-muted-foreground">No assignment submissions awaiting a grade.</p>
          : <ul className="divide-y divide-border">
            {pendingGrades.map(item => <li key={item.courseId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div>
                <p className="font-semibold">{item.courseName} ({item.courseCode})</p>
                <p className="text-muted-foreground">
                  {item.pending} submission(s) · Oldest: {item.oldest?.toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }) ?? "—"}
                </p>
              </div>
              <Link href="/college/assignments" className="min-h-11 md:min-h-9 inline-flex items-center font-semibold text-primary-text hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Review</Link>
            </li>)}
          </ul>}
        {pendingGradesCount !== null && pendingGrades.length === 8 &&
          <p className="text-xs text-muted-foreground">Showing eight course groups. Open assignments to review the full backlog.</p>}
      </section>
      </>:<CollegeDashboardSectionFailure title="Waiting to be graded"/>}
      </details>
      <details className="min-w-0 border-t border-border pt-2">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Setup gaps</summary>
      {setupGaps?<>
      <section aria-label="Setup gaps" className="space-y-3 border-t border-border pt-[16px]">
        <h2 className="text-base font-semibold leading-6 text-[var(--lms-heading)]">Setup gaps</h2>
        <p className="text-sm text-muted-foreground">Records still missing a critical academic relationship.</p>
        <div className="grid gap-[8px] md:grid-cols-2 lg:grid-cols-4">
          {setupGaps.map(item => <Link key={item.label} href={item.href}
            className="rounded-[var(--lms-control-radius)] border border-border p-4 hover:border-primary hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums">{item.count}</p>
            <span className="text-xs font-semibold text-primary-text">Review →</span>
          </Link>)}
        </div>
        {setupGaps.every(item => item.count === 0) && <p role="status" className="text-sm text-muted-foreground leading-[1.6]">
          No setup gaps found.
        </p>}
      </section>
      </>:<CollegeDashboardSectionFailure title="Setup gaps"/>}
      </details>
      <details className="min-w-0 border-t border-border pt-2">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Quick Actions</summary>
        <CollegeAdminQuickActions />
      </details>
      {dashboard?<CollegeSetupChecklist phases={dashboard.setup.phases}/>:<CollegeDashboardSectionFailure title="College setup checklist"/>}
      {attendance&&lowAttendance&&pendingGradesCount!==null&&unstaffedDeliveriesCount!==null&&setupGaps
        &&attendance.unattendedCount===0&&lowAttendance.total===0
        &&pendingGradesCount===0&&unstaffedDeliveriesCount===0
        &&setupGaps.every(item=>item.count===0)
        ?<Alert tone="success">Nothing needs you right now.</Alert>:null}
    </div>
  );
}
