import { FilterBar } from "@/components/ui/filter-bar";
import { Disclosure } from "@/components/ui/disclosure";
import { SummaryStrip } from "@/components/ui/summary-strip";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/ui/calendar-grid";
import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
import monthStyles from "@/components/academics/legacy-class-month-grid.module.css";
import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  attendanceCalendarDayKey, attendanceCalendarDays,
  attendanceCalendarHref, learnerAttendanceCalendarQuerySchema,
  shiftAttendanceCalendarMonth,
} from "@/modules/attendance/learner-attendance-calendar-model";
import { getOwnLearnerAttendanceCalendar } from "@/modules/attendance/learner-attendance-calendar-service";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatNumberIN } from "@/lib/safe-format";
import { istDateTimeFormatter } from "@/lib/format-date";
import { createDateFormatter } from "@/lib/format-date";

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
      action={<TextLink href="/learn/attendance/calendar" className="inline-flex min-h-11 items-center text-sm md:min-h-9">Clear filters</TextLink>}/>
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
  const monthLabel=createDateFormatter("en-IN", {month:"long",year:"numeric",timeZone:"UTC"})
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

  return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Attendance calendar"
      actions={<ButtonLink variant="secondary" href={sourceLink}>
        Attendance detail
      </ButtonLink>} />
    <FilterBar title="Filters"><form action="/learn/attendance/calendar" method="get"
      className="grid min-w-0 gap-3 pb-4 md:grid-cols-3">
      <Label stack>Month
        <DateInput mode="month" name="month" defaultValue={data.query.month}
          className="min-h-11 md:min-h-9" />
      </Label>
      <Label stack>Course
        <Select name="deliveryId" defaultValue={data.query.deliveryId}
          className="min-h-11 w-full md:min-h-9">
          <option value="ALL">All accessible Courses</option>
          {data.courses.map(course=>
            <option key={course.deliveryId} value={course.deliveryId}>
              {course.courseCode} · {course.courseName}
            </option>)}
        </Select>
      </Label>
      <Label stack>Status
        <Select name="status" defaultValue={data.query.status}
          className="min-h-11 w-full md:min-h-9">
          <option value="ALL">All status types</option>
          {Object.entries(statusNames).map(([value,label])=>
            <option key={value} value={value}>{label}</option>)}
        </Select>
      </Label>
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 md:col-span-3">
        <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">
          Apply filters
        </Button>
        <TextLink href="/learn/attendance/calendar"
          className="inline-flex min-h-11 w-full items-center justify-center text-sm sm:w-auto md:min-h-9">Clear</TextLink>
      </div>
    </form></FilterBar>
    <Disclosure title="Filtered attendance totals" className="border-b border-border" contentClassName="min-w-0 space-y-3 pb-4">
    <SummaryStrip label="Filtered attendance totals" steps={[
      {label:"Marked",value:data.summary.marked},
      {label:"Present",value:data.summary.present},
      {label:"Not marked",value:data.summary.unmarked},
      {label:"Scheduled",value:data.summary.scheduled},
    ]} />
    <p className="text-sm text-body">
      {formatNumberIN(data.summary.total)} recorded class{data.summary.total===1?"":"es"} match the filters.
      {" "}Attendance percentage: <Badge tone="neutral">{data.summary.percentage===null
        ?"Unknown (no marked classes)" : data.summary.percentage+"%"}</Badge>.
    </p>
    </Disclosure>
    <section aria-label={monthLabel+" attendance calendar"} className={monthStyles["calendarCard"]}>
      <div className={monthStyles["toolbar"]}>
        <TextLink variant="bare" href={previous} aria-label="Previous month"
          className={monthStyles["navLink"]}>← Previous</TextLink>
        <Heading level={2} className={monthStyles["period"]}>{monthLabel}</Heading>
        <TextLink variant="bare" href={next} aria-label="Next month"
          className={monthStyles["navLink"]}>Next →</TextLink>
      </div>
      <CalendarGrid className={monthStyles["mobileGrid"]+" p-1 sm:p-3 md:p-6"}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day,index)=>
          <span key={day} className={monthStyles["mobileWeekday"]+" "+(index===0?calendarStyles["calendarSunday"]:"")}>{day}</span>)}
        {days.map((day,index)=>{
          if(!day) return <div key={"pad-"+index} aria-hidden="true"/>;
          const entries=byDay.get(day)??[];
          const label=Number(day.slice(-2));
          return <div key={day}
            aria-label={day+": "+entries.length+" matching classes"}
            className={monthStyles["mobileDay"]}>
            <div className={monthStyles["dayNumber"]+" "+(new Date(day+"T12:00:00Z").getUTCDay()===0?calendarStyles["calendarSunday"]:"")}>{label}</div>
            {entries.length>0?<div className={monthStyles["mobileCount"]}>
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
    <section aria-label="Attendance class entries" className="min-w-0 space-y-3">
      <Heading level={2} size="lg" className="text-[var(--lms-heading)]">Class details</Heading>
      {data.rows.length===0
        ? <EmptyState title="No recorded classes match"
            description={data.hasAnyRecords
              ?"Try another month, Course or status. Missing records are not assumed absent."
              :"Your authorized Course sessions have no registered attendance records yet. This does not mean you were absent."} />
        : <ol className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
          {data.rows.map(row=><li key={row.id}
            className="min-w-0 py-[var(--lms-space-3)]">
            <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between">
              <Heading level={3} className="text-[var(--lms-heading)]">{row.title}</Heading>
              <StatusBadge tone={statusTone[row.status]??"neutral"}>
                {statusNames[row.status]??row.status}
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm text-body">{row.courseName} · {row.courseCode}</p>
            <p className="mt-1 text-sm text-body">
              {istDateTimeFormatter.format(row.startsAt)} IST
            </p>
            <TextLink href={"/learn/attendance?"+new URLSearchParams({
              month:data.query.month,deliveryId:row.deliveryId,
            }).toString()}
              className="mt-2 inline-flex min-h-11 w-full items-center justify-center text-sm sm:w-auto md:min-h-9">
              View Course attendance →
            </TextLink>
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
