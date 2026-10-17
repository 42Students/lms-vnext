import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { LearnerClassSchedule,type LearnerScheduleEvent }
  from "@/components/academics/learner-class-schedule";
import {
  currentIstMonth,facultyMonthHref,facultyMonthQuerySchema,shiftMonth,
} from "@/modules/courses/faculty-ist-month-model";
import { getFacultyIstMonth } from "@/modules/courses/faculty-ist-month-service";

type Params={month?:string|string[];deliveryId?:string|string[]};
const first=(raw:string|string[]|undefined)=>Array.isArray(raw)?raw[0]:raw;

export default async function FacultyCalendarPage({
  searchParams,
}:{searchParams:Promise<Params>}) {
  const raw=await searchParams;
  const input=facultyMonthQuerySchema.safeParse({
    month:first(raw.month)??currentIstMonth(new Date()),
    deliveryId:first(raw.deliveryId)||undefined,
  });
  if(!input.success)return <section role="alert" className="space-y-3">
    <h1 className="text-lg font-semibold">Invalid month or Section filter</h1>
    <Link href="/teacher/calendar" className="font-semibold text-primary-text underline">
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
  return <div className="space-y-6">
    <PageHeader title="Class Schedule" />
    <div className="flex justify-end">
      <Link href="/teacher/live-classes"
        className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
        View live classes
      </Link>
    </div>
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {new Intl.DateTimeFormat("en-IN",{timeZone:"UTC",month:"long",year:"numeric"})
            .format(new Date(grid.query.month+"-01T12:00:00.000Z"))} · IST
        </h2>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link href={facultyMonthHref({...grid.query,month:shiftMonth(grid.query.month,-1)})}
            className="inline-flex min-h-11 items-center rounded-md px-2 text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">Previous month</Link>
          <Link href={facultyMonthHref({...grid.query,month:currentIstMonth(new Date())})}
            className="inline-flex min-h-11 items-center rounded-md px-2 text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">Current month</Link>
          <Link href={facultyMonthHref({...grid.query,month:shiftMonth(grid.query.month,1)})}
            className="inline-flex min-h-11 items-center rounded-md px-2 text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">Next month</Link>
        </div>
      </div>
      <form method="get" action="/teacher/calendar" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm font-semibold text-body">Month (IST)
          <input type="month" name="month" required defaultValue={grid.query.month}
            min="1900-01" max="2099-12"
            className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Teaching Section
          <select name="deliveryId" defaultValue={selected??""}
            className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="">All my Sections</option>
            {schedule.courses.map(course=><option key={course.deliveryId} value={course.deliveryId}>
              {course.courseCode} · {course.courseName}
            </option>)}
          </select>
        </label>
        <button type="submit" className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
          Apply
        </button>
      </form>
      {schedule.courses.length===0?<p className="mt-5 text-sm text-body">
        No current teaching assignments. Your college has not assigned a course Section.
      </p>:grid.days.every(day=>day.events.length===0)?<p className="mt-5 text-sm text-body">
        No persisted scheduled sessions in this IST month for the selected teaching Sections.
      </p>:null}
      <div className="mt-4 overflow-x-auto rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]" role="region" aria-label="IST month schedule grid; scroll horizontally for all weekdays" tabIndex={0}>
        <div className="grid min-w-[44rem] grid-cols-7 gap-px rounded-lg border border-border bg-border">
          {names.map(name=><div key={name} className="bg-surface-subtle p-2 text-center text-xs font-semibold">{name}</div>)}
          {grid.days.map(day=><section key={day.key}
            aria-label={day.key+" IST"} className={"min-h-28 p-2 "+(day.inMonth?"bg-surface":"bg-surface-subtle")}>
            <time dateTime={day.key} className="text-xs font-semibold text-foreground">
              {Number(day.key.slice(8))}
            </time>
            <div className="mt-2 space-y-2">
              {day.events.map(event=><article key={event.id}
                className="rounded-md border border-border bg-background px-2 py-1">
                <p className="text-xs font-semibold text-foreground">{event.title}</p>
                <p className="text-xs text-body">
                  {new Intl.DateTimeFormat("en-IN",{
                    timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",
                  }).format(event.startsAt)} IST
                </p>
                {event.deliveryId?<Link
                  href={"/teacher/courses/"+encodeURIComponent(event.deliveryId)+"/home"}
                  className="text-xs font-semibold text-primary-text hover:underline">Course Section</Link>
                :<span className="text-xs text-muted-foreground">Section-wide session</span>}
              </article>)}
            </div>
          </section>)}
        </div>
      </div>
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
