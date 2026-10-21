import Link from "next/link";
import {SUPER_ADMIN_TODAY_LABELS,type SuperAdminTodayMetrics} from "@/modules/colleges/admin-today-attention-model";
export function SuperAdminTodayBoard({data}:{data:SuperAdminTodayMetrics|null}){
 const counts=[data?.attendanceNotTaken??null,null,null,data?.coursesWithoutTeacher??null,
  null,data?.quizzesClosingThisWeek??null];
 const implemented=[true,false,false,true,false,true] as const;
 const hrefs=["/admin/academics","/admin/academics","/admin/courses",
  "/admin/courses","/admin/academics","/admin/courses"];
 return <section aria-label="Today" className="space-y-3">
  <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Today</h2>
  {!data ? <div role="alert" className="border-y border-border px-3 py-3 text-sm text-body">
    Couldn't load today's overview.{" "}
    <Link href="/dashboard" className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">
      Retry
    </Link>
  </div> : null}
  <p role="status" className="text-sm text-body leading-[22px]">
    {data?.classesScheduled??"—"} scheduled today
    {" · "}{data?.classesEnded??"—"} ended by schedule (held not verified)
    {" · "}{data?.attendanceTaken??"—"} with attendance taken
  </p>
  <div className="grid min-w-0 gap-3 border-y border-border min-[768px]:grid-cols-2 xl:grid-cols-3">
   {SUPER_ADMIN_TODAY_LABELS.map((label,index)=><Link key={label} href={hrefs[index]}
    className="min-w-0 border-l-2 border-border py-3 pl-3 hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
    <p className="text-xs font-semibold text-muted-foreground leading-5">{label}</p>
    <p className="mt-2 break-words text-2xl font-semibold tabular-nums text-foreground">{counts[index]??"—"}</p>
    {counts[index]===null?<p className="mt-1 text-xs text-body leading-5">
      {!data ? "Overview failed to load" : implemented[index]
        ? "Not yet measurable from registered evidence"
        : "This metric is not supplied by the current Today service"}
    </p>:null}
   </Link>)}
  </div>
  <p className="text-xs text-muted-foreground leading-5">Ended by schedule does not prove a class was held.
   Attendance missing counts elapsed scheduled classes without a marked session.
   Unavailable cards are not interpreted as zero.</p>
 </section>;
}
