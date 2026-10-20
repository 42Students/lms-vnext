import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/ui/calendar-grid";
import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
import monthStyles from "@/components/academics/legacy-class-month-grid.module.css";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatTile } from "@/components/ui/stat-tile";
import {
  attendanceCalendarDayKey, attendanceCalendarDays,
  attendanceCalendarHref, learnerAttendanceCalendarQuerySchema,
  shiftAttendanceCalendarMonth,
} from "@/modules/attendance/learner-attendance-calendar-model";
import { getOwnLearnerAttendanceCalendar } from "@/modules/attendance/learner-attendance-calendar-service";

export const dynamic = "force-dynamic";
type Params = {month?:string|string[];deliveryId?:string|string[];status?:string|string[]};
const first = (value:string|string[]|undefined) => Array.isArray(value)?value[0]:value;

const statusNames:Record<string,string> = {
  PRESENT:"Present",ABSENT:"Absent",EXCUSED:"Excused",MEDICAL:"Medical",
  LATE:"Late",NOT_MARKED:"Not marked",SCHEDULED:"Scheduled",
};
const statusTone:Record<string,"success"|"error"|"warning"|"neutral"|"info"> = {
  PRESENT:"success",ABSENT:"error",EXCUSED:"warning",
  MEDICAL:"warning",LATE:"warning",NOT_MARKED:"neutral",SCHEDULED:"info",
};

