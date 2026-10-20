import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
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
  currentIstMonth,facultyMonthHref,facultyMonthQuerySchema,shiftMonth,
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
  if(!input.success)return <section role="alert" className="space-y-3">
    <PageHeader title={"Invalid month or Section filter"} />
    <Link href="/teacher/calendar" className="font-semibold text-primary-text underline inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      Clear filters
    </Link>
  </section>;
  const context=await getCurrentRequestContext();
  const {schedule,grid}=await getFacultyIstMonth(context,input.data);
  const events:LearnerScheduleEvent[]=schedule.events.map(event=>({
    id:event.id,sectionId:event.sectionId,sectionName:event.sectionName,
    title:event.title,description:event.description,
    startsAt:event.startsAt.toISOString(),endsAt:event.endsAt.toISOString(),
    location:event.location,facultyName:event.facultyName,
    deliveryId:event.deliveryId,courseId:event.courseId,
    courseName:event.courseName,courseCode:event.courseCode,
  }));
  const names=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const selected=grid.query.deliveryId;
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader title="Class Schedule" actions={<Link href="/teacher/live-classes"
        className="inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        View live classes
      </Link>} />
    <section className={monthStyles.calendarCard}>
      <div className={monthStyles.toolbar}>
        <h2 className={monthStyles.period}>
          {new Intl.DateTimeFormat("en-IN",{timeZone:"UTC",month:"long",year:"numeric"})
            .format(new Date(grid.query.month+"-01T12:00:00.000Z"))} · IST
        </h2>
        <div className={monthStyles.nav}>
          <Link href={facultyMonthHref({...grid.query,month:shiftMonth(grid.query.month,-1)})}
            className={monthStyles.navLink}>Previous month</Link>
          <Link href={facultyMonthHref({...grid.query,month:currentIstMonth(new Date())})}
            className={monthStyles.navLink}>Current month</Link>
          <Link href={facultyMonthHref({...grid.query,month:shiftMonth(grid.query.month,1)})}
            className={monthStyles.navLink}>Next month</Link>
        </div>
      </div>
      <form method="get" action="/teacher/calendar" className={monthStyles.toolbarForm}>
        <label className="grid gap-1 text-[13px] font-semibold leading-4 text-body">Month (IST)
          <Input type="month" name="month" required defaultValue={grid.query.month}
            min="1900-01" max="2099-12"
             />
        </label>
        <label className="grid gap-1 text-[13px] font-semibold leading-4 text-body">Teaching Section
          <Select name="deliveryId" defaultValue={selected??""} >
            <option value="">All my Sections</option>
            {schedule.courses.map(course=><option key={course.deliveryId} value={course.deliveryId}>
              {course.courseCode} · {course.courseName}
            </option>)}
          </Select>
        </label>
        <Button type="submit" variant="primary" className="min-h-11 md:min-h-9">
          Apply
        </Button>
      </form>
      {schedule.courses.length===0?<p className="mt-5 text-sm text-body">
        No current teaching assignments. Your college has not assigned a course Section.
      </p>:grid.days.every(day=>day.events.length===0)?<p className="mt-5 text-sm text-body">
        No persisted scheduled sessions in this IST month for the selected teaching Sections.
      </p>:null}
      <ScrollCue axis="x" label="IST month schedule grid; scroll horizontally for all weekdays" className={monthStyles.scroll}>
        <CalendarGrid variant="hairline" className={monthStyles.grid}>
          {names.map((name,index)=><div key={name} className={monthStyles.weekday+" "+(index===0?calendarStyles.calendarSunday:"")}>{name}</div>)}
          {grid.days.map(day=><section key={day.key}
            aria-label={day.key+" IST"} data-outside={!day.inMonth} className={monthStyles.day}>
            <time dateTime={day.key} className={monthStyles.dayNumber+" "+(new Date(day.key+"T12:00:00Z").getUTCDay()===0?calendarStyles.calendarSunday:"")}>
              {Number(day.key.slice(8))}
            </time>
            <div className="mt-2 space-y-2">
              {day.events.map(event=><article key={event.id}
                className={monthStyles.dayEvent}>
                <p className="text-xs font-semibold text-foreground">{event.title}</p>
                <p className="text-xs text-body">
                  {new Intl.DateTimeFormat("en-IN",{
                    timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",
                  }).format(event.startsAt)} IST
                </p>
                {event.deliveryId?<Link
                  href={"/teacher/courses/"+encodeURIComponent(event.deliveryId)+"/home"}
                  className="text-xs font-semibold text-primary-text hover:underline inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Course Section</Link>
                :<span className="text-xs text-muted-foreground">Section-wide session</span>}
              </article>)}
            </div>
          </section>)}
        </CalendarGrid>
      </ScrollCue>
      <p className="mt-3 text-xs text-muted-foreground">
        Month cells use Asia/Kolkata calendar dates, including sessions crossing IST midnight.
        A Section-wide session is shown without guessing a course link.
      </p>
    </section>
    <section aria-label="Detailed class schedule" className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Detailed day/week schedule</h2>
      <LearnerClassSchedule sections={schedule.sections} courses={schedule.courses}
        events={events} courseBasePath="/teacher/courses"
        initialView="week" />
    </section>
  </div>;
}
