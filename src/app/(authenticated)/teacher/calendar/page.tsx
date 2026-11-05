import {FacultyPrototypeSchedule} from "@/components/courses/faculty-prototype-schedule";
import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Disclosure} from "@/components/ui/disclosure";
import {getFacultyClassSchedule} from "@/modules/courses/faculty-schedule-service";
import { Alert } from "@/components/ui/alert";
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
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";

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
    <TextLink href="/teacher/calendar" className="inline-flex min-h-11 items-center md:min-h-9">
      Clear filters
    </TextLink>
  </section>;
  }
  const context=await getCurrentRequestContext();
  const [primary,upcomingRead,prototypeRead]=await Promise.all([
    getFacultyIstMonth(context,input.data),
    getFacultyClassSchedule(context,{startAt:new Date()}).then(value=>({available:true as const,value}))
      .catch(()=>({available:false as const,value:null})),
    getFacultyClassSchedule(context,{
      startAt:new Date(Date.now()-7*86400000),
      endAt:new Date(Date.now()+35*86400000),
    }).then(value=>({available:true as const,value}))
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
    <PageHeader title="Class Schedule" actions={<ButtonLink variant="secondary" href="/teacher/live-classes"
      className="w-full sm:w-auto">
      View live classes
    </ButtonLink>} />
    {prototypeRead.available?<FacultyPrototypeSchedule
      nowIso={new Date().toISOString()}
      minDate={new Date(Date.now()-7*86400000).toISOString().slice(0,10)}
      maxDate={new Date(Date.now()+35*86400000).toISOString().slice(0,10)}
      events={[...new Map(prototypeRead.value.events.map(e=>[e.id,e] as const)).values()]
        .filter(e=>!selected||e.deliveryId===selected||
          (e.deliveryId===null&&schedule.courses.some(c=>c.deliveryId===selected&&c.sectionId===e.sectionId)))
        .map(e=>({id:e.id,title:e.title,sectionName:e.sectionName,courseCode:e.courseCode,
          startsAt:e.startsAt.toISOString(),location:e.location,deliveryId:e.deliveryId}))}
      />:<Alert tone="warning">Unable to load the weekly schedule. The detailed calendar is still available below.</Alert>}
    <Disclosure title="Advanced schedule and full calendar">
      <div className="mt-4 space-y-4">
    <section aria-label="Upcoming classes" className="min-w-0 space-y-3 border-b border-border pb-4">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <Heading level={2} size="base" className="text-foreground">Next classes</Heading>
      <p className="text-xs text-muted-foreground">{nextClasses.length} coming up · {schedule.courses.length} teaching sections</p>
     </div>
     {!upcomingRead.available?<Disclosure title="Failed to load course data" defaultOpen className="min-w-0">
       <Alert tone="warning" className="mt-2">
         Calendar events may be incomplete. Your loaded class schedule remains available below.
         <TextLink href={facultyMonthHref(grid.query)} className="mt-2 inline-flex min-h-11 items-center md:min-h-9">Retry class schedule</TextLink>
       </Alert>
     </Disclosure>:nextClasses.length===0?<p className="text-sm text-muted-foreground">No upcoming classes scheduled in the next 180 days.</p>:
       <ol className="divide-y divide-border border-y border-border">{nextClasses.map(item=><li key={item.id}
         className="flex min-w-0 flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
           <p className="break-words text-sm font-semibold text-foreground">{item.title?.trim()||"Scheduled Class"}</p>
           <p className="text-xs text-body">{new Intl.DateTimeFormat("en-IN",{
             timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
           }).format(item.startsAt)} IST · {item.sectionName}</p>
          </div>
          {item.deliveryId?<TextLink href={"/teacher/courses/"+encodeURIComponent(item.deliveryId)+"/home"}
            className="inline-flex min-h-11 items-center text-sm md:min-h-9">Open course →</TextLink>:
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
        <Heading level={2} className={monthStyles.period}>
          {new Intl.DateTimeFormat("en-IN",{timeZone:"UTC",month:"long",year:"numeric"})
            .format(new Date(grid.query.month+"-01T12:00:00.000Z"))} · IST
        </Heading>
        <div className={monthStyles.nav}>
          <TextLink variant="bare" href={facultyMonthHref({...grid.query,month:shiftMonth(grid.query.month,-1)})}
            className={monthStyles.navLink} aria-label="Previous month">←</TextLink>
          <TextLink variant="bare" href={facultyMonthHref({...grid.query,month:currentIstMonth(new Date())})}
            className={monthStyles.navLink} aria-label="Today">Today</TextLink>
          <TextLink variant="bare" href={facultyMonthHref({...grid.query,month:shiftMonth(grid.query.month,1)})}
            className={monthStyles.navLink} aria-label="Next month">→</TextLink>
        </div>
      </div>
      <form method="get" action="/teacher/calendar" className="grid min-w-0 gap-3 border-b border-border py-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] lg:items-end">
        <Label stack className="min-w-0">Month (IST)
    <DateInput mode="month" name="month" defaultValue={grid.query.month}
            min="1900-01" max="2099-12"
             />
        </Label>
        {schedule.courses.length>1?<Label stack aria-label="Filter calendar by course" className="min-w-0">Course
          <Select name="deliveryId" defaultValue={selected??""} >
            <option value="">All my Sections</option>
            {schedule.courses.map(course=><option key={course.deliveryId} value={course.deliveryId}>
              {course.courseCode} · {course.courseName}
            </option>)}
          </Select>
        </Label>:null}
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
        <CalendarGrid variant="hairline" className={monthStyles.grid+" max-md:!min-w-[772px]"}>
          {names.map((name,index)=><div key={name} className={monthStyles.weekday+" "+(index===0?calendarStyles.calendarSunday:"")}>{name}</div>)}
          {grid.days.map(day=><section key={day.key}
            aria-label={day.key+" IST"} data-outside={!day.inMonth} data-today={day.key===todayIst} className={monthStyles.day}>
            <time dateTime={day.key} className={monthStyles.dayNumber+" "+(new Date(day.key+"T12:00:00Z").getUTCDay()===0?calendarStyles.calendarSunday:"")}>
              {Number(day.key.slice(8))}
            </time>
            <div className="mt-2 space-y-2">
              {day.events.map(event=><article key={event.id}
                className={monthStyles.dayEvent+" border-l-2 border-l-primary"}>
                <p className="text-xs font-semibold text-foreground leading-5">{event.title?.trim()||"Scheduled Class"}{event.courseName&&event.courseName!==event.title?" · "+event.courseName:""} ({event.sectionName||"Class"})</p>
                <p className="text-xs text-body leading-5">
                  {new Intl.DateTimeFormat("en-IN",{
                    timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",
                  }).format(event.startsAt)} IST
                </p>
                {event.deliveryId?<TextLink
                  href={"/teacher/courses/"+encodeURIComponent(event.deliveryId)+"/home"}
                  className="text-xs inline-flex min-h-11 items-center md:min-h-9">Course Section</TextLink>
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
    </div></Disclosure>
  </div>;
}