export default async function LearnerAttendanceCalendarPage({
  searchParams,
}:{searchParams:Promise<Params>}) {
  const raw=await searchParams;
  const parsed=learnerAttendanceCalendarQuerySchema.safeParse({
    month:first(raw.month)??undefined,
    deliveryId:first(raw.deliveryId)??undefined,
    status:first(raw.status)??undefined,
  });
  if(!parsed.success) return <section className="min-w-0 space-y-4">
    <PageHeader title="Attendance calendar" />
    <ErrorState title="Invalid attendance calendar filters" description="Check the month, course and status filters or clear them to continue."
      action={<Link href="/learn/attendance/calendar" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Clear filters</Link>}/>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getOwnLearnerAttendanceCalendar(context,parsed.data);
  const byDay=new Map<string,typeof data.rows>();
  for(const row of data.rows){
    const day=attendanceCalendarDayKey(row.startsAt);
    const rows=byDay.get(day)??[];
    rows.push(row);
    byDay.set(day,rows);
  }
  const days=attendanceCalendarDays(data.query.month);
  const monthLabel=new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric",timeZone:"UTC"})
    .format(new Date(data.query.month+"-15T12:00:00Z"));
  const previous=attendanceCalendarHref({
    ...data.query,month:shiftAttendanceCalendarMonth(data.query.month,-1),
  });
  const next=attendanceCalendarHref({
    ...data.query,month:shiftAttendanceCalendarMonth(data.query.month,1),
  });
  const sourceLink="/learn/attendance?" + new URLSearchParams({
    month:data.query.month,
    ...(data.query.deliveryId!=="ALL"?{deliveryId:data.query.deliveryId}:{}),
  }).toString();

  return <div className="min-w-0 space-y-6">
    <PageHeader title="Attendance calendar"
      actions={<Link href={sourceLink} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text transition-colors duration-150 hover:border-primary hover:bg-primary-subtle hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none md:min-h-9">
        Attendance detail
      </Link>} />
    <form action="/learn/attendance/calendar" method="get"
      className="grid gap-3 border-b border-border pb-4 md:grid-cols-3">
      <label className="grid gap-1 text-xs font-semibold text-body">Month
        <Input name="month" type="month" defaultValue={data.query.month}
          className="min-h-11 md:min-h-9" />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-body">Course
        <Select name="deliveryId" defaultValue={data.query.deliveryId}
          className="min-h-11 w-full md:min-h-9">
          <option value="ALL">All accessible Courses</option>
          {data.courses.map(course=>
            <option key={course.deliveryId} value={course.deliveryId}>
              {course.courseCode} · {course.courseName}
            </option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-xs font-semibold text-body">Status
        <Select name="status" defaultValue={data.query.status}
          className="min-h-11 w-full md:min-h-9">
          <option value="ALL">All status types</option>
          {Object.entries(statusNames).map(([value,label])=>
            <option key={value} value={value}>{label}</option>)}
        </Select>
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-3">
        <Button type="submit" className="min-h-11 md:min-h-9">
          Apply filters
        </Button>
        <Link href="/learn/attendance/calendar"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Clear</Link>
      </div>
    </form>
    <div className="grid gap-3 md:grid-cols-4" aria-label="Filtered attendance totals">
      {([
        ["Marked",data.summary.marked],
        ["Present",data.summary.present],
        ["Not marked",data.summary.unmarked],
        ["Scheduled",data.summary.scheduled],
      ] as const).map(([label,value])=>
        <StatTile key={label} label={label} value={value} />)}
    </div>
    <p className="text-sm text-body">
      {data.summary.total} recorded class{data.summary.total===1?"":"es"} match the filters.
      {" "}Attendance percentage: <Badge tone="neutral">{data.summary.percentage===null
        ?"Unknown (no marked classes)" : data.summary.percentage+"%"}</Badge>.
    </p>
    <section aria-label={monthLabel+" attendance calendar"} className={monthStyles.calendarCard}>
      <div className={monthStyles.toolbar}>
        <Link href={previous} aria-label="Previous month"
          className={monthStyles.navLink+" inline-flex min-h-11 items-center md:min-h-9"}>← Previous</Link>
        <h2 className={monthStyles.period}>{monthLabel}</h2>
        <Link href={next} aria-label="Next month"
          className={monthStyles.navLink+" inline-flex min-h-11 items-center md:min-h-9"}>Next →</Link>
      </div>
      <CalendarGrid className={monthStyles.mobileGrid+" p-3 md:p-5"}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day,index)=>
          <span key={day} className={monthStyles.mobileWeekday+" "+(index===0?calendarStyles.calendarSunday:"")}>{day}</span>)}
        {days.map((day,index)=>{
          if(!day) return <div key={"pad-"+index} aria-hidden="true"/>;
          const entries=byDay.get(day)??[];
          const label=Number(day.slice(-2));
          return <div key={day}
            aria-label={day+": "+entries.length+" matching classes"}
            className={monthStyles.mobileDay}>
            <div className={monthStyles.dayNumber+" "+(new Date(day+"T12:00:00Z").getUTCDay()===0?calendarStyles.calendarSunday:"")}>{label}</div>
            {entries.length>0?<div className={monthStyles.mobileCount}>
              {entries.length} class{entries.length===1?"":"es"}
            </div>:null}
            <div className="mt-1 hidden flex-wrap gap-1 md:flex">
              {entries.slice(0,3).map(row=>
                <span key={row.id} title={row.courseCode+" · "+statusNames[row.status]}
                  className={"h-1.5 w-1.5 rounded-[50%] "+(row.status==="PRESENT"?"bg-success":row.status==="ABSENT"?"bg-error":"bg-primary")}/>)}
            </div>
          </div>;
        })}
      </CalendarGrid>
    </section>
    <section aria-label="Attendance class entries" className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Class details</h2>
      {data.rows.length===0
        ? <EmptyState title="No recorded classes match"
            description={data.hasAnyRecords
              ?"Try another month, Course or status. Missing records are not assumed absent."
              :"Your authorized Course sessions have no registered attendance records yet. This does not mean you were absent."} />
        : <ol className="grid gap-3 md:grid-cols-2">
          {data.rows.map(row=><li key={row.id}
            className="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-none transition-colors duration-150 hover:border-primary motion-reduce:transition-none md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground">{row.title}</h3>
              <StatusBadge tone={statusTone[row.status]??"neutral"}>
                {statusNames[row.status]??row.status}
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm text-body">{row.courseName} · {row.courseCode}</p>
            <p className="mt-1 text-sm text-body">
              {new Intl.DateTimeFormat("en-IN",{
                dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
              }).format(row.startsAt)} IST
            </p>
            <Link href={"/learn/attendance?"+new URLSearchParams({
              month:data.query.month,deliveryId:row.deliveryId,
            }).toString()}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:text-primary-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
              View Course attendance →
            </Link>
          </li>)}
        </ol>}
    </section>
    <p className="text-xs leading-5 text-muted-foreground">
      Only your own current Course roster is shown. Scheduled and unmarked
      classes are never treated as Present or Absent. A percentage is shown only
      for classes with recorded marks. Data is read-only; ask your college to
      correct a disputed marking.
    </p>
  </div>;
}
