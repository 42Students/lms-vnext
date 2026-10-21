import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {Pagination} from "@/components/ui/pagination";
import {CollegeContentCsvExport} from "./college-content-csv-export";
import {CollegeContentPreview} from "./college-content-preview";
import {collegeLiveClassHref} from "@/modules/courses/college-live-classes-model";
import {liveClassIstSchedule} from "@/modules/courses/college-live-classes-model";
import type {listCollegeContentAggregate} from "@/modules/courses/college-content-aggregate-service";
type Data=Awaited<ReturnType<typeof listCollegeContentAggregate>>;
/** Authorized source must provide this URL; never reconstruct it from IDs.
 * Treat invalid or credentialed URLs as unavailable.
 */
export function safeCollegeLiveMeetingUrl(raw:unknown):string|null{
 if(typeof raw!=="string"||raw.length>2048||/\s/.test(raw))return null;
 try{
  const parsed=new URL(raw);
  return parsed.protocol==="https:"&&!parsed.username&&!parsed.password
    ? parsed.toString():null;
 }catch{return null;}
}
export function CollegeLiveClassesDirectory({data,showHeader=true}:{data:Data;showHeader?:boolean}){
 return <div className="min-w-0 space-y-4">
  {showHeader?<PageHeader title="Live Classes"
    description="Saved lesson sessions in your college. Meeting links are available only through authorized course workspaces."
    actions={<CollegeContentCsvExport filename={"live-classes-page-"+data.query.page+".csv"}
     rows={data.items.map(item=>({title:item.title,course:item.courseName+" ("+item.courseCode+")",
      lesson:item.lessonName,status:item.status,scope:item.deliveryId?"Section-specific":"Shared",
      visible:item.visibleToStudents?"Visible":"Hidden",details:liveClassIstSchedule(item.startsAt,item.endsAt)}))}/>}/>:null}
  <form method="get" action="/college/live-classes"
    className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-border pb-4 md:grid-cols-2 min-[992px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] print:hidden">
    <label className="grid min-w-0 flex-1 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      Session, lesson or course
      <Input type="search" name="q" maxLength={100} defaultValue={data.query.q}
        className="min-h-11 min-w-0 md:min-h-9"/>
    </label>
    <details className="min-w-0 border-t border-border pt-2 md:col-span-2 min-[992px]:col-span-4" open={Boolean(data.query.courseCode||data.query.deliveryId||data.query.scope!=="ALL"||data.view!=="ALL"||data.from||data.to)||undefined}>
      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Filters</summary>
      <div className="grid min-w-0 grid-cols-1 gap-3 pt-3 md:grid-cols-2 min-[992px]:grid-cols-4">
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      Course code (exact)
      <Input type="search" name="courseCode" maxLength={64} defaultValue={data.query.courseCode??""}
        placeholder="e.g. CS101"
        className="min-h-11 min-w-0 md:min-h-9"/>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      Publication
      <Select name="status" defaultValue={data.query.status}
        className="min-h-11 md:min-h-9">
        <option value="ALL">All statuses</option><option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option>
      </Select>
    </label>
    <label className="grid min-w-48 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Section
      <Select name="deliveryId" defaultValue={data.query.deliveryId??""}
        className="min-h-11 md:min-h-9">
        <option value="">All classes</option>
        {data.sectionOptions.map(option=><option key={option.deliveryId} value={option.deliveryId}>
          {option.courseCode} · {option.sectionName} ({option.sectionCode})
        </option>)}
      </Select>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Session audience
      <Select name="scope" defaultValue={data.query.scope}
        className="min-h-11 md:min-h-9">
        <option value="ALL">All audiences</option><option value="SHARED">Shared offering</option>
        <option value="SECTION">Section-specific</option>
      </Select>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Timing
      <Select name="view" defaultValue={data.view}
        className="min-h-11 md:min-h-9">
        <option value="ALL">All sessions</option><option value="UPCOMING">Upcoming or ongoing</option>
        <option value="PAST">Past sessions</option>
      </Select>
    </label>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">From (IST)
      <DateInput mode="date" name="from" defaultValue={data.from??""}
        className="min-h-11 md:min-h-9"/>
    </label>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Through (IST)
      <DateInput mode="date" name="to" defaultValue={data.to??""}
        className="min-h-11 md:min-h-9"/>
    </label>
      </div>
    </details>
    <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
    <Link href="/college/live-classes" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-[var(--lms-body-text)] transition-colors hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear</Link>
  </form>
  <section aria-label="Persisted live classes" className="border-y border-border">
    <p className="border-b border-border p-4 text-sm text-muted-foreground">{data.total} matching live classes</p>
    {data.items.length===0?<p className="p-6 text-sm text-body">No saved sessions match these filters.</p>:
      <div className="divide-y divide-border">{data.items.map(item=><article key={item.id} className="min-w-0 space-y-2 px-1 py-4 md:px-4">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
          <h2 className="min-w-0 break-words font-semibold text-foreground">{item.title}</h2>
          <CollegeContentPreview data={{title:item.title,course:item.courseName,lesson:item.lessonName,
           type:item.contentType,status:item.status,scope:item.deliveryId?"Section-specific":"Shared",
           visible:item.visibleToStudents,details:liveClassIstSchedule(item.startsAt,item.endsAt)}}/>
          <StatusBadge tone={item.status==="PUBLISHED"?"success":item.status==="ARCHIVED"?"neutral":"warning"}>{item.status}</StatusBadge>
        </div>
        <p className="text-sm text-body">{liveClassIstSchedule(item.startsAt,item.endsAt)}</p>
        {"meetingUrl" in item
          ? safeCollegeLiveMeetingUrl(item.meetingUrl)
            ? <a href={safeCollegeLiveMeetingUrl(item.meetingUrl)!} target="_blank"
                rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">
                Join ↗</a>
            : <p role="status" className="text-xs text-muted-foreground">
                {item.meetingUrl?"Invalid link":"No link"}</p>
          : <p className="text-xs text-muted-foreground">
              Meeting link is available only in an authorized course workspace.</p>}
        <p className="text-xs text-muted-foreground">{item.deliveryId?"Section-specific session":"Shared offering session"}</p>
        <p className="break-words text-sm text-body">Lesson: {item.lessonName} · {item.cohortName} · {item.periodName}</p>
        <Link href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}
          className="inline-flex min-h-11 max-w-full items-center break-words text-sm font-semibold text-primary-text hover:text-primary-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          {item.courseName} ({item.courseCode})
        </Link>
      </article>)}</div>}
  </section>
  <Pagination page={data.query.page} pageCount={data.totalPages}
    hrefForPage={page=>collegeLiveClassHref({...data.query,view:data.view,from:data.from,to:data.to,page})}
    label="Live class pagination" showBoundaryLinks={false}/>
 </div>;
}
