import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import {lessonContentOrderRuntimeEnabled} from "@/modules/courses/lesson-content-order-readiness";
import { COLLEGE_COURSE_TAB_COPY } from "@/modules/courses/college-course-tabs-copy";
import { CollegeStudentVisibilityControl } from "./college-student-visibility-control";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {CollegeContentCsvExport} from "./college-content-csv-export";
import {CollegeContentPreview} from "./college-content-preview";
import {
  collegeContentDuration,
  collegeContentHref,
  collegeContentScopeLabel,
} from "@/modules/courses/college-content-aggregate-model";
import type { listCollegeContentAggregate } from "@/modules/courses/college-content-aggregate-service";

type Data = Awaited<ReturnType<typeof listCollegeContentAggregate>>;
type Item=Data["items"][number];
function contentTypeLabel(type:string){
 switch(type){
  case "VIDEO":return "Video";
  case "YOUTUBE":return "YouTube";
  case "LIVE_CLASS":return "Live class";
  case "RESOURCE":return "Resource";
  case "ASSIGNMENT":return "Assignment";
  default:return type.replaceAll("_"," ").toLowerCase();
 }
}
function materialCountLabel(item:Item){
 const verified=item.materialsCount;
 const pending=item.legacyMaterialsPending;
 if(verified===null)return pending?"Pending import ("+pending+")":"Unavailable";
 return pending?verified+" verified · "+pending+" pending import":String(verified);
}
function contentDetails(item:Item){
 return <details className="mt-2 text-xs text-muted-foreground">
  <summary className="cursor-pointer font-semibold text-primary-text">Course and lesson details</summary>
  <p>{item.courseName} ({item.courseCode}) · {item.cohortName} · {item.periodName}</p>
  <p>{item.lessonName} · {item.learningPathTitle} ({item.learningPathStatus})</p>
  <p>{collegeContentScopeLabel(item.deliveryId)} · {item.status}</p>
 </details>;
}

