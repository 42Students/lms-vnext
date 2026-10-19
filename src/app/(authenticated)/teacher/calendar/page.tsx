import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ScrollCue } from "@/components/ui/scroll-cue";
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
    <h1 className="font-semibold text-[30px] text-[var(--lms-heading)]">Invalid month or Section filter</h1>
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
    <PageHeader title="Class Schedule" />
    <div className="flex justify-end">
      <Link href="/teacher/live-classes"
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        View live classes
      </Link>
    </div>
    <section className="space-y-4 border-b border-border pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {new Intl.DateTimeFormat("en-IN",{timeZone:"UTC",month:"long",year:"numeric"})
            .format(new Date(grid.query.month+"-01T12:00:00.000Z"))} · IST
        </h2>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link href={facultyMonthHref({...grid.query,month:shiftMonth(grid.query.month,-1)})}
            className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] px-2 text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous month</Link>
          <Link href={facultyMonthHref({...grid.query,month:currentIstMonth(new Date())})}
            className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] px-2 text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Current month</Link>
          <Link href={facultyMonthHref({...grid.query,month:shiftMonth(grid.query.month,1)})}
            className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] px-2 text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next month</Link>
        </div>
      </div>
      <form method="get" action="/teacher/calendar" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm font-semibold text-body">Month (IST)
          <Input type="month" name="month" required defaultValue={grid.query.month}
            min="1900-01" max="2099-12"
             />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Teaching Section
          <Select name="deliveryId" defaultValue={selected??""} >
            <option value="">All my Sections</option>
            {schedule.courses.map(course=><option key={course.deliveryId} value={course.deliveryId}>
              {course.courseCode} · {course.courseName}
            </option>)}
          </Select>
        </label>
        <Button type="submit" variant="primary">
          Apply
        </Button>
      </form>
      {schedule.courses.length===0?<p className="mt-5 text-sm text-body">
        No current teaching assignments. Your college has not assigned a course Section.
      </p>:grid.days.every(day=>day.events.length===0)?<p className="mt-5 text-sm text-body">
        No persisted scheduled sessions in this IST month for the selected teaching Sections.
      </p>:null}
      <ScrollCue axis="x" label="IST month schedule grid; scroll horizontally for all weekdays" className="mt-4 rounded-[var(--lms-control-radius)]">
        <div className="grid min-w-[44rem] grid-cols-7 gap-px rounded-[var(--lms-control-radius)] border border-border bg-border">
          {names.map(name=><div key={name} className="bg-surface-subtle p-2 text-center text-xs font-semibold">{name}</div>)}
          {grid.days.map(day=><section key={day.key}
            aria-label={day.key+" IST"} className={"min-h-28 p-2 "+(day.inMonth?"bg-surface":"bg-surface-subtle")}>
            <time dateTime={day.key} className="text-xs font-semibold text-foreground">
              {Number(day.key.slice(8))}
            </time>
            <div className="mt-2 space-y-2">
              {day.events.map(event=><article key={event.id}
                className="rounded-[var(--lms-control-radius)] border border-border bg-background px-2 py-1">
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
        </div>
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
