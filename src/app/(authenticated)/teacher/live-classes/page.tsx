import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {FacultyLiveClassEditor} from "@/components/courses/faculty-live-class-editor";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {facultyLiveClassesHref,facultyLiveClassesQuerySchema} from "@/modules/courses/faculty-live-classes-model";
import {getFacultyLiveClasses} from "@/modules/courses/faculty-live-classes-service";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
type Params={view?:string|string[];deliveryId?:string|string[];page?:string|string[]};
function first(v:string|string[]|undefined){return Array.isArray(v)?v[0]:v;}
export default async function Page({searchParams}:{searchParams:Promise<Params>}){
 const raw=await searchParams;
 const parsed=facultyLiveClassesQuerySchema.safeParse({
  view:first(raw.view)??undefined,deliveryId:first(raw.deliveryId)??undefined,
  page:first(raw.page)??undefined,
 });
 if(!parsed.success)return <section role="alert" className="space-y-3">
  <PageHeader title={"Invalid live-class filters"} /><Link href="/teacher/live-classes" className="underline inline-flex min-h-11 items-center md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>
 </section>;
 const data=await getFacultyLiveClasses(await getCurrentRequestContext(),parsed.data);
 return <div className="min-w-0 max-w-full space-y-6">
  <PageHeader eyebrow="Faculty · Courses" title="Live classes"
   description="Registered published live sessions for your active teaching Sections." />
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
  <form action="/teacher/live-classes" method="get"
   className="flex min-w-0 flex-wrap items-end gap-3 border-b border-border pb-4">
   <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">When
    <Select name="view" defaultValue={data.query.view}
     className="text-sm">
     <option value="UPCOMING">Upcoming and in progress</option>
     <option value="PAST">Past</option>
     <option value="ALL">All</option>
    </Select></label>
   <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Section
    <Select name="deliveryId" defaultValue={data.query.deliveryId??""}
     className="text-sm">
     <option value="">All assigned Sections</option>
     {data.courses.map(c=><option key={c.deliveryId} value={c.deliveryId}>
      {c.courseName} · {c.sectionName}
     </option>)}
    </Select></label>
   <Button type="submit" className="min-h-11 md:min-h-9">Filter</Button>
   <Link href="/teacher/live-classes" className="inline-flex min-h-11 items-center p-2 text-sm text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear</Link>
  </form>
  <p className="text-sm text-body" role="status" aria-live="polite">{data.total} matching registered live session{data.total===1?"":"s"}</p>
  {data.items.length===0?<EmptyState title="No matching live classes"
   description="No published LIVE_CLASS content matches these filters in your current teaching Sections. Unregistered meetings are not invented."/>
   :<ul className="min-w-0 divide-y divide-border border-y border-border">{data.items.map(s=><li key={s.deliveryId+":"+s.id}
     className="min-w-0 space-y-2 bg-transparent py-4 transition-colors duration-150 hover:bg-[rgba(38,186,199,0.045)] focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-[var(--lms-primary-text)] motion-reduce:transition-none md:py-6">
    <h2 className="font-semibold text-foreground">{s.title}</h2>
    <p className="text-sm text-body">{s.courseName} · {s.sectionName}</p>
    <p className="text-sm text-body">
     {new Intl.DateTimeFormat("en-IN",{
      dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
     }).format(s.startsAt)} IST
    </p>
    {s.joinUrl?<ThirdPartyLink href={s.joinUrl} label="Open secure meeting link" />:<p className="text-xs text-muted-foreground">
     Secure meeting link unavailable. Only HTTPS links are exposed.
    </p>}
    <Link href={"/teacher/courses/"+encodeURIComponent(s.deliveryId)}
     className="inline-flex min-h-11 items-center md:min-h-9 text-sm text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open course</Link>
   </li>)}</ul>}
  <Pagination label="Live-class pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>facultyLiveClassesHref({...data.query,page})}/>
  <p className="text-xs text-muted-foreground">
   Times use IST for display; links are HTTPS-only and are not written to logs.
   Scheduled Section calendar events without LIVE_CLASS content are not presented as online sessions.
  </p>
 </div>;
}
