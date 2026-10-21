"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { getCollegeDashboardAttendance } from "@/modules/admin-ui/college-dashboard-attendance-service";
import type { getCollegeDashboardLowAttendance } from "@/modules/admin-ui/college-dashboard-risk-service";
import type { getCollegeDashboardPendingGrades } from "@/modules/admin-ui/college-dashboard-grading-service";
import type { getCollegeDashboardUnstaffedCourses } from "@/modules/admin-ui/college-dashboard-staffing-service";
import type { getCollegeDashboardSetupGaps } from "@/modules/admin-ui/college-dashboard-setup-gaps-service";
import type { getCollegeClosingQuizzes } from "@/modules/admin-ui/college-dashboard-quizzes-service";

type Attendance = Awaited<ReturnType<typeof getCollegeDashboardAttendance>>;
type Risk = Awaited<ReturnType<typeof getCollegeDashboardLowAttendance>>;
type Grades = Awaited<ReturnType<typeof getCollegeDashboardPendingGrades>>;
type Staffing = Awaited<ReturnType<typeof getCollegeDashboardUnstaffedCourses>>;
type Setup = Awaited<ReturnType<typeof getCollegeDashboardSetupGaps>>;
type Quizzes = Awaited<ReturnType<typeof getCollegeClosingQuizzes>>;
export type AttentionData = {
  attendance: Attendance | null;
  risk: Risk | null;
  grades: Grades | null;
  gradeCount: number | null;
  staffing: Staffing | null;
  staffingCount: number | null;
  setup: Setup | null;
  quizzes: Quizzes | null;
};
type AttentionCardProps = {
  title: string; icon: string; count: number | null; href: string;
  empty: string; children?: ReactNode; shown: number; pending: boolean;
};
function AttentionCard({title,icon,count,href,empty,children,shown,pending}:AttentionCardProps) {
  return <article className="flex min-h-[220px] min-w-0 flex-col rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--lms-canvas-border)] px-4 py-3">
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[var(--lms-heading)]">
        <span aria-hidden="true" className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eff8fa] text-[#1a95a1]">{icon}</span>
        {title}
      </h3>
      {count !== null ? <span aria-label={count+" needing attention"} className="rounded-full bg-[#eff8fa] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[#1a95a1]">{count}</span> : null}
    </header>
    <div className="min-w-0 flex-1 px-4 py-3 text-[13px] leading-5 text-[var(--lms-body-text)]">
      {count === null
        ? <p role="status" className="text-amber-700">Couldn't load this. Refresh to try again.</p>
        : count === 0
          ? <p role="status" className="flex gap-2 text-emerald-700"><span aria-hidden="true">✓</span>{empty}</p>
          : <>{children}{count > shown ? <Link href={href}
              className="mt-3 block font-semibold text-[#1a95a1] underline">
              and {count - shown} more
            </Link> : null}</>}
      {pending ? <p role="status" className="mt-2 text-xs text-muted-foreground">Refreshing… showing last available results.</p> : null}
    </div>
    <footer className="border-t border-[var(--lms-canvas-border)] px-4 py-2.5">
      <Link href={href} className="inline-flex min-h-9 items-center text-[13px] font-semibold text-[#1a95a1] hover:underline">
        View all <span aria-hidden="true" className="ml-1">→</span>
      </Link>
    </footer>
  </article>;
}
function AttentionList({ rows }: {rows: Array<{ key: string; title: string; detail: string }>}) {
  return <ul className="divide-y divide-[var(--lms-canvas-border)]">
    {rows.slice(0,8).map(row=><li key={row.key} className="min-w-0 py-2 first:pt-0">
      <p className="truncate font-semibold text-[var(--lms-heading)]" title={row.title}>{row.title}</p>
      <p className="truncate text-muted-foreground" title={row.detail}>{row.detail}</p>
    </li>)}
  </ul>;
}

