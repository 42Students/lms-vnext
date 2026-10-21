import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
import { CollegeDashboardCards } from "@/components/admin/college-dashboard-cards";
import {CollegeDashboardSectionFailure} from "@/components/admin/college-dashboard-section-failure";
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
  const setupTotal=setupGaps?.reduce((total,row)=>total+row.count,0)??null;
  const attentionCards: {
    title:string; icon:string; count:number|null; tone:"danger"|"warn"|"info";
    empty:string; rows:string[]; href:string|null; action:string;
    detail?:string;
  }[] = [
    {
      title:"Attendance not taken",icon:"◷",tone:"danger",
      count:attendance?.unattendedCount??null,
      empty:"Every class held in the last 7 days has attendance.",
      rows:attendance?.unattended.map(row=>row.title+" · "+row.section+" · "+row.faculty)??[],
      href:"/college/attendance",action:"Open attendance",
    },
    {
      title:"Under "+(lowAttendance?.threshold??75)+"% attendance",icon:"!",tone:"danger",
      count:lowAttendance?.total??null,
      empty:"No student is under "+(lowAttendance?.threshold??75)+"% in the last 30 days.",
      rows:lowAttendance?.rows.map(row=>(row.displayName||"Student")+" · "+(row.rollNumber??row.className)+" · "+row.percent+"%")??[],
      href:"/college/attendance",action:"Attendance",detail:"Last 30 days, marked sessions only",
    },
    {
      title:"Waiting to be graded",icon:"✎",tone:"warn",
      count:pendingGradesCount,
      empty:"No assignment submission is waiting for a grade.",
      rows:pendingGrades?.map(row=>row.courseName+" · "+row.pending+" submissions"+(row.oldest?" · oldest "+row.oldest.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short"}):""))??[],
      href:"/college/assignments",action:"Assignments",
    },
    {
      title:"Courses with no teacher",icon:"♧",tone:"warn",
      count:unstaffedDeliveriesCount,
      empty:"Every current-semester course has a teacher for every section.",
      rows:unstaffed?.map(row=>row.name+" · "+row.sections.join(", "))??[],
      href:"/college/faculty-assignment",action:"Faculty assignment",detail:"Students see these with nobody behind them",
    },
    {
      title:"Setup gaps",icon:"⚙",tone:"warn",count:setupTotal,
      empty:"Batches, sections, students and courses are all connected.",
      rows:setupGaps?.filter(row=>row.count>0).map(row=>row.count+" "+row.label.toLowerCase())??[],
      href:setupGaps?.find(row=>row.count>0)?.href??"/college/batches",action:"Review setup",
    },
    {
      title:"Quizzes closing this week",icon:"▦",tone:"info",
      count:closingQuizzes?.total??null,
      empty:"No quiz closes in the next 7 days.",
      rows:closingQuizzes?.items.map(row=>row.title+" · "+row.course+" · closes "+
        (row.dueAt?.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})??"—"))??[],
      href:"/college/quizzes",action:"Quizzes",
    },
  ];
  const allClear=attentionCards.every(card=>card.count===0);

  return (
    <div className="min-w-0 max-w-full space-y-[var(--lms-space-6)]">
      <PageHeader title={COLLEGE_LEGACY_PAGE_TITLES.dashboard}/>
      <section aria-label="College greeting" className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-5">
        <h2 className="m-0 text-[26px] font-semibold leading-tight text-[var(--lms-heading)]">{college.name||"Your college"}</h2>
        <p className="m-0 text-sm font-medium text-muted-foreground">{formatCollegeHeaderDate(new Date())}</p>
      </section>
      {dashboard?<CollegeDashboardCards cards={dashboard.cards}/>:<div className="space-y-2">
        <CollegeDashboardSectionFailure title="At a glance"/>
        <p className="text-sm text-muted-foreground">Couldn't load this. Refresh to try again.</p>
        <Link href="/college" className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Retry</Link>
      </div>}
      <section aria-label="Needs attention" className="space-y-4 border-t border-border pt-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h2 className="m-0 text-xl font-semibold text-[var(--lms-heading)]">Today</h2>
          <form action="/college" method="get">
            <Button type="submit" variant="secondary" className="min-h-11 md:min-h-9">Refresh</Button>
          </form>
        </div>
        <div aria-label="Today's classes" className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-4 text-sm text-body">
          {attendance?<>
            <span><strong className="text-xl tabular-nums text-foreground">{attendance.today.scheduled}</strong> {attendance.today.scheduled===1?"class":"classes"} scheduled today</span>
            <span><strong className="text-xl tabular-nums text-foreground">{attendance.today.held}</strong> held so far</span>
            <span className={attendance.today.held>attendance.today.marked?"text-warning-text":""}>
              <strong className="text-xl tabular-nums">{attendance.today.marked}</strong> with attendance taken
            </span>
          </>:<span role="alert" className="text-muted-foreground">Today's classes couldn't be loaded.</span>}
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {attentionCards.map(card=>{
            const failed=card.count===null;
            const clear=card.count===0;
            const foreground=failed?"text-muted-foreground":clear?"text-success-text":
              card.tone==="danger"?"text-danger-text":card.tone==="info"?"text-primary-text":"text-warning-text";
            return <article key={card.title}
              className={"min-w-0 rounded-[var(--lms-control-radius)] border border-border p-4 "+
                (failed?"bg-muted/25":clear?"bg-success-subtle":card.tone==="danger"?"bg-danger-subtle":
                  card.tone==="info"?"bg-primary-subtle":"bg-warning-subtle")}>
              <div className="flex items-start justify-between gap-2 border-b border-border pb-2">
                <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                  <span aria-hidden="true" className={foreground}>{card.icon}</span>{card.title}
                </h3>
                {!failed?<span className={"shrink-0 rounded-full border border-border bg-surface px-2 py-0.5 text-sm font-semibold tabular-nums "+foreground}>{card.count}</span>:null}
              </div>
              {failed?<p role="status" className="py-4 text-sm text-muted-foreground">Couldn't load this. Refresh to try again.</p>:
                clear?<p className="flex items-start gap-2 py-4 text-sm text-success-text"><span aria-hidden="true">✓</span>{card.empty}</p>:
                <div className="space-y-2 py-3">
                  <ul className="divide-y divide-border text-sm text-body">
                    {card.rows.slice(0,4).map((row,index)=><li key={index} className="break-words py-2">{row}</li>)}
                    {card.count>Math.min(card.rows.length,4)?<li className="py-2 text-xs text-muted-foreground">
                      and {card.count-Math.min(card.rows.length,4)} more
                    </li>:null}
                  </ul>
                  {card.detail?<p className="text-xs text-muted-foreground">{card.detail}</p>:null}
                </div>}
              {!failed&&!clear&&card.href?<Link href={card.href}
                className="inline-flex min-h-9 items-center border-t border-border pt-2 text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                {card.action} →
              </Link>:null}
            </article>;
          })}
        </div>
        {allClear?<p role="status" className="flex items-center gap-2 text-sm font-medium text-success-text"><span aria-hidden="true">✓</span>Nothing needs you right now.</p>:null}
      </section>
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
