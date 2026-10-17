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
import { listSuperAdminContentDirectory,listSuperAdminContentSectionOptions } from "@/modules/courses/super-admin-content-directory-service";

function publicHttpsHref(value:string|null){
 if(!value)return null;
 try{
  const url=new URL(value);
  return url.protocol==="https:"?url.toString():null;
 }catch{return null;}
}
function studentContentVisible(item:{status:string;visibleToStudents:boolean;lessonStatus:string;offeringStatus:string}){
 return item.status==="PUBLISHED"&&item.visibleToStudents&&item.lessonStatus==="ACTIVE"&&item.offeringStatus==="ACTIVE";
}
function ist(value:Date) {
 return new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(value)+" IST";
}
export async function SuperAdminContentDirectoryPage({kind,searchParams}:{
 kind:AdminContentKind;
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 const raw=await searchParams;
 const parsed=adminContentQuerySchema.safeParse({q:raw.q,status:raw.status,page:raw.page,
  offeringId:raw.offeringId,lessonId:raw.lessonId,deliveryId:raw.deliveryId,scope:raw.scope});
 const title=ADMIN_CONTENT_LABELS[kind];
 if(!parsed.success)return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin · Courses" title={title}/>
  <ErrorState title="Invalid content filters" description="Review search, status and page."
   action={<Link href={adminContentHref(kind,{})} className="font-semibold text-primary-text">Clear filters</Link>}/>
 </div>;
 const context=await getCurrentRequestContext();
 if(!context.adminScope?.collegeId)return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin · Courses" title={title}/>
  <EmptyState title="Select a college to continue" description={"Choose a college in the header above to see its "+title.toLowerCase()+"."}/>
 </div>;
 const [data, lessons, sections]=await Promise.all([listSuperAdminContentDirectory(context,kind,parsed.data),listSuperAdminContentAuthoringLessons(context),listSuperAdminContentSectionOptions(context)]);
 const offerings=[...new Map(lessons.map(item=>[item.offeringId,{id:item.offeringId,name:item.courseCode+" · "+item.courseName}])).values()];
 const statuses=["ALL","DRAFT","PUBLISHED","ARCHIVED"] as const;
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Courses" title={title}
   description={kind==="VIDEOS"?"Upload a video or link a YouTube video to a lesson.":kind==="LIVE_CLASSES"?"Schedule a live class with a meeting link on a lesson.":"Manage lesson resources in the selected college."}/>
  <SuperAdminContentAuthoring kind={kind} lessons={lessons} allowVideoUpload={false} />
  <form method="get" className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-3">
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
   <label className="grid gap-1 text-sm font-semibold text-body">Course / offering
    <select name="offeringId" defaultValue={data.query.offeringId??""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     <option value="">All courses</option>{offerings.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Lesson
    <select name="lessonId" defaultValue={data.query.lessonId??""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     <option value="">All lessons</option>{lessons.filter(x=>!data.query.offeringId||x.offeringId===data.query.offeringId).map(item=><option key={item.id} value={item.id}>{item.name} · {item.courseCode}</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Section
    <select name="deliveryId" defaultValue={data.query.deliveryId??""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     <option value="">All sections</option>{sections.filter(x=>!data.query.offeringId||x.offeringId===data.query.offeringId).map(item=><option key={item.id} value={item.id}>{item.courseCode} · {item.sectionName}</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Audience
    <select name="scope" defaultValue={data.query.scope} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
      <option value="ALL">All audiences</option><option value="SHARED">All currently eligible sections</option><option value="SECTION">One specific section</option>
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
    <p className="text-xs text-muted-foreground">{item.periodName} · Lesson {item.lessonStatus} · Offering {item.offeringStatus}</p>
    <div className="flex flex-wrap items-center gap-3">
      <StatusBadge tone={studentContentVisible(item)?"success":"neutral"}>Students {studentContentVisible(item)?"Visible":"Hidden"}</StatusBadge>
      <span className="text-xs text-muted-foreground">Order within lesson: {item.sequence+1}</span>
      {item.contentType==="RESOURCE"?<span className="text-xs text-muted-foreground">Linked materials: {publicHttpsHref(item.externalUrl)?1:0}</span>:null}
    </div>
    {publicHttpsHref(item.externalUrl)?<a href={publicHttpsHref(item.externalUrl)??"#"} target="_blank" rel="noopener noreferrer"
      className="inline-flex min-h-10 items-center font-semibold text-primary-text underline">Open public link</a>:null}
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
  </div>:<EmptyState title="No content found." description="Select a course and lesson to view content."/>}
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
