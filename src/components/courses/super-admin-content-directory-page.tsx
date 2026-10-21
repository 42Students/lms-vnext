import { Banner } from "@/components/ui/banner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {safePublicCourseContentUrl} from "@/modules/courses/super-admin-content-public-link-model";
import { SuperAdminContentAuthoring } from "@/components/courses/super-admin-content-authoring";
import { SuperAdminContentActions } from "@/components/courses/super-admin-content-actions";
import { listSuperAdminContentAuthoringLessons } from "@/modules/courses/super-admin-content-authoring-service";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
 ADMIN_CONTENT_LABELS,adminContentHref,adminContentQuerySchema,
 adminContentTypeLabel,effectiveCourseContentVisibleToStudents,type AdminContentKind,
} from "@/modules/courses/super-admin-content-directory-model";
import { listSuperAdminContentDirectory,listSuperAdminContentSectionOptions } from "@/modules/courses/super-admin-content-directory-service";

function publicHttpsHref(value:string|null){
 return safePublicCourseContentUrl(value);
}
function studentContentVisible(item:{
 status:string;visibleToStudents:boolean;lessonStatus:string;
 learningPathStatus:string;offeringStatus:string;courseStatus:string;
}){
 return effectiveCourseContentVisibleToStudents(item);
}
function ist(value:Date) {
 return new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(value)+" IST";
}
export async function SuperAdminContentDirectoryPage({kind,searchParams}:{
 kind:AdminContentKind;
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 const raw=await searchParams;
 const invalidKeys=Object.keys(raw).some(key=>
  !["q","status","page","offeringId","lessonId","deliveryId","scope"].includes(key));
 const duplicated=Object.values(raw).some(Array.isArray);
 const parsed=(invalidKeys||duplicated)
  ?adminContentQuerySchema.safeParse(null)
  :adminContentQuerySchema.safeParse({q:raw.q,status:raw.status,page:raw.page,
    offeringId:raw.offeringId,lessonId:raw.lessonId,deliveryId:raw.deliveryId,scope:raw.scope});
 const title=ADMIN_CONTENT_LABELS[kind];
 if(!parsed.success)return <div className="min-w-0 space-y-4">
  <PageHeader title={title}/>
  <ErrorState title="Invalid content filters" description="Review search, status and page."
   action={<Link href={adminContentHref(kind,{})} className="inline-flex min-h-11 items-center font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Clear filters</Link>}/>
 </div>;
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context))return <div className="min-w-0 space-y-4">
  <PageHeader title={title}/>
  <ErrorState title="Content access denied"
   description="Your account cannot access Super Admin course content."
   action={<PageBackLink href="/dashboard" label="Back to dashboard" />}/>
 </div>;
 if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
  <PageHeader title={title}/>
  <EmptyState title="Select a college to continue" description={"Choose a college in the header above to see its "+title.toLowerCase()+". If your scope was changed but content has not appeared, reselect your college or refresh this page."}/>
  {kind==="VIDEOS"?<section aria-label="Global video policy" className="space-y-2 border-t border-border pt-4">
   <h2 className="text-base font-semibold">Video watched threshold</h2>
   <Banner tone="info">The video "watched" threshold is platform-wide (default 90%, valid range 1–100%). It can be edited only in GLOBAL platform settings, without a selected college.</Banner>
   <Link href="/admin/settings?q=watchedThresholdPercent"
    className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
    Edit GLOBAL video policy in Tenant Settings →
   </Link>
  </section>:null}
 </div>;
 // Directory reads must remain available even when an independent
 // authoring picker or Section-filter options service is temporarily down.
 const [dataResult,lessonsResult,sectionsResult]=await Promise.allSettled([
  listSuperAdminContentDirectory(context,kind,parsed.data),
  listSuperAdminContentAuthoringLessons(context),
  listSuperAdminContentSectionOptions(context),
 ]);
 if(dataResult.status==="rejected")return <div className="min-w-0 space-y-4">
  <PageHeader title={title}/>
  <ErrorState title="Content directory unavailable"
   description="The selected college content could not be loaded. Your filters are unchanged."
   action={<Link href={adminContentHref(kind,parsed.data)}
    className="inline-flex min-h-11 items-center font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Retry loading content</Link>}/>
 </div>;
 const data=dataResult.value;
 const lessons=lessonsResult.status==="fulfilled"?lessonsResult.value:[];
 const sections=sectionsResult.status==="fulfilled"?sectionsResult.value:[];
 const offerings=[...new Map(lessons.map(item=>[item.offeringId,{id:item.offeringId,name:item.courseCode+" · "+item.courseName}])).values()];
 const statuses=["ALL","DRAFT","PUBLISHED","ARCHIVED"] as const;
 return <div className="min-w-0 space-y-4">
  <PageBackLink href="/admin/courses" label="Courses" />
  <PageHeader title={title}
   description={kind==="VIDEOS"?"Upload a video or link a YouTube video to a lesson.":kind==="LIVE_CLASSES"?"Schedule a live class with a meeting link on a lesson.":"Manage lesson resources in the selected college."} />
  {kind==="VIDEOS"?<Banner tone="info">
   The video "watched" threshold is platform-wide. Clear the selected college before
   editing its GLOBAL setting. <Link href="/admin/settings?q=watchedThresholdPercent"
   className="font-semibold text-primary-text underline">Open Tenant Settings</Link>.
  </Banner>:null}
  {lessonsResult.status==="fulfilled"
   ?<SuperAdminContentAuthoring kind={kind} lessons={lessons} allowVideoUpload={false}/>
   :<Banner tone="warning">Course and lesson authoring choices could not be loaded.
    Existing content remains available. <Link href={adminContentHref(kind,parsed.data)}
      className="font-semibold underline">Retry loading course and lesson choices</Link>
   </Banner>}
  {sectionsResult.status==="rejected"?<Banner tone="warning">Classes could not be loaded.
   Your selected filters still apply. <Link href={adminContentHref(kind,parsed.data)}
     className="font-semibold underline">Retry loading classes</Link>
  </Banner>:null}
  <form method="get" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]">
   <div className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_auto]">
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search
     <Input type="search" name="q" maxLength={100} defaultValue={data.query.q}
      placeholder="Content, lesson or course" className="min-h-11 md:min-h-9"/>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
     <Select name="status" defaultValue={data.query.status} className="min-h-11 md:min-h-9">
      {statuses.map(status=><option key={status}>{status}</option>)}
     </Select>
    </label>
    <Button type="submit" className="min-h-11 w-full self-end sm:col-span-2 md:col-span-1 md:min-h-9 md:w-auto">Filter</Button>
   </div>
   <details className="min-w-0" open={Boolean(data.query.offeringId || data.query.lessonId || data.query.deliveryId || data.query.scope !== "ALL")}>
    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Filters</summary>
    <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2 xl:grid-cols-4">
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course / offering
      <Select name="offeringId" defaultValue={data.query.offeringId??""} className="min-h-11 md:min-h-9">
       <option value="">All courses</option>{offerings.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}
      </Select>
     </label>
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Lesson
      <Select name="lessonId" defaultValue={data.query.lessonId??""} className="min-h-11 md:min-h-9">
       <option value="">All lessons</option>{lessons.filter(x=>!data.query.offeringId||x.offeringId===data.query.offeringId).map(item=><option key={item.id} value={item.id}>{item.name} · {item.courseCode}</option>)}
      </Select>
     </label>
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Section
      <Select name="deliveryId" defaultValue={data.query.deliveryId??""} className="min-h-11 md:min-h-9">
       <option value="">All sections</option>{sections.filter(x=>!data.query.offeringId||x.offeringId===data.query.offeringId).map(item=><option key={item.id} value={item.id}>{item.courseCode} · {item.sectionName}</option>)}
      </Select>
     </label>
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Audience
      <Select name="scope" defaultValue={data.query.scope} className="min-h-11 md:min-h-9">
       <option value="ALL">All audiences</option><option value="SHARED">All currently eligible sections</option><option value="SECTION">One specific section</option>
      </Select>
     </label>
    </div>
   </details>
   <Link href={adminContentHref(kind,{})} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear filters</Link>
  </form>
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
   <p className="m-0 break-words text-sm text-muted-foreground">{data.total} matching records · page {data.query.page} of {data.totalPages} · up to 25 per page</p>
   <div className="flex flex-wrap items-center gap-2" aria-label="Existing Content toolbar">
    <Link href={adminContentHref(kind,data.query)} className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text md:min-h-9">Refresh</Link>
    <a href={"/api/courses/admin-content-export?"+new URLSearchParams({
     kind,q:data.query.q,status:data.query.status,
     ...(data.query.offeringId?{offeringId:data.query.offeringId}:{}),
     ...(data.query.lessonId?{lessonId:data.query.lessonId}:{}),
     ...(data.query.deliveryId?{deliveryId:data.query.deliveryId}:{}),
     scope:data.query.scope,
    }).toString()}
      className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text md:min-h-9">
      Export CSV
    </a>
   </div>
  </div>
  {data.items.length?<div role="table" aria-label={"Existing "+title} className="min-w-0 border-y border-border">
   <div role="row" className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] gap-3 border-b border-border py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground xl:grid">
    {["Title","Type","Order","Students","Content","Action"].map(column=>
     <span role="columnheader" key={column}>{column}</span>)}
   </div>
   {data.items.map(item=><article role="row" key={item.id}
    className="grid min-w-0 grid-cols-1 gap-3 border-b border-border py-4 last:border-b-0 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
    <div role="cell" className="min-w-0">
     <h2 className="m-0 break-words text-sm font-semibold text-foreground">{item.title}</h2>
     <p className="mt-1 break-words text-xs text-muted-foreground">{item.courseName} ({item.courseCode}) · {item.lessonName}</p>
     <p className="mt-1 break-words text-xs text-muted-foreground">{item.cohortName} · {item.periodName}</p>
    </div>
    <div role="cell" className="min-w-0 space-y-1">
     <span className="block text-xs font-semibold text-muted-foreground xl:hidden">Type</span>
     <p className="break-words text-sm text-body">{adminContentTypeLabel(item.contentType)}</p>
     <StatusBadge tone={item.status==="PUBLISHED"?"success":item.status==="DRAFT"?"warning":"neutral"}>{item.status}</StatusBadge>
    </div>
    <div role="cell" className="min-w-0 text-sm text-body">
     <span className="block text-xs font-semibold text-muted-foreground xl:hidden">Order</span>
     {item.sequence+1}
    </div>
    <div role="cell" className="min-w-0 space-y-2">
     <span className="block text-xs font-semibold text-muted-foreground xl:hidden">Students</span>
     <StatusBadge tone={item.visibleToStudents?"success":"neutral"}>
      {item.visibleToStudents?"Visible flag":"Hidden flag"}
     </StatusBadge>
     <div><StatusBadge tone={studentContentVisible(item)?"success":"neutral"}>
       {studentContentVisible(item)?"Effective: visible":"Effective: hidden"}
     </StatusBadge></div>
     <p className="text-xs text-muted-foreground">Requires published content, lesson and offering ancestry.</p>
    </div>
    <div role="cell" className="min-w-0 space-y-1">
     <span className="block text-xs font-semibold text-muted-foreground xl:hidden">Content</span>
     <p className="text-xs text-muted-foreground">
       {item.contentType==="RESOURCE"
        ?"Materials: "+item.materialCount
        :"Points: "+item.points}
     </p>
     {publicHttpsHref(item.externalUrl)?
      <ThirdPartyLink href={publicHttpsHref(item.externalUrl)!} label="Open public link"/>:null}
     {item.durationSeconds!==null?<p className="text-xs text-body">Duration: {Math.ceil(item.durationSeconds/60)} minutes</p>:null}
     {item.startsAt?<p className="text-xs text-body">Starts: {ist(item.startsAt)}</p>:null}
     {item.endsAt?<p className="text-xs text-body">Ends: {ist(item.endsAt)}</p>:null}
     {item.contentType==="RESOURCE"&&item.notes?<p className="whitespace-pre-wrap break-words text-xs text-body">{item.notes}</p>:null}
     {item.contentType==="RESOURCE"&&item.materials.some(material=>material.kind==="FILE")?
      <p className="text-xs text-muted-foreground">Private files open through a scoped signed grant from the lesson.</p>:null}
    </div>
    <div role="cell" className="min-w-0">
     <span className="block text-xs font-semibold text-muted-foreground xl:hidden">Action</span>
     {item.offeringStatus==="ACTIVE"&&item.lessonStatus==="ACTIVE"?
      <details className="min-w-0">
       <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline md:min-h-9">Actions</summary>
       <div className="min-w-0 space-y-2 pt-2">
        <SuperAdminContentActions item={item}/>
        <Link href={`/admin/courses/offerings/${encodeURIComponent(item.offeringId)}`}
         className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
         Edit, publish or archive →
        </Link>
       </div>
      </details>:<p className="text-xs text-muted-foreground">Unavailable on inactive offerings or lessons.</p>}
    </div>
   </article>)}
  </div>:<EmptyState title="No content found." description="Select a course and lesson to view content."
   action={<Link href={adminContentHref(kind,{})} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Clear filters</Link>}/>}
  <Pagination label={title+" pages"} page={data.query.page} pageCount={data.totalPages}
    hrefForPage={page=>adminContentHref(kind,{...data.query,page})}/>
 </div>;
}
