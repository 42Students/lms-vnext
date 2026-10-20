import Link from "next/link";
import {SUPER_ADMIN_TODAY_LABELS,type SuperAdminTodayMetrics} from "@/modules/colleges/admin-today-attention-model";
export function SuperAdminTodayBoard({data}:{data:SuperAdminTodayMetrics|null}){
 const counts=[data?.attendanceNotTaken??null,null,null,data?.coursesWithoutTeacher??null,
  null,data?.quizzesClosingThisWeek??null];
 const hrefs=["/admin/academics","/admin/academics","/admin/courses",
  "/admin/courses","/admin/academics","/admin/courses"];
 return <section aria-label="Today" className="space-y-3">
  <h2 className="text-lg font-semibold">Today</h2>
  <p role="status" className="text-sm text-body">Classes scheduled: {data?.classesScheduled??"—"}
   {" · "}Ended by schedule: {data?.classesEnded??"—"}
   {" · "}Attendance taken: {data?.attendanceTaken??"—"}
  </p>
  <div className="grid gap-3 border-y border-border sm:grid-cols-2 xl:grid-cols-3">
   {SUPER_ADMIN_TODAY_LABELS.map((label,index)=><Link key={label} href={hrefs[index]}
    className="border-l-2 border-border py-3 pl-3 hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    <p className="mt-2 text-2xl font-semibold tabular-nums">{counts[index]??"—"}</p>
    {counts[index]===null?<p className="mt-1 text-xs text-body">Not yet measurable from registered evidence</p>:null}
   </Link>)}
  </div>
  <p className="text-xs text-muted-foreground">Ended by schedule does not prove a class was held.
   Attendance missing counts elapsed scheduled classes without a marked session.
   Unavailable cards are not interpreted as zero.</p>
 </section>;
}
