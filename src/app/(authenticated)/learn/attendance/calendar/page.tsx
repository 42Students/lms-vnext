import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
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
const statusClass:Record<string,string> = {
  PRESENT:"bg-success-subtle text-success",
  ABSENT:"bg-error-subtle text-error",
  EXCUSED:"bg-warning-subtle text-warning",
  MEDICAL:"bg-warning-subtle text-warning",
  LATE:"bg-warning-subtle text-warning",
  NOT_MARKED:"bg-muted text-body",
  SCHEDULED:"bg-primary-subtle text-primary-text",
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
  if(!parsed.success) return <section role="alert" className="space-y-3">
    <h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Invalid attendance calendar filters</h1>
    <Link href="/learn/attendance/calendar" className="text-primary-text underline">
      Clear filters
    </Link>
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
      actions={<Link href={sourceLink} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">
        Attendance detail
      </Link>} />
    <form action="/learn/attendance/calendar" method="get"
      className="grid gap-3 border-b border-border pb-4 sm:grid-cols-3">
      <label className="grid gap-1 text-sm font-semibold text-body">Month
        <Input name="month" type="month" defaultValue={data.query.month}
          className="min-h-9 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Course
        <Select name="deliveryId" defaultValue={data.query.deliveryId}
          className="min-h-9 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All accessible Courses</option>
          {data.courses.map(course=>
            <option key={course.deliveryId} value={course.deliveryId}>
              {course.courseCode} · {course.courseName}
            </option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Status
        <Select name="status" defaultValue={data.query.status}
          className="min-h-9 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
          <option value="ALL">All status types</option>
          {Object.entries(statusNames).map(([value,label])=>
            <option key={value} value={value}>{label}</option>)}
        </Select>
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
        <Button variant="secondary" type="submit" className="min-h-9 rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-[var(--lms-on-primary)] hover:bg-primary-hover sm:min-h-9">
          Apply filters
        </Button>
        <Link href="/learn/attendance/calendar"
          className="text-sm font-semibold text-primary-text">Clear</Link>
      </div>
    </form>
    <div className="grid gap-3 sm:grid-cols-4" aria-label="Filtered attendance totals">
      {([
        ["Marked",data.summary.marked],
        ["Present",data.summary.present],
        ["Not marked",data.summary.unmarked],
        ["Scheduled",data.summary.scheduled],
      ] as const).map(([label,value])=>
        <section key={label} className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">{label}</h2>
          <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
        </section>)}
    </div>
    <p className="text-sm text-body">
      {data.summary.total} recorded class{data.summary.total===1?"":"es"} match the filters.
      {" "}Attendance percentage: {data.summary.percentage===null
        ?"Unknown (no marked classes)" : data.summary.percentage+"%"}.
    </p>
    <section aria-label={monthLabel+" attendance calendar"} className="rounded-xl border border-border bg-surface p-3 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={previous} aria-label="Previous month"
          className="inline-flex min-h-9 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text">← Previous</Link>
        <h2 className="text-lg font-semibold text-foreground">{monthLabel}</h2>
        <Link href={next} aria-label="Next month"
          className="inline-flex min-h-9 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text">Next →</Link>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground sm:gap-2">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=>
          <span key={day} className="py-1">{day}</span>)}
        {days.map((day,index)=>{
          if(!day) return <div key={"pad-"+index} aria-hidden="true"/>;
          const entries=byDay.get(day)??[];
          const label=Number(day.slice(-2));
          return <div key={day}
            aria-label={day+": "+entries.length+" matching classes"}
            className="min-h-14 rounded-[var(--lms-control-radius)] border border-border p-1 sm:min-h-20 sm:p-2">
            <div className="text-right font-semibold text-foreground">{label}</div>
            {entries.length>0?<div className="mt-1 rounded bg-primary-subtle px-1 py-0.5 text-center text-xs font-semibold text-primary-text">
              {entries.length} class{entries.length===1?"":"es"}
            </div>:null}
            <div className="mt-1 hidden flex-wrap gap-1 sm:flex">
              {entries.slice(0,3).map(row=>
                <span key={row.id} title={row.courseCode+" · "+statusNames[row.status]}
                  className={"h-1.5 w-1.5 rounded-full "+(row.status==="PRESENT"?"bg-success":row.status==="ABSENT"?"bg-error":"bg-primary")}/>)}
            </div>
          </div>;
        })}
      </div>
    </section>
    <section aria-label="Attendance class entries" className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Class details</h2>
      {data.rows.length===0
        ? <EmptyState title="No recorded classes match"
            description={data.hasAnyRecords
              ?"Try another month, Course or status. Missing records are not assumed absent."
              :"Your authorized Course sessions have no registered attendance records yet. This does not mean you were absent."} />
        : <ol className="grid gap-3 sm:grid-cols-2">
          {data.rows.map(row=><li key={row.id}
            className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground">{row.title}</h3>
              <span className={"rounded-full px-2 py-1 text-xs font-semibold "+(statusClass[row.status]??"bg-muted text-body")}>
                {statusNames[row.status]??row.status}
              </span>
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
              className="mt-3 inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text hover:underline">
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
