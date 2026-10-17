import Link from "next/link";
import { SuperAdminContentAuthoring } from "@/components/courses/super-admin-content-authoring";
import { SuperAdminContentActions } from "@/components/courses/super-admin-content-actions";
import { listSuperAdminContentAuthoringLessons } from "@/modules/courses/super-admin-content-authoring-service";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
 ADMIN_CONTENT_LABELS,adminContentHref,adminContentQuerySchema,
 adminContentTypeLabel,type AdminContentKind,
} from "@/modules/courses/super-admin-content-directory-model";
import { listSuperAdminContentDirectory } from "@/modules/courses/super-admin-content-directory-service";

function ist(value:Date) {
 return new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(value)+" IST";
}
export async function SuperAdminContentDirectoryPage({kind,searchParams}:{
 kind:AdminContentKind;
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 const raw=await searchParams;
 const parsed=adminContentQuerySchema.safeParse({q:raw.q,status:raw.status,page:raw.page});
 const title=ADMIN_CONTENT_LABELS[kind];
 if(!parsed.success)return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin · Courses" title={title}/>
  <ErrorState title="Invalid content filters" description="Review search, status and page."
   action={<Link href={adminContentHref(kind,{})} className="font-semibold text-primary-text">Clear filters</Link>}/>
 </div>;
 const context=await getCurrentRequestContext();
 if(!context.adminScope?.collegeId)return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin · Courses" title={title}/>
  <EmptyState title="Choose a college scope" description="Select a college before browsing persisted course content."/>
 </div>;
 const [data, lessons]=await Promise.all([listSuperAdminContentDirectory(context,kind,parsed.data),listSuperAdminContentAuthoringLessons(context)]);
 const statuses=["ALL","DRAFT","PUBLISHED","ARCHIVED"] as const;
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Courses" title={title}
   description="Manage lesson content in the selected college. Uploaded files and private meeting links remain access controlled."/>
  <SuperAdminContentAuthoring kind={kind} lessons={lessons} allowVideoUpload={false} />
  <form method="get" className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_auto_auto]">
   <label className="grid gap-1 text-sm font-semibold text-body">Search
    <input type="search" name="q" maxLength={100} defaultValue={data.query.q}
     placeholder="Content, lesson or course" className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Status
    <select name="status" defaultValue={data.query.status}
     className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     {statuses.map(status=><option key={status}>{status}</option>)}
    </select>
   </label>
   <button type="submit" className="min-h-11 self-end rounded-md bg-primary px-4 font-semibold text-on-primary">Filter</button>
  </form>
  <p className="text-sm text-muted-foreground">{data.total} matching records · page {data.query.page} of {data.totalPages} · up to 25 per page</p>
  {data.items.length?<div className="grid gap-3 md:grid-cols-2">
   {data.items.map(item=><article key={item.id} className="min-w-0 space-y-2 rounded-xl border border-border bg-surface p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
     <h2 className="m-0 min-w-0 break-words text-base font-semibold text-foreground">{item.title}</h2>
     <StatusBadge tone={item.status==="PUBLISHED"?"success":item.status==="DRAFT"?"warning":"neutral"}>{item.status}</StatusBadge>
    </div>
    <p className="text-sm text-body">{adminContentTypeLabel(item.contentType)} · Lesson: {item.lessonName}</p>
    <p className="text-sm text-body">{item.courseName} ({item.courseCode}) · {item.cohortName}</p>
    <p className="text-xs text-muted-foreground">{item.periodName} · Lesson {item.lessonStatus} · Offering {item.offeringStatus} · Order {item.sequence+1}</p>
    {item.durationSeconds!==null?<p className="text-sm text-body">Duration: {Math.ceil(item.durationSeconds/60)} minutes</p>:null}
    {item.startsAt?<p className="text-sm text-body">Starts: {ist(item.startsAt)}</p>:null}
    {item.endsAt?<p className="text-sm text-body">Ends: {ist(item.endsAt)}</p>:null}
    {item.contentType==="RESOURCE"&&item.notes?<p className="whitespace-pre-wrap text-sm text-body">{item.notes}</p>:null}
    {item.offeringStatus==="ACTIVE"&&item.lessonStatus==="ACTIVE"?
     <SuperAdminContentActions item={item}/>:
     <p className="text-xs text-muted-foreground">Content editing is unavailable for an inactive offering or lesson.</p>}
    {item.offeringStatus==="ACTIVE"&&item.lessonStatus==="ACTIVE"?<Link href={`/admin/courses/offerings/${encodeURIComponent(item.offeringId)}`}
     className="inline-flex min-h-10 items-center font-semibold text-primary-text">Edit, publish or archive →</Link>:null}
   </article>)}
  </div>:<EmptyState title="No content records" description="No matching authored content exists in this college or filter."/>}
  <nav aria-label={title+" pages"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span className="text-muted-foreground">Page {data.query.page} of {data.totalPages}</span>
   <div className="flex gap-3">
    {data.query.page>1?<Link href={adminContentHref(kind,{...data.query,page:data.query.page-1})} className="font-semibold text-primary-text">Previous</Link>:null}
    {data.query.page<data.totalPages?<Link href={adminContentHref(kind,{...data.query,page:data.query.page+1})} className="font-semibold text-primary-text">Next</Link>:null}
   </div>
  </nav>
  <Link href="/admin/courses" className="inline-flex min-h-10 items-center font-semibold text-primary-text">← Courses</Link>
 </div>;
}
