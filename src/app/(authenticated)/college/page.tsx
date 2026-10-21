import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
import { CollegeDashboardCards } from "@/components/admin/college-dashboard-cards";
import { CollegeNeedsAttentionBoard } from "@/components/admin/college-needs-attention-board";
import {CollegeDashboardSectionFailure} from "@/components/admin/college-dashboard-section-failure";
import {getCollegeClosingQuizzes} from "@/modules/admin-ui/college-dashboard-quizzes-service";
import { CollegeAdminQuickActions } from "@/components/admin/admin-dashboard-actions";
import { getCollegeDashboardCards } from "@/modules/admin-ui/college-dashboard-cards-service";
import { getCollegeDashboardAttendance } from "@/modules/admin-ui/college-dashboard-attendance-service";
import { getCollegeDashboardLowAttendance } from "@/modules/admin-ui/college-dashboard-risk-service";
import { getCollegeDashboardUnstaffedCourses, getCollegeDashboardUnstaffedDeliveriesCount } from "@/modules/admin-ui/college-dashboard-staffing-service";
import { getCollegeDashboardPendingGrades, getCollegeDashboardPendingGradesCount } from "@/modules/admin-ui/college-dashboard-grading-service";
import { getCollegeDashboardSetupGaps } from "@/modules/admin-ui/college-dashboard-setup-gaps-service";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
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


  // Keep the old LMS six-question attention board, but do not invent zeros if
  // any independently scoped vNext service fails.

  return (
    <div className="min-w-0 max-w-full space-y-[var(--lms-space-6)]">
      <PageHeader title={COLLEGE_LEGACY_PAGE_TITLES.dashboard}/>
      <section aria-label="College greeting" className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-5">
        <h2 className="m-0 text-[26px] font-semibold leading-tight text-[var(--lms-heading)]">{college.name||"Your college"}</h2>
        <p className="m-0 text-sm font-medium text-muted-foreground">{formatCollegeHeaderDate(new Date())}</p>
      </section>
      <CollegeNeedsAttentionBoard collegeId={college.id} generatedAt={new Date().toISOString()} data={{
        attendance, risk:lowAttendance, grades:pendingGrades, gradeCount:pendingGradesCount,
        staffing:unstaffed, staffingCount:unstaffedDeliveriesCount,
        setup:setupGaps, quizzes:closingQuizzes,
      }}/>
      {dashboard?<CollegeDashboardCards cards={dashboard.cards}/>:<div className="space-y-2">
        <CollegeDashboardSectionFailure title="At a glance"/>
        <p className="text-sm text-muted-foreground">Couldn't load this. Refresh to try again.</p>
        <Link href="/college" className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Retry</Link>
      </div>}
      <CollegeAdminQuickActions />
      {dashboard?<CollegeSetupChecklist phases={dashboard.setup.phases}/>:<CollegeDashboardSectionFailure title="College setup checklist"/>}
      <details className="min-w-0 border-t border-border pt-3">
        <summary className="min-h-11 cursor-pointer text-sm font-semibold text-primary-text">Other college actions</summary>
        <div className="flex min-w-0 flex-wrap items-center gap-3 py-3 text-sm">
          <CollegeEditDialog college={college} triggerLabel="Edit college"/>
          <Link href="/college/contacts" className="text-primary-text underline">Contacts</Link>
          <Link href="/college/announcements" className="text-primary-text underline">Announcements</Link>
          <Link href="/college/verification" className="text-primary-text underline">Verification</Link>
          <Link href="/college/branding" className="text-primary-text underline">Branding</Link>
          <span className="text-xs text-muted-foreground">{college.code} · {college.city||"—"} · {college.state||"—"} · {college.country||"—"}</span>
        </div>
      </details>
    </div>
  );
}
