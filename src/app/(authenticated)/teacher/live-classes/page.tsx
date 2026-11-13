import { Pagination } from "@/components/ui/pagination";
import { Disclosure } from "@/components/ui/disclosure";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {FacultyLiveClassEditor} from "@/components/courses/faculty-live-class-editor";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {facultyLiveClassesHref,facultyLiveClassesQuerySchema} from "@/modules/courses/faculty-live-classes-model";
import {getFacultyLiveClasses} from "@/modules/courses/faculty-live-classes-service";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { formatNumberIN } from "@/lib/safe-format";
import { istDateTimeFormatter } from "@/lib/format-date";
import { first } from "@/lib/shared";
type Params={view?:string|string[];deliveryId?:string|string[];page?:string|string[]};
export default async function Page({searchParams}:{searchParams:Promise<Params>}){
 const raw=await searchParams;
 const parsed=facultyLiveClassesQuerySchema.safeParse({
  view:first(raw.view)??undefined,deliveryId:first(raw.deliveryId)??undefined,
  page:first(raw.page)??undefined,
 });
 if(!parsed.success)return <section role="alert" className="space-y-3">
  <PageHeader title={"Invalid live-class filters"} /><TextLink href="/teacher/live-classes" className="inline-flex min-h-11 items-center md:min-h-9">Clear filters</TextLink>
 </section>;
 const data=await getFacultyLiveClasses(await getCurrentRequestContext(),parsed.data);
 return <div className="min-w-0 max-w-full space-y-6">
  <PageHeader eyebrow="Faculty · Courses" title="Live classes"
   description="Registered published live sessions for your active teaching Sections."
   actions={<TextLink href="/teacher/courses" className="inline-flex min-h-11 items-center">My teaching courses</TextLink>} />
  <Disclosure title="Schedule or manage a live class" className="min-w-0 border-y border-border" contentClassName="min-w-0 pb-4 pt-3">
    <FacultyLiveClassEditor
      choices={data.lessonChoices}
      sessions={data.items.map(item=>({
        id:item.id,deliveryId:item.deliveryId,title:item.title,
        courseName:item.courseName,sectionName:item.sectionName,
        startsAt:item.startsAt.toISOString(),endsAt:item.endsAt.toISOString(),
        meetingUrl:item.joinUrl,
        expectedUpdatedAt:item.updatedAt?.toISOString()??null,
      }))}
    />
  </Disclosure>
  <form role="search" aria-label="teacher live classes filters" action="/teacher/live-classes" method="get"
   className="grid min-w-0 gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto_auto] lg:items-end">
   <Label stack className="min-w-0">When
    <Select name="view" defaultValue={data.query.view}
     className="text-sm">
     <option value="UPCOMING">Upcoming and in progress</option>
     <option value="PAST">Past</option>
     <option value="ALL">All</option>
    </Select></Label>
   <Label stack className="w-full min-w-0">Section
    <Select name="deliveryId" defaultValue={data.query.deliveryId??""}
     className="text-sm">
     <option value="">All assigned Sections</option>
     {data.courses.map(c=><option key={c.deliveryId} value={c.deliveryId}>
      {c.courseName} · {c.sectionName}
     </option>)}
    </Select></Label>
   <Button type="submit" className="w-full lg:w-auto">Filter</Button>
   <TextLink href="/teacher/live-classes" className="inline-flex min-h-11 items-center justify-center p-2 text-sm md:min-h-[var(--lms-control-height)]">Clear</TextLink>
  </form>
  <p className="text-sm leading-[1.6] text-body" role="status" aria-live="polite">{formatNumberIN(data.total)} matching registered live session{data.total===1?"":"s"}</p>
  {data.items.length===0?<EmptyState title="No matching live classes"
   description="No published LIVE_CLASS content matches these filters in your current teaching Sections. Unregistered meetings are not invented."/>
   :<ul className="min-w-0 divide-y divide-border border-y border-border">{data.items.map(s=><li key={s.deliveryId+":"+s.id}
     className="min-w-0 space-y-2 bg-transparent py-4 transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] focus-within:focus-outline motion-reduce:transition-none">
    <Heading level={2} size="base" className="break-words leading-6 text-[var(--lms-heading)]">{s.title}</Heading>
    <p className="text-sm text-body leading-[22px]">{s.courseName} · {s.sectionName}</p>
    <p className="text-sm text-body leading-[22px]">
     {istDateTimeFormatter.format(s.startsAt)} IST
    </p>
    {s.joinUrl?<ThirdPartyLink href={s.joinUrl} label="Open secure meeting link" />:<p className="text-xs text-muted-foreground leading-5">
     Secure meeting link unavailable. Only HTTPS links are exposed.
    </p>}
    <TextLink href={"/teacher/courses/"+encodeURIComponent(s.deliveryId)}
     className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9 text-sm">Open course</TextLink>
   </li>)}</ul>}
  {data.totalPages > 1 ? <Pagination label="Live-class pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>facultyLiveClassesHref({...data.query,page})}/> : null}
  <p className="max-w-prose text-xs leading-5 text-muted-foreground">
   Times use IST for display; links are HTTPS-only and are not written to logs.
   Scheduled Section calendar events without LIVE_CLASS content are not presented as online sessions.
  </p>
 </div>;
}