/** Keep prior successful *same-college* feeds visible during partial refresh failures. */
export function CollegeNeedsAttentionBoard({ collegeId, data, generatedAt }: {
  collegeId: string; data: AttentionData; generatedAt: string;
}) {
  const router=useRouter();
  const [pending,startTransition]=useTransition();
  const [snapshot,setSnapshot]=useState({collegeId,data,generatedAt});
  useEffect(()=>{
    setSnapshot(previous => {
      if(previous.collegeId!==collegeId) return {collegeId,data,generatedAt};
      const next: AttentionData={
        attendance:data.attendance ?? previous.data.attendance,
        risk:data.risk ?? previous.data.risk,
        grades:data.grades ?? previous.data.grades,
        gradeCount:data.gradeCount ?? previous.data.gradeCount,
        staffing:data.staffing ?? previous.data.staffing,
        staffingCount:data.staffingCount ?? previous.data.staffingCount,
        setup:data.setup ?? previous.data.setup,
        quizzes:data.quizzes ?? previous.data.quizzes,
      };
      return {collegeId,data:next,generatedAt};
    });
  },[collegeId,data,generatedAt]);
  const shown=snapshot.collegeId===collegeId?snapshot.data:data;
  const attendance=shown.attendance, risk=shown.risk, grades=shown.grades,staffing=shown.staffing,
    setup=shown.setup,quizzes=shown.quizzes;
  const countSetup=setup?.reduce((sum,row)=>sum+row.count,0) ?? null;
  const gradeRows=grades?.map(row=>({
    key:row.courseId,title:row.courseName+" ("+row.courseCode+")",
    detail:row.pending+" waiting · Oldest "+(row.oldest?.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})??"—"),
  })) ?? [];
  const staffRows=staffing?.flatMap(row=>row.sections.map(section=>({
    key:row.courseId+":"+section,title:section+" · "+row.name,
    detail:"Course "+row.code+" · No teacher assigned",
  }))).slice(0,8) ?? [];
  return <section aria-label="Needs attention" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Needs attention</h2>
        <p className="mt-1 text-xs text-muted-foreground">Updated {new Date(snapshot.generatedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST
          {risk ? " · Attendance threshold "+risk.threshold+"%" : ""}
        </p>
      </div>
      <Button type="button" variant="secondary" disabled={pending} aria-label="Refresh needs attention"
        className="min-h-9" onClick={()=>startTransition(()=>router.refresh())}>
        <span aria-hidden="true">↻</span> {pending?"Refreshing…":"Refresh"}
      </Button>
    </div>
    <section aria-label="Today" className="grid grid-cols-1 gap-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-3 sm:grid-cols-3">
      {[
        {label:"Classes scheduled today",value:attendance?.today.scheduled},
        {label:"Held so far",value:attendance?.today.held},
        {label:"With attendance taken",value:attendance?.today.marked},
      ].map(item=><div key={item.label} className="border-b border-[var(--lms-canvas-border)] px-3 py-2 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
        <p className="text-xs text-muted-foreground">{item.label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--lms-heading)]">{item.value??"—"}</p>
      </div>)}
    </section>
    <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
      <AttentionCard title="Attendance not taken" icon="◷" count={attendance?.unattendedCount??null}
        href="/college/attendance" empty="Every class held in last 7 days has attendance"
        shown={attendance?.unattended.length??0} pending={pending}>
        <AttentionList rows={attendance?.unattended.map(row=>({
          key:row.id,title:row.title+" · "+row.section,
          detail:row.course+" · "+row.faculty+" · "+new Date(row.when).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}),
        }))??[]}/>
      </AttentionCard>
      <AttentionCard title="Low attendance" icon="!" count={risk?.total??null}
        href="/college/attendance" empty="No learners below the attendance threshold."
        shown={risk?.rows.length??0} pending={pending}>
        <AttentionList rows={risk?.rows.map(row=>({
          key:row.membershipId,title:row.displayName??row.rollNumber??"Learner",
          detail:row.className+" · "+row.percent+"% attendance",
        }))??[]}/>
      </AttentionCard>
      <AttentionCard title="Waiting to be graded" icon="✎" count={shown.gradeCount}
        href="/college/assignments" empty="No assignment submissions awaiting a grade."
        shown={grades?.reduce((sum,row)=>sum+row.pending,0)??0} pending={pending}>
        <AttentionList rows={gradeRows}/>
      </AttentionCard>
      <AttentionCard title="Courses with no teacher" icon="♧" count={shown.staffingCount}
        href="/college/faculty-assignment" empty="All current semester classes have a teacher."
        shown={staffRows.length} pending={pending}>
        <AttentionList rows={staffRows}/>
      </AttentionCard>
      <AttentionCard title="Setup gaps" icon="⚑" count={countSetup} href="/college/academics"
        empty="No setup gaps found." shown={countSetup??0} pending={pending}>
        <AttentionList rows={setup?.filter(row=>row.count>0).slice(0,8).map(row=>({
          key:row.label,title:row.label,detail:row.count+" need attention",
        }))??[]}/>
      </AttentionCard>
      <AttentionCard title="Quizzes due soon" icon="◇" count={quizzes?.total??null}
        href="/college/courses" empty="No quizzes due in the next 7 days."
        shown={quizzes?.items.length??0} pending={pending}>
        <AttentionList rows={quizzes?.items.map(row=>({
          key:row.id,title:row.title,detail:row.course+" · "+row.className+" · "+new Date(row.dueAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}),
        }))??[]}/>
      </AttentionCard>
    </div>
  </section>;
}
