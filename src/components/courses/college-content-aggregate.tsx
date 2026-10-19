import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import {lessonContentOrderRuntimeEnabled} from "@/modules/courses/lesson-content-order-readiness";
import { COLLEGE_COURSE_TAB_COPY } from "@/modules/courses/college-course-tabs-copy";
import { CollegeStudentVisibilityControl } from "./college-student-visibility-control";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import {CollegeContentCsvExport} from "./college-content-csv-export";
import {CollegeContentPreview} from "./college-content-preview";
import {
  collegeContentDuration,
  collegeContentHref,
  collegeContentScopeLabel,
} from "@/modules/courses/college-content-aggregate-model";
import type { listCollegeContentAggregate } from "@/modules/courses/college-content-aggregate-service";

type Data = Awaited<ReturnType<typeof listCollegeContentAggregate>>;

export function CollegeContentAggregate({ data }: { data: Data }) {
  const videos = data.kind === "VIDEO";
  const title = videos ? COLLEGE_COURSE_TAB_COPY.videosTitle : "Resources";
  const path = videos ? "/college/videos" : "/college/resources";
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin · Courses & Content"
        title={title}
        actions={
          <Link href="/college/lessons"
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Lessons
          </Link>
        }
      />
      <section aria-label={title + " filters"} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <form method="get" action={path} className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-56 flex-1 gap-1 text-sm font-semibold text-body">
            Title, lesson or course
            <Input type="search" name="q" maxLength={100} defaultValue={data.query.q}
              placeholder="Search authored content"
              className="min-h-11" />
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Course code (exact)
            <Input type="search" name="courseCode" maxLength={64} defaultValue={data.query.courseCode ?? ""}
              placeholder="e.g. CS101"
              className="min-h-11" />
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Program code (exact)
            <Input name="programCode" type="search" maxLength={64} defaultValue={data.query.programCode ?? ""}
              className="min-h-11" />
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Batch code (exact)
            <Input name="cohortCode" type="search" maxLength={64} defaultValue={data.query.cohortCode??""}
              className="min-h-11" />
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Academic period code (exact)
            <Input name="periodCode" type="search" maxLength={64} defaultValue={data.query.periodCode ?? ""}
              className="min-h-11" />
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Learning path status
            <Select name="pathStatus" defaultValue={data.query.pathStatus??"ALL"}
              className="min-h-11">
              <option value="ALL">All learning paths</option>
              <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Course department name
            <Input name="departmentName" type="search" maxLength={255} defaultValue={data.query.departmentName??""}
              className="min-h-11"/>
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Course offering type
            <Select name="offeringType" defaultValue={data.query.offeringType??"ALL"}
              className="min-h-11">
              <option value="ALL">All offering types</option><option value="CORE">Core</option><option value="ELECTIVE">Elective</option>
            </Select>
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Owning lesson state
            <Select name="lessonStatus" defaultValue={data.query.lessonStatus??"ALL"}
              className="min-h-11">
              <option value="ALL">All lessons</option><option value="ACTIVE">Active lesson</option><option value="ARCHIVED">Archived lesson</option>
            </Select>
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Content status
            <Select name="status" defaultValue={data.query.status}
              className="min-h-11">
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </label>
          {videos ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Video format
              <Select name="format" defaultValue={data.query.format}
                className="min-h-11">
                <option value="ALL">All video formats</option>
                <option value="VIDEO">Stored video</option>
                <option value="YOUTUBE">YouTube</option>
              </Select>
            </label>
          ) : null}
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Visible to students
            <Select name="visibility" defaultValue={data.query.visibility}
              className="min-h-11">
              <option value="ALL">All visibility settings</option>
              <option value="VISIBLE">Visible</option>
              <option value="HIDDEN">Hidden</option>
            </Select>
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Owning offering status
            <Select name="offeringStatus" defaultValue={data.query.offeringStatus??"ALL"}
              className="min-h-11">
              <option value="ALL">All offerings</option><option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </label>
          <label className="grid min-w-48 gap-1 text-sm font-semibold text-body">
            Section
            <Select name="deliveryId" defaultValue={data.query.deliveryId??""}
              className="min-h-11">
              <option value="">Showing every section&apos;s content together</option>
              {data.sectionOptions.map(option=><option key={option.deliveryId} value={option.deliveryId}>
                {option.courseCode} · {option.courseName} · {option.sectionName} ({option.sectionCode})
              </option>)}
            </Select>
            <span className="text-xs font-normal text-muted-foreground">
              {lessonContentOrderRuntimeEnabled()?
                "Choose a Section to inspect its shared and Section-specific content. Section ordering is edited in the offering workspace.":
                "Section content includes shared and Section-specific items. Delivery-specific ordering is not yet enabled."}
            </span>
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Audience scope
            <Select name="scope" defaultValue={data.query.scope}
              className="min-h-11">
              <option value="ALL">All scopes</option><option value="SHARED">Shared offering</option>
              <option value="SECTION">Section-specific</option>
            </Select>
          </label>
          <Button type="submit"
            className="min-h-11">
            Filter
          </Button>
          <Link href={path}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Clear
          </Link>
        </form>
      </section>
      <CollegeContentCsvExport filename={(videos?"videos":"resources")+"-page-"+data.query.page+".csv"}
       rows={data.items.map(item=>({title:item.title,course:item.courseName+" ("+item.courseCode+")",
        lesson:item.lessonName,status:item.status,scope:collegeContentScopeLabel(item.deliveryId),
        visible:item.visibleToStudents?"Visible":"Hidden",
        details:videos?collegeContentDuration(item.durationSeconds):"Materials: "+(item.materialsCount??"Unavailable")}))}/>
      {!videos?<p className="text-xs text-muted-foreground">
        Materials counts cover registered additional materials only; a legacy Resource HTTPS link is stored separately.
        {data.materialCountsReady?"":" Counts require the verified DB05 Resource Materials runtime."}
      </p>:null}
      <section aria-label={title + " catalogue"} className="overflow-x-auto rounded-xl border border-border bg-surface">
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {data.total} matching content {data.total === 1 ? "record" : "records"}
        </p>
        {data.items.length === 0 ? (
          <p className="p-6 text-sm text-body">
            {data.total === 0
              ? "No persisted content records match these filters. This does not imply missing storage or unavailable lessons."
              : "No records on this page. Select an earlier page."}
          </p>
        ) : (
          <>
            <div className="divide-y divide-border sm:hidden">
              {data.items.map(item => (
                <article key={item.id} className="min-w-0 space-y-2 p-4" aria-label={item.title}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">{item.contentType}</span>
                    <span className="text-xs font-semibold text-body">{item.status}</span>
                  </div>
                  <h2 className="break-words text-base font-semibold text-foreground">{item.title}</h2>
                  <CollegeContentPreview data={{title:item.title,course:item.courseName,lesson:item.lessonName,
                   type:item.contentType,status:item.status,scope:collegeContentScopeLabel(item.deliveryId),
                   visible:item.visibleToStudents,details:videos?collegeContentDuration(item.durationSeconds):
                    "Materials: "+(item.materialsCount??"Unavailable")}}/>
                  <Link href={"/college/courses/offerings/" + encodeURIComponent(item.offeringId)}
                    className="block break-words font-semibold text-primary-text hover:underline">
                    {item.courseName} ({item.courseCode})
                  </Link>
                  <p className="break-words text-sm text-body">{item.cohortName} · {item.periodName}</p>
                  <p className="break-words text-sm text-body">
                    Lesson: {item.lessonName} · Path: {item.learningPathTitle} ({item.learningPathStatus})
                  </p>
                  {item.status !== "ARCHIVED" ? <CollegeStudentVisibilityControl contentId={item.id} initialVisible={item.visibleToStudents} initialUpdatedAt={item.updatedAt.toISOString()} /> : null}
                  {!videos?<p className="text-xs text-muted-foreground">Materials: {item.materialsCount===null?"Unavailable until DB05 is verified":item.materialsCount}</p>:null}
                  <p className="text-xs text-muted-foreground">
                    {collegeContentScopeLabel(item.deliveryId)} · {item.visibleToStudents ? "Visible to students" : "Hidden from students"}
                    {videos ? " · " + collegeContentDuration(item.durationSeconds) : ""}
                  </p>
                </article>
              ))}
            </div>
            <div className="hidden min-w-0 sm:block">
              <DataTable
                caption={title+" catalogue"}
                rows={data.items}
                getRowKey={item=>item.id}
                empty={<p className="p-4 text-sm text-body">No persisted content records match these filters. This does not imply missing storage or unavailable lessons.</p>}
                columns={[
                  {key:"content",header:"Content",mobilePriority:"primary" as const,
                    cell:(item)=><div className="min-w-0">
                      <p className="break-words font-semibold text-foreground">{item.title}</p>
                      <CollegeContentPreview data={{title:item.title,course:item.courseName,lesson:item.lessonName,
                        type:item.contentType,status:item.status,scope:collegeContentScopeLabel(item.deliveryId),
                        visible:item.visibleToStudents,details:videos?collegeContentDuration(item.durationSeconds):
                        "Materials: "+(item.materialsCount??"Unavailable")}}/>
                      <p className="text-xs text-muted-foreground">
                        {item.contentType}{videos?" · "+collegeContentDuration(item.durationSeconds):""}
                      </p>
                    </div>},
                  {key:"course",header:"Course / cohort",mobilePriority:"secondary" as const,
                    cell:(item)=><div className="min-w-0">
                      <Link href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}
                        className="inline-flex min-h-11 items-center break-words font-semibold text-primary-text hover:underline">
                        {item.courseName} ({item.courseCode})
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.cohortName} · {item.periodName}</p>
                    </div>},
                  {key:"lesson",header:"Lesson / learning path",mobilePriority:"secondary" as const,
                    cell:(item)=><span>{item.lessonName}
                      <span className="block text-xs text-muted-foreground">{item.learningPathTitle} ({item.learningPathStatus})</span>
                    </span>},
                  ...(!videos?[{key:"materials",header:"Materials",mobilePriority:"secondary" as const,
                    cell:(item:(typeof data.items)[number])=>item.materialsCount===null?"—":item.materialsCount}]:[]),
                  {key:"scope",header:"Scope",mobilePriority:"secondary" as const,
                    cell:(item)=><span>{collegeContentScopeLabel(item.deliveryId)}
                      <span className="block text-xs">{item.visibleToStudents?"Visible to students":"Hidden from students"}</span>
                    </span>},
                  {key:"state",header:"State",mobilePriority:"action" as const,
                    cell:(item)=><div className="space-y-2">
                      <p className="text-body">{item.status}</p>
                      {item.status!=="ARCHIVED"?<CollegeStudentVisibilityControl contentId={item.id}
                        initialVisible={item.visibleToStudents} initialUpdatedAt={item.updatedAt.toISOString()}/>:null}
                    </div>},
                ]}
              />
            </div>
          </>
        )}
      </section>
      <nav aria-label={title + " pagination"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Page {data.query.page} of {data.totalPages} · 25 per page</span>
        <div className="flex gap-2">
          {data.query.page > 1 ? (
            <Link href={collegeContentHref(data.kind, { ...data.query, page: data.query.page - 1 })}
              className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">
              Previous
            </Link>
          ) : null}
          {data.query.page < data.totalPages ? (
            <Link href={collegeContentHref(data.kind, { ...data.query, page: data.query.page + 1 })}
              className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">
              Next
            </Link>
          ) : null}
        </div>
      </nav>
      <p className="text-xs leading-5 text-muted-foreground">
        This catalogue shows authorization-scoped content metadata. Publishing state does not by itself grant learner visibility.
        No storage key, file download, signed URL or external playback URL is returned here.
        Use the authoring controls above or the offering workspace to manage content.
      </p>
    </div>
  );
}
