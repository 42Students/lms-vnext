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
 effectiveCourseContentVisibleToStudents,type AdminContentKind,
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
  !["q","status","page","offeringId","lessonId","deliveryId","scope","lessonSearch","lessonPage"].includes(key));
 const duplicated=Object.values(raw).some(Array.isArray);
 const parsed=(invalidKeys||duplicated)
  ?adminContentQuerySchema.safeParse(null)
  :adminContentQuerySchema.safeParse({q:raw.q,status:raw.status,page:raw.page,
    offeringId:raw.offeringId,lessonId:raw.lessonId,deliveryId:raw.deliveryId,scope:raw.scope});
 const title=ADMIN_CONTENT_LABELS[kind];
 const lessonSearch=typeof raw.lessonSearch==="string"?raw.lessonSearch.trim():"";
 const rawLessonPage=typeof raw.lessonPage==="string"?raw.lessonPage:"1";
 const lessonPage=/^[1-9][0-9]{0,3}$/.test(rawLessonPage)?Number(rawLessonPage):1;
 const invalidLessonQuery=lessonSearch.length>100||
   (raw.lessonPage!==undefined&&!/^[1-9][0-9]{0,3}$/.test(rawLessonPage));
 if(!parsed.success||invalidLessonQuery)return <div className="min-w-0 space-y-4">
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
  listSuperAdminContentAuthoringLessons(context,{search:lessonSearch,pageSize:51,
    offset:(lessonPage-1)*50}),
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
 const authoringRows=lessonsResult.status==="fulfilled"?lessonsResult.value:[];
 const lessons=authoringRows.slice(0,50);
 const hasNextLessons=authoringRows.length>50;
 const authoringPageHref=(targetPage:number)=>{
   const base=adminContentHref(kind,parsed.data);
   const query=new URLSearchParams({
     lessonSearch,lessonPage:String(targetPage),
   });
   return base+(base.includes("?")?"&":"?")+query.toString();
 };
 const sections=sectionsResult.status==="fulfilled"?sectionsResult.value:[];
 const offerings=[...new Map(lessons.map(item=>[item.offeringId,{id:item.offeringId,name:item.courseCode+" · "+item.courseName}])).values()];
 const statuses=["ALL","DRAFT","PUBLISHED","ARCHIVED"] as const;
 return <div className="min-w-0 space-y-4">
  <PageHeader title={title}
   description={kind==="VIDEOS"?"Upload a video or link a YouTube video to a lesson.":kind==="LIVE_CLASSES"?"Schedule a live class with a meeting link on a lesson.":"Give a lesson reading material: files, links and notes, together in one resource."} />
  <nav aria-label="Courses & Content" className="flex min-w-0 flex-wrap items-center gap-2 border-b border-border pb-2">
    {[
      {label:"Courses",href:"/admin/courses"},
      {label:"Lessons",href:"/admin/lessons"},
      {label:"Videos",href:"/admin/videos"},
      {label:"Resources",href:"/admin/resources"},
      {label:"Live classes",href:"/admin/live-classes"},
    ].map(tab=><Link href={tab.href} key={tab.label}
      aria-current={tab.label===title?"page":undefined}
      className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] px-3 text-sm font-semibold md:min-h-9 "+
        (tab.label===title?"bg-primary-subtle text-primary-text":"text-body hover:bg-primary-subtle")}>
      {tab.label}
    </Link>)}
  </nav>
  {kind==="VIDEOS"?<section aria-label="Video policy"
    className="rounded-[var(--lms-radius-card)] border border-border bg-surface p-4">
    <h2 className="text-base font-semibold text-foreground">Video policy</h2>
    <p className="mt-2 text-sm text-body">Video &quot;watched&quot; threshold: 90% by default.
      The platform value is configurable globally between 1% and 100%.</p>
    <Banner tone="info">
      The video &quot;watched&quot; threshold is platform-wide. Clear the selected college
      before editing its GLOBAL setting.{" "}
      <Link href="/admin/settings?q=watchedThresholdPercent"
        className="font-semibold text-primary-text underline">Open Tenant Settings</Link>.
    </Banner>
  </section>:null}
  <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2">
   <section aria-label="Add lesson content"
     className="min-w-0 rounded-[var(--lms-radius-card)] border border-border bg-surface p-4">
    <h2 className="mb-3 text-lg font-semibold text-foreground">
      {kind==="VIDEOS"?"Add Video":kind==="LIVE_CLASSES"?"Add Live Class":"Add Resource"}
    </h2>
  <form method="get" className="mb-3 flex min-w-0 flex-wrap items-end gap-2" role="search">
    {Object.entries({
      q:data.query.q,status:data.query.status,page:String(data.query.page),
      offeringId:data.query.offeringId??"",lessonId:data.query.lessonId??"",
      deliveryId:data.query.deliveryId??"",scope:data.query.scope,
    }).filter(([,value])=>Boolean(value)).map(([key,value])=>
      <input key={key} type="hidden" name={key} value={value}/>)}
    <label className="grid min-w-[12rem] flex-1 gap-1 text-sm font-semibold text-body">
      Find a course or lesson
      <Input name="lessonSearch" type="search" maxLength={100}
        defaultValue={lessonSearch} placeholder="Search course, code or lesson"/>
    </label>
    <Button type="submit" variant="secondary">Find lessons</Button>
  </form>
  {lessonsResult.status==="fulfilled"
   ?<SuperAdminContentAuthoring kind={kind} lessons={lessons} sections={sections} allowVideoUpload/>
   :<Banner tone="warning">Course and lesson authoring choices could not be loaded.
    Existing content remains available. <Link href={adminContentHref(kind,parsed.data)}
      className="font-semibold underline">Retry loading course and lesson choices</Link>
   </Banner>}
  {lessonsResult.status==="fulfilled"?
    <nav aria-label="Authoring lesson pages" className="mt-2 flex items-center justify-between gap-3 text-sm">
      {lessonPage>1?<Link href={authoringPageHref(lessonPage-1)}
        className="font-semibold text-primary-text underline">Previous lessons</Link>:<span/>}
      <span>Lesson page {lessonPage} · Up to 50 lessons per page</span>
      {hasNextLessons?<Link href={authoringPageHref(lessonPage+1)}
        className="font-semibold text-primary-text underline">Next lessons</Link>:<span/>}
    </nav>:null}
  {sectionsResult.status==="rejected"?<Banner tone="warning">Classes could not be loaded.
   Your selected filters still apply. <Link href={adminContentHref(kind,parsed.data)}
     className="font-semibold underline">Retry loading classes</Link>
  </Banner>:null}
   </section>
   <section aria-label="Existing Content"
    className="min-w-0 rounded-[var(--lms-radius-card)] border border-border bg-surface p-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-foreground">Existing Content</h2>
      <Link href={adminContentHref(kind,data.query)}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">
        ↻ Refresh
      </Link>
    </div>
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
   <details className="min-w-0" open>
    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Filters</summary>
    <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2 xl:grid-cols-4">
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course / offering
      <Select name="offeringId" defaultValue={data.query.offeringId??""} className="min-h-11 md:min-h-9">
       <option value="">Choose a course</option>{offerings.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}
      </Select>
     </label>
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Lesson
      <Select name="lessonId" defaultValue={data.query.lessonId??""} className="min-h-11 md:min-h-9">
       <option value="">Choose a lesson</option>{lessons.filter(x=>!data.query.offeringId||x.offeringId===data.query.offeringId).map(item=><option key={item.id} value={item.id}>{item.name} · {item.courseCode}</option>)}
      </Select>
     </label>
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Section
      <Select name="deliveryId" defaultValue={data.query.deliveryId??""} className="min-h-11 md:min-h-9">
       <option value="">All content in this lesson</option>{sections.filter(x=>!data.query.offeringId||x.offeringId===data.query.offeringId).map(item=><option key={item.id} value={item.id}>{item.courseCode} · {item.sectionName}</option>)}
      </Select>
     </label>
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Audience
      <Select name="scope" defaultValue={data.query.scope} className="min-h-11 md:min-h-9">
       <option value="ALL">All audiences</option>
       <option value="SHARED">All currently eligible sections for this course</option>
       <option value="SECTION">One specific section</option>
      </Select>
     </label>
    </div>
   </details>
   <Link href={adminContentHref(kind,{})} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear filters</Link>
  </form>
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
   <p className="m-0 break-words text-sm text-muted-foreground">
      {data.total===0?0:(data.query.page-1)*25+1}–{Math.min(data.total,data.query.page*25)}
      {" "}of {data.total} · Page {data.query.page} of {data.totalPages}
    </p>
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
  {data.items.length?<div role="table" aria-label={"Existing "+title}
    className="min-w-0 overflow-x-auto border-y border-border" tabIndex={0}>
   <div role="row" className="grid min-w-[680px] grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] gap-3 border-b border-border py-3 text-xs font-semibold tracking-wide text-muted-foreground">
    {["Title","Visibility","Students","Materials","Action"].map(column=>
     <span role="columnheader" key={column}>{column}</span>)}
   </div>
   {data.items.map(item=><article role="row" key={item.id}
    className="grid min-w-[680px] grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] gap-3 border-b border-border py-3 last:border-b-0">
    <div role="cell" className="min-w-0">
     <h2 className="m-0 break-words text-sm font-semibold text-foreground">{item.title?.trim()||"Untitled"}</h2>
     <p className="mt-1 break-words text-xs text-muted-foreground">{item.courseName} ({item.courseCode}) · {item.lessonName}</p>
     <p className="mt-1 break-words text-xs text-muted-foreground">{item.cohortName} · {item.periodName}</p>
    </div>
    <div role="cell" className="min-w-0 space-y-1">
      <p className="text-xs font-semibold text-muted-foreground">
        {item.deliveryId?
          sections.find(section=>section.id===item.deliveryId)?.sectionName??"Specific section":
          "All sections"}
      </p>
      <StatusBadge tone="neutral">{item.deliveryId?"One specific section":"Shared"}</StatusBadge>
      <p className="text-xs text-muted-foreground">Order {item.sequence+1}</p>
    </div>
    <div role="cell" className="min-w-0 space-y-2">
     <span className="block text-xs font-semibold text-muted-foreground xl:hidden">Students</span>
     <StatusBadge tone={studentContentVisible(item)?"success":"neutral"}>
       {studentContentVisible(item)?"Visible":"Hidden"}
     </StatusBadge>
     <p className="text-xs text-muted-foreground">Requires published content, lesson and offering ancestry.</p>
    </div>
    <div role="cell" className="min-w-0 space-y-1">
     <span className="block text-xs font-semibold text-muted-foreground xl:hidden">Materials</span>
     <p className="text-xs text-muted-foreground">
       {item.contentType==="RESOURCE"
        ?"Materials: "+item.materialCount
        :"Points: "+item.points}
     </p>
     {publicHttpsHref(item.externalUrl)?
      <ThirdPartyLink href={publicHttpsHref(item.externalUrl)!}
        label={item.contentType==="LIVE_CLASS"?"Join":"View"}/>:<span className="text-xs text-muted-foreground">No link</span>}
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
      <div className="min-w-0 space-y-1">
       <SuperAdminContentActions item={item}/>
       <Link href={`/admin/courses/offerings/${encodeURIComponent(item.offeringId)}`}
        className="inline-flex min-h-9 items-center text-xs text-primary-text underline">
        Open course
       </Link>
      </div>:<p className="text-xs text-muted-foreground">Unavailable on inactive offerings or lessons.</p>}
    </div>
   </article>)}
  </div>:<div className="border border-border p-5 text-sm text-muted-foreground" role="status">
   {data.query.lessonId?"No content found.":"Select a course and lesson to view content."}{" "}
   <Link href={adminContentHref(kind,{})}
     className="font-semibold text-primary-text underline">Clear filters</Link>
  </div>}
  <Pagination label={title+" pages"} page={data.query.page} pageCount={data.totalPages}
    hrefForPage={page=>adminContentHref(kind,{...data.query,page})}/>
  </section>
  </div>
 </div>;
}
