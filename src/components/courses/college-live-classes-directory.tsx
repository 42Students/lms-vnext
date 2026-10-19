import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {CollegeContentCsvExport} from "./college-content-csv-export";
import {CollegeContentPreview} from "./college-content-preview";
import {collegeLiveClassHref} from "@/modules/courses/college-live-classes-model";
import {liveClassIstSchedule} from "@/modules/courses/college-live-classes-model";
import type {listCollegeContentAggregate} from "@/modules/courses/college-content-aggregate-service";
type Data=Awaited<ReturnType<typeof listCollegeContentAggregate>>;
export function CollegeLiveClassesDirectory({data}:{data:Data}){
 return <div className="space-y-5">
  <PageHeader eyebrow="College Admin · Courses & Content" title="Live Classes"
    description="Saved lesson sessions in your college. Meeting links are available only through authorized course workspaces."/>
  <form method="get" action="/college/live-classes"
    className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
    <label className="grid min-w-0 flex-1 gap-1 text-sm font-semibold text-body">
      Session, lesson or course
      <Input type="search" name="q" maxLength={100} defaultValue={data.query.q}
        className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground"/>
    </label>
    <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">
      Course code (exact)
      <Input type="search" name="courseCode" maxLength={64} defaultValue={data.query.courseCode??""}
        placeholder="e.g. CS101"
        className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground"/>
    </label>
    <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">
      Publication
      <Select name="status" defaultValue={data.query.status}
        className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
        <option value="ALL">All statuses</option><option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option>
      </Select>
    </label>
    <label className="grid min-w-48 gap-1 text-sm font-semibold text-body">Section
      <Select name="deliveryId" defaultValue={data.query.deliveryId??""}
        className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
        <option value="">All classes</option>
        {data.sectionOptions.map(option=><option key={option.deliveryId} value={option.deliveryId}>
          {option.courseCode} · {option.sectionName} ({option.sectionCode})
        </option>)}
      </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Session audience
      <Select name="scope" defaultValue={data.query.scope}
        className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
        <option value="ALL">All audiences</option><option value="SHARED">Shared offering</option>
        <option value="SECTION">Section-specific</option>
      </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Timing
      <Select name="view" defaultValue={data.view}
        className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
        <option value="ALL">All sessions</option><option value="UPCOMING">Upcoming or ongoing</option>
        <option value="PAST">Past sessions</option>
      </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">From (IST)
      <DateInput mode="date" name="from" defaultValue={data.from??""}
        className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Through (IST)
      <DateInput mode="date" name="to" defaultValue={data.to??""}
        className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
    </label>
    <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
    <Link href="/college/live-classes" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Clear</Link>
  </form>
  <CollegeContentCsvExport filename={"live-classes-page-"+data.query.page+".csv"}
   rows={data.items.map(item=>({title:item.title,course:item.courseName+" ("+item.courseCode+")",
    lesson:item.lessonName,status:item.status,scope:item.deliveryId?"Section-specific":"Shared",
    visible:item.visibleToStudents?"Visible":"Hidden",details:liveClassIstSchedule(item.startsAt,item.endsAt)}))}/>
  <section aria-label="Persisted live classes" className="rounded-xl border border-border bg-surface">
    <p className="border-b border-border p-4 text-sm text-muted-foreground">{data.total} matching live classes</p>
    {data.items.length===0?<p className="p-5 text-sm text-body">No saved sessions match these filters.</p>:
      <div className="divide-y divide-border">{data.items.map(item=><article key={item.id} className="min-w-0 space-y-2 p-4">
        <div className="flex flex-wrap justify-between gap-2">
          <h2 className="min-w-0 break-words font-semibold text-foreground">{item.title}</h2>
          <CollegeContentPreview data={{title:item.title,course:item.courseName,lesson:item.lessonName,
           type:item.contentType,status:item.status,scope:item.deliveryId?"Section-specific":"Shared",
           visible:item.visibleToStudents,details:liveClassIstSchedule(item.startsAt,item.endsAt)}}/>
          <span className="text-xs text-muted-foreground">{item.status}</span>
        </div>
        <p className="text-sm text-body">{liveClassIstSchedule(item.startsAt,item.endsAt)}</p>
        <p className="text-xs text-muted-foreground">{item.deliveryId?"Section-specific session":"Shared offering session"}</p>
        <p className="break-words text-sm text-body">Lesson: {item.lessonName} · {item.cohortName} · {item.periodName}</p>
        <Link href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}
          className="block break-words text-sm font-semibold text-primary-text hover:underline">
          {item.courseName} ({item.courseCode})
        </Link>
      </article>)}</div>}
  </section>
  <nav aria-label="Live class pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
    <span className="text-muted-foreground">Page {data.query.page} of {data.totalPages}</span>
    <div className="flex gap-2">
      {data.query.page>1?<Link href={collegeLiveClassHref({...data.query,view:data.view,from:data.from,to:data.to,page:data.query.page-1})}
        className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Previous</Link>:null}
      {data.query.page<data.totalPages?<Link href={collegeLiveClassHref({...data.query,view:data.view,from:data.from,to:data.to,page:data.query.page+1})}
        className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Next</Link>:null}
    </div>
  </nav>
 </div>;
}
