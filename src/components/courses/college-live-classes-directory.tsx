import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
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
      <input type="search" name="q" maxLength={100} defaultValue={data.query.q}
        className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground"/>
    </label>
    <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">
      Course code (exact)
      <input type="search" name="courseCode" maxLength={64} defaultValue={data.query.courseCode??""}
        placeholder="e.g. CS101"
        className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground"/>
    </label>
    <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">
      Publication
      <select name="status" defaultValue={data.query.status}
        className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
        <option value="ALL">All statuses</option><option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option>
      </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold text-body">Timing
      <select name="view" defaultValue={data.view}
        className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
        <option value="ALL">All sessions</option><option value="UPCOMING">Upcoming or ongoing</option>
        <option value="PAST">Past sessions</option>
      </select>
    </label>
    <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
    <Link href="/college/live-classes" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Clear</Link>
  </form>
  <section aria-label="Persisted live classes" className="rounded-xl border border-border bg-surface">
    <p className="border-b border-border p-4 text-sm text-muted-foreground">{data.total} matching live classes</p>
    {data.items.length===0?<p className="p-5 text-sm text-body">No saved sessions match these filters.</p>:
      <div className="divide-y divide-border">{data.items.map(item=><article key={item.id} className="min-w-0 space-y-2 p-4">
        <div className="flex flex-wrap justify-between gap-2">
          <h2 className="min-w-0 break-words font-semibold text-foreground">{item.title}</h2>
          <span className="text-xs text-muted-foreground">{item.status}</span>
        </div>
        <p className="text-sm text-body">{liveClassIstSchedule(item.startsAt,item.endsAt)}</p>
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
      {data.query.page>1?<Link href={collegeLiveClassHref({...data.query,view:data.view,page:data.query.page-1})}
        className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Previous</Link>:null}
      {data.query.page<data.totalPages?<Link href={collegeLiveClassHref({...data.query,view:data.view,page:data.query.page+1})}
        className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Next</Link>:null}
    </div>
  </nav>
 </div>;
}
