import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Disclosure} from "@/components/ui/disclosure";
import {getFacultyClassSchedule} from "@/modules/courses/faculty-schedule-service";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { CalendarGrid } from "@/components/ui/calendar-grid";
import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
import monthStyles from "@/components/academics/legacy-class-month-grid.module.css";
import { LearnerClassSchedule,type LearnerScheduleEvent }
  from "@/components/academics/learner-class-schedule";
import {
  currentIstMonth,facultyMonthHref,facultyMonthQuerySchema,istDateKey,shiftMonth,
} from "@/modules/courses/faculty-ist-month-model";
import { getFacultyIstMonth } from "@/modules/courses/faculty-ist-month-service";

type Params=Record<string,string|string[]|undefined>;

export default async function FacultyCalendarPage({
  searchParams,
}:{searchParams:Promise<Params>}) {
  const raw=await searchParams;
  const accepted=Object.keys(raw).every(key=>key==="month"||key==="deliveryId")&&
    Object.values(raw).every(value=>!Array.isArray(value));
  const input=facultyMonthQuerySchema.safeParse(accepted?{
    month:raw.month??currentIstMonth(new Date()),
    deliveryId:raw.deliveryId||undefined,
  }:{invalid:true});
  if(!input.success){
    const badKey=["startDate","endDate"].find(key=>key in raw);
    const invalidDate=badKey?"Invalid date '"+badKey+"': "+
      String(raw[badKey]??"").slice(0,100):"Invalid month or Section filter";
    const reversed=typeof raw.startDate==="string"&&typeof raw.endDate==="string"&&
      raw.startDate>raw.endDate;
    return <section role="alert" className="space-y-3">
    <PageHeader title={reversed?"startDate must be before or equal to endDate":invalidDate} />
    <Link href="/teacher/calendar" className="font-semibold text-primary-text underline inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
      Clear filters
    </Link>
  </section>;
  }
  const context=await getCurrentRequestContext();
  const [primary,upcomingRead]=await Promise.all([
    getFacultyIstMonth(context,input.data),
    getFacultyClassSchedule(context).then(value=>({available:true as const,value}))
      .catch(()=>({available:false as const,value:null})),
  ]);
  const {schedule,grid}=primary;
  const nextClasses=upcomingRead.available?
    upcomingRead.value.upcomingEvents
      .filter(item=>!input.data.deliveryId||item.deliveryId===input.data.deliveryId||
        (item.deliveryId===null&&schedule.courses.some(c=>c.deliveryId===input.data.deliveryId&&c.sectionId===item.sectionId)))
      .slice(0,3):[];
  const events:LearnerScheduleEvent[]=schedule.events.map(event=>({
    id:event.id,sectionId:event.sectionId,sectionName:event.sectionName,
    title:event.title,description:event.description,
    startsAt:event.startsAt.toISOString(),endsAt:event.endsAt.toISOString(),
    location:event.location,facultyName:event.facultyName,
    deliveryId:event.deliveryId,courseId:event.courseId,
    courseName:event.courseName,courseCode:event.courseCode,
  }));
  const names=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const todayIst = istDateKey(new Date());
  const selected=grid.query.deliveryId;
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Class Schedule" actions={<Link href="/teacher/live-classes"
      className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">
      View live classes
    </Link>} />
    <section aria-label="Upcoming classes" className="min-w-0 space-y-3 border-b border-border pb-4">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-foreground">Next classes</h2>
      <p className="text-xs text-muted-foreground">{nextClasses.length} coming up · {schedule.courses.length} teaching sections</p>
     </div>
     {!upcomingRead.available?<details open className="min-w-0">
       <summary className="cursor-pointer text-sm font-semibold text-[var(--lms-warning-text)]">Failed to load course data</summary>
       <Alert tone="warning" className="mt-2">
         Calendar events may be incomplete. Your loaded class schedule remains available below.
         <Link href={facultyMonthHref(grid.query)} className="mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">Retry class schedule</Link>
       </Alert>
     </details>:nextClasses.length===0?<p className="text-sm text-muted-foreground">No upcoming classes scheduled in the next 180 days.</p>:
       <ol className="divide-y divide-border border-y border-border">{nextClasses.map(item=><li key={item.id}
         className="flex min-w-0 flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
           <p className="break-words text-sm font-semibold text-foreground">{item.title?.trim()||"Scheduled Class"}</p>
           <p className="text-xs text-body">{new Intl.DateTimeFormat("en-IN",{
             timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
           }).format(item.startsAt)} IST · {item.sectionName}</p>
          </div>
          {item.deliveryId?<Link href={"/teacher/courses/"+encodeURIComponent(item.deliveryId)+"/home"}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Open course →</Link>:
           <span className="text-xs text-muted-foreground">Section-wide class</span>}
         </li>)}</ol>}
    </section>
    <section aria-label="Class schedule" className="min-w-0 border-t border-border pt-4">
      <LearnerClassSchedule sections={schedule.sections} courses={schedule.courses}
        events={events} courseBasePath="/teacher/courses" initialView="week"
        calendarMode="IST"/>
    </section>
    <Disclosure title="Month view" className="min-w-0 border-t border-border pt-4" contentClassName="pt-4">
    <section className="min-w-0">
      <div className="flex min-w-0 flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className={monthStyles.period}>
          {new Intl.DateTimeFormat("en-IN",{timeZone:"UTC",month:"long",year:"numeric"})
            .format(new Date(grid.query.month+"-01T12:00:00.000Z"))} · IST
        </h2>
        <div className={monthStyles.nav}>
          <Link href={facultyMonthHref({...grid.query,month:shiftMonth(grid.query.month,-1)})}
            className={monthStyles.navLink} aria-label="Previous month">←</Link>
          <Link href={facultyMonthHref({...grid.query,month:currentIstMonth(new Date())})}
            className={monthStyles.navLink} aria-label="Today">Today</Link>
          <Link href={facultyMonthHref({...grid.query,month:shiftMonth(grid.query.month,1)})}
            className={monthStyles.navLink} aria-label="Next month">→</Link>
        </div>
      </div>
      <form method="get" action="/teacher/calendar" className="grid min-w-0 gap-3 border-b border-border py-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] lg:items-end">
        <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Month (IST)
    <DateInput mode="month" name="month" defaultValue={grid.query.month}
            min="1900-01" max="2099-12"
             />
        </label>
        {schedule.courses.length>1?<label aria-label="Filter calendar by course" className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course
          <Select name="deliveryId" defaultValue={selected??""} >
            <option value="">All my Sections</option>
            {schedule.courses.map(course=><option key={course.deliveryId} value={course.deliveryId}>
              {course.courseCode} · {course.courseName}
            </option>)}
          </Select>
        </label>:null}
        <Button type="submit" variant="primary" className="w-full sm:col-span-2 lg:col-span-1 lg:w-auto">
          Apply
        </Button>
      </form>
      {schedule.courses.length===0?<Alert tone="info" className="mt-4">
        No current teaching assignments. Your college has not assigned a course Section.
      </Alert>:grid.days.every(day=>day.events.length===0)?<Alert tone="info" className="mt-4">
        No persisted scheduled sessions in this IST month for the selected teaching Sections.
      </Alert>:null}
      <ScrollCue axis="x" label="IST month schedule grid; scroll horizontally for all weekdays" className={monthStyles.scroll}>
        <CalendarGrid variant="hairline" className={monthStyles.grid+" max-[767px]:!min-w-[770px]"}>
          {names.map((name,index)=><div key={name} className={monthStyles.weekday+" "+(index===0?calendarStyles.calendarSunday:"")}>{name}</div>)}
          {grid.days.map(day=><section key={day.key}
            aria-label={day.key+" IST"} data-outside={!day.inMonth} data-today={day.key===todayIst} className={monthStyles.day}>
            <time dateTime={day.key} className={monthStyles.dayNumber+" "+(new Date(day.key+"T12:00:00Z").getUTCDay()===0?calendarStyles.calendarSunday:"")}>
              {Number(day.key.slice(8))}
            </time>
            <div className="mt-2 space-y-2">
              {day.events.map(event=><article key={event.id}
                className={monthStyles.dayEvent+" border-l-4 border-l-primary"}>
                <p className="text-xs font-semibold text-foreground leading-5">{event.title?.trim()||"Scheduled Class"}{event.courseName&&event.courseName!==event.title?" · "+event.courseName:""} ({event.sectionName||"Class"})</p>
                <p className="text-xs text-body leading-5">
                  {new Intl.DateTimeFormat("en-IN",{
                    timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",
                  }).format(event.startsAt)} IST
                </p>
                {event.deliveryId?<Link
                  href={"/teacher/courses/"+encodeURIComponent(event.deliveryId)+"/home"}
                  className="text-xs font-semibold text-primary-text hover:underline inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Course Section</Link>
                :<span className="text-xs text-muted-foreground">Section-wide session</span>}
              </article>)}
            </div>
          </section>)}
        </CalendarGrid>
      </ScrollCue>
      <p className="mt-3 text-xs text-muted-foreground leading-5">
        Month cells use Asia/Kolkata calendar dates, including sessions crossing IST midnight.
        A Section-wide session is shown without guessing a course link.
      </p>
    </section>
    </Disclosure>
  </div>;
}