export function CollegeContentAggregate({ data, showHeader = true }: { data: Data; showHeader?: boolean }) {
  const videos = data.kind === "VIDEO";
  const title = videos ? COLLEGE_COURSE_TAB_COPY.videosTitle : "Resources";
  const path = videos ? "/college/videos" : "/college/resources";
  const courseChoices=[...new Map(data.sectionOptions.map(option=>[option.courseCode,{
   code:option.courseCode,name:option.courseName,
  }])).values()].sort((a,b)=>a.code.localeCompare(b.code));
  const selectedLesson=Boolean(data.query.courseCode&&data.query.lessonId);
  return (
    <div className="min-w-0 space-y-6 md:space-y-6">
      {showHeader ? <PageHeader
        eyebrow="College Admin · Courses & Content"
        title={title}
        actions={
          <Link href="/college/lessons"
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Lessons
          </Link>
        }
      /> : null}
      <section aria-label={title + " filters"} className="border-b border-border pb-4 print:hidden">
        <form method="get" action={path} className="flex min-w-0 flex-wrap items-end gap-3">
          <label className="grid w-full min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)] sm:w-[260px]">
            Course
            <Select name="courseCode" defaultValue={data.query.courseCode??""}
              className="min-h-11 md:min-h-9">
              <option value="">Select course</option>
              {courseChoices.map(option=><option key={option.code} value={option.code}>
                {option.name} ({option.code})
              </option>)}
              {data.query.courseCode&&!courseChoices.some(option=>option.code===data.query.courseCode)?
               <option value={data.query.courseCode}>{data.query.courseCode} (unavailable)</option>:null}
            </Select>
          </label>
          <label className="grid w-full min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)] sm:w-[260px]">
            Lesson
            <Select name="lessonId" defaultValue={data.query.lessonId??""}
              disabled={!data.query.courseCode} className="min-h-11 md:min-h-9">
              <option value="">Select lesson</option>
              {data.lessonOptions.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}
              {data.query.lessonId&&!data.lessonOptions.some(option=>option.id===data.query.lessonId)?
                <option value={data.query.lessonId}>Selected lesson unavailable</option>:null}
            </Select>
          </label>
          <label className="grid w-full min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)] sm:w-[300px]">
            Class
            <Select name="deliveryId" defaultValue={data.query.deliveryId??""}
              disabled={!data.query.lessonId} className="min-h-11 md:min-h-9">
              <option value="">All classes</option>
              {data.sectionOptions.filter(option=>option.courseCode===data.query.courseCode)
                .map(option=><option key={option.deliveryId} value={option.deliveryId}>
                 {option.sectionName} ({option.sectionCode})
                </option>)}
            </Select>
          </label>
          <label className="grid min-w-56 flex-1 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Title, lesson or course
            <Input type="search" name="q" maxLength={100} defaultValue={data.query.q}
              placeholder="Search authored content"
              className="min-h-11 md:min-h-9" />
          </label>
          <details className="group min-w-0 basis-full" open={Boolean(data.query.programCode || data.query.cohortCode || data.query.periodCode || data.query.departmentName || data.query.deliveryId || data.query.pathStatus !== "ALL" || data.query.offeringType !== "ALL" || data.query.lessonStatus !== "ALL" || data.query.status !== "ALL" || data.query.visibility !== "ALL" || data.query.scope !== "ALL" || data.query.offeringStatus !== "ALL" || (videos && data.query.format !== "ALL"))}>
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-body md:min-h-9">Filters</summary>
            <div className="grid min-w-0 gap-3 pt-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid min-w-36 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Program code (exact)
            <Input name="programCode" type="search" maxLength={64} defaultValue={data.query.programCode ?? ""}
              className="min-h-11 md:min-h-9" />
          </label>
          <label className="grid min-w-36 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Batch code (exact)
            <Input name="cohortCode" type="search" maxLength={64} defaultValue={data.query.cohortCode??""}
              className="min-h-11 md:min-h-9" />
          </label>
          <label className="grid min-w-36 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Academic period code (exact)
            <Input name="periodCode" type="search" maxLength={64} defaultValue={data.query.periodCode ?? ""}
              className="min-h-11 md:min-h-9" />
          </label>
          <label className="grid min-w-36 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Learning path status
            <Select name="pathStatus" defaultValue={data.query.pathStatus??"ALL"}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All learning paths</option>
              <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </label>
          <label className="grid min-w-36 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Course department name
            <Input name="departmentName" type="search" maxLength={255} defaultValue={data.query.departmentName??""}
              className="min-h-11 md:min-h-9"/>
          </label>
          <label className="grid min-w-36 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Course offering type
            <Select name="offeringType" defaultValue={data.query.offeringType??"ALL"}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All offering types</option><option value="CORE">Core</option><option value="ELECTIVE">Elective</option>
            </Select>
          </label>
          <label className="grid min-w-36 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Owning lesson state
            <Select name="lessonStatus" defaultValue={data.query.lessonStatus??"ALL"}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All lessons</option><option value="ACTIVE">Active lesson</option><option value="ARCHIVED">Archived lesson</option>
            </Select>
          </label>
          <label className="grid min-w-36 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Content status
            <Select name="status" defaultValue={data.query.status}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </label>
          {videos ? (
            <label className="grid min-w-36 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
              Video format
              <Select name="format" defaultValue={data.query.format}
                className="min-h-11 md:min-h-9">
                <option value="ALL">All video formats</option>
                <option value="VIDEO">Stored video</option>
                <option value="YOUTUBE">YouTube</option>
              </Select>
            </label>
          ) : null}
          <label className="grid min-w-36 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Visible to students
            <Select name="visibility" defaultValue={data.query.visibility}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All visibility settings</option>
              <option value="VISIBLE">Visible</option>
              <option value="HIDDEN">Hidden</option>
            </Select>
          </label>
          <label className="grid min-w-36 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Owning offering status
            <Select name="offeringStatus" defaultValue={data.query.offeringStatus??"ALL"}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All offerings</option><option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </label>
          <label className="grid min-w-36 gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Audience scope
            <Select name="scope" defaultValue={data.query.scope}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All scopes</option><option value="SHARED">Shared offering</option>
              <option value="SECTION">Section-specific</option>
            </Select>
          </label>
          </div></details>
          <Button type="submit"
            className="min-h-11 w-full md:min-h-9 md:w-auto">
            Filter
          </Button>
          <Link href={path}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text transition-colors hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Clear
          </Link>
        </form>
      </section>
      <CollegeContentCsvExport legacyLessonContent={videos} filename={videos?"lesson-content.csv":"resources-page-"+data.query.page+".csv"}
       rows={(selectedLesson?data.items:[]).map(item=>({
        id:item.id,type:item.contentType,sequence:item.sequence,points:item.points,
        deadline:item.dueAt?.toISOString()??"",durationSeconds:item.durationSeconds,
        active:item.status==="PUBLISHED",enabled:item.visibleToStudents,
        title:item.title,course:item.courseName+" ("+item.courseCode+")",
        lesson:item.lessonName,status:item.status,scope:collegeContentScopeLabel(item.deliveryId),
        visible:item.visibleToStudents?"Visible":"Hidden",
        details:videos?collegeContentDuration(item.durationSeconds):"Materials: "+(item.materialsCount??"Unavailable")}))}/>
      {!videos?<p className="text-xs text-muted-foreground">
        Materials counts cover registered additional materials only; a legacy Resource HTTPS link is stored separately.
        {data.materialCountsReady?"":" Counts require the verified DB05 Resource Materials runtime."}
      </p>:null}
      <section aria-label={title+" catalogue"}
       className="min-w-0 overflow-x-auto border-y border-border print:overflow-visible">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border px-3 py-3">
          <p className="text-sm text-muted-foreground">
            {selectedLesson?data.total+" matching "+(data.total===1?"record":"records"):
             "Select a course and lesson to view existing content."}
          </p>
          <Link href={collegeContentHref(data.kind,{...data.query,page:1})}
           className="text-xs font-semibold text-primary-text hover:underline">Refresh</Link>
        </div>
        {!selectedLesson?<p className="p-6 text-center text-sm text-muted-foreground">
          Choose Course, then Lesson, and press Filter to load the Existing Content table.
        </p>:data.items.length===0?<p role="status" className="p-6 text-center text-sm text-muted-foreground">
          {data.total===0?"No content found":"No records on this page. Choose an earlier page."}
        </p>:<DataTable
          caption={videos?"Existing Content":"Resources"}
          rows={data.items}
          getRowKey={item=>item.id}
          columns={videos?[
            {key:"title",header:"Title",mobilePriority:"primary" as const,
             cell:(item:Item)=><div className="min-w-[160px]">
              <p className="font-semibold text-foreground">{item.title}</p>{contentDetails(item)}
             </div>},
            {key:"type",header:"Type",mobilePriority:"secondary" as const,
             cell:(item:Item)=><span>{contentTypeLabel(item.contentType)}</span>},
            {key:"order",header:"Order",mobilePriority:"secondary" as const,
             cell:(item:Item)=><span>{item.sequence+1}</span>},
            {key:"students",header:"Students",mobilePriority:"secondary" as const,
             cell:(item:Item)=><StatusBadge tone={item.visibleToStudents?"success":"neutral"}>
              {item.visibleToStudents?"Visible":"Hidden"}
             </StatusBadge>},
            {key:"content",header:"Content",mobilePriority:"secondary" as const,
             cell:(item:Item)=><div>
              <CollegeContentPreview playback={item.playback} data={{
               title:item.title,course:item.courseName,lesson:item.lessonName,
               type:item.contentType,status:item.status,scope:collegeContentScopeLabel(item.deliveryId),
               visible:item.visibleToStudents,details:collegeContentDuration(item.durationSeconds)}}/>
              <p className="text-xs text-muted-foreground">{collegeContentDuration(item.durationSeconds)}</p>
             </div>},
            {key:"action",header:"Action",mobilePriority:"action" as const,
             cell:(item:Item)=><div className="flex min-w-28 flex-wrap items-center gap-2">
              {item.status!=="ARCHIVED"?<CollegeStudentVisibilityControl
               contentId={item.id} initialVisible={item.visibleToStudents}
               initialUpdatedAt={item.updatedAt.toISOString()}/>:null}
              <Link className="text-xs font-semibold text-primary-text hover:underline"
               href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}>Manage</Link>
             </div>},
          ]:[
            {key:"title",header:"Title",mobilePriority:"primary" as const,
             cell:(item:Item)=><div className="min-w-[160px]">
              <p className="font-semibold text-foreground">{item.title}</p>{contentDetails(item)}
             </div>},
            {key:"visibility",header:"Visibility",mobilePriority:"secondary" as const,
             cell:(item:Item)=><StatusBadge tone={item.status==="PUBLISHED"?"success":"neutral"}>
              {item.status==="PUBLISHED"?"Published":item.status==="DRAFT"?"Draft":"Archived"}
             </StatusBadge>},
            {key:"students",header:"Students",mobilePriority:"secondary" as const,
             cell:(item:Item)=><StatusBadge tone={item.visibleToStudents?"success":"neutral"}>
              {item.visibleToStudents?"Visible":"Hidden"}
             </StatusBadge>},
            {key:"materials",header:"Materials",mobilePriority:"secondary" as const,
             cell:(item:Item)=><div>
              <span>{materialCountLabel(item)}</span>
              {item.legacyFilesPending>0?<p className="text-xs text-warning-text">
                {item.legacyFilesPending} file(s) require verified import
              </p>:null}
             </div>},
            {key:"action",header:"Action",mobilePriority:"action" as const,
             cell:(item:Item)=><div className="flex min-w-28 flex-wrap items-center gap-2">
              <CollegeContentPreview playback={item.playback} data={{
               title:item.title,course:item.courseName,lesson:item.lessonName,
               type:item.contentType,status:item.status,scope:collegeContentScopeLabel(item.deliveryId),
               visible:item.visibleToStudents,details:materialCountLabel(item)}}/>
              {item.status!=="ARCHIVED"?<CollegeStudentVisibilityControl contentId={item.id}
               initialVisible={item.visibleToStudents}
               initialUpdatedAt={item.updatedAt.toISOString()}/>:null}
              <Link className="text-xs font-semibold text-primary-text hover:underline"
               href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}>Manage</Link>
             </div>},
          ]}
        />}
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <form method="get" action={path} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="courseCode" value={data.query.courseCode??""}/>
          <input type="hidden" name="lessonId" value={data.query.lessonId??""}/>
          {data.query.q?<input type="hidden" name="q" value={data.query.q}/>:null}
          <label className="text-xs text-muted-foreground" htmlFor="content-page-size">Rows per page</label>
          <Select id="content-page-size" name="pageSize" defaultValue={String(data.pageSize)}
           className="min-h-9 w-24">
            {[10,15,25,50,100].map(size=><option key={size} value={size}>{size}</option>)}
          </Select>
          <Button type="submit" size="sm" variant="secondary">Apply</Button>
          <span className="text-xs text-muted-foreground">
            {selectedLesson&&data.total?((data.query.page-1)*data.pageSize+1)+"–"+
             Math.min(data.total,data.query.page*data.pageSize)+" of "+data.total:"0 of 0"}
          </span>
        </form>
        {selectedLesson?<Pagination page={data.query.page} pageCount={data.totalPages}
         hrefForPage={page=>collegeContentHref(data.kind,{...data.query,page,pageSize:data.pageSize})}
         label={title+" pagination"} showBoundaryLinks={false}/>:null}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        This catalogue shows authorization-scoped content metadata. Publishing state does not by itself grant learner visibility.
        No storage key or permanent playback URL is returned here. Verified stored videos
        resolve a short-lived signed View grant only after a staff action.
        Historical file keys and Resource JSON children need verified private-storage import
        before they can be opened. Use the authoring controls or offering workspace to manage content.
      </p>
    </div>
  );
}
