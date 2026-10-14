import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import {
  collegeContentDuration,
  collegeContentHref,
} from "@/modules/courses/college-content-aggregate-model";
import type { listCollegeContentAggregate } from "@/modules/courses/college-content-aggregate-service";

type Data = Awaited<ReturnType<typeof listCollegeContentAggregate>>;

export function CollegeContentAggregate({ data }: { data: Data }) {
  const videos = data.kind === "VIDEO";
  const title = videos ? "Video Content" : "Resources";
  const path = videos ? "/college/videos" : "/college/resources";
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin · Courses & Content"
        title={title}
        description={videos
          ? "Read-only catalogue of registered VIDEO and YOUTUBE lesson records. Playback and stored file access are not provided here."
          : "Read-only catalogue of registered lesson RESOURCE records. Private attachments and external links are not exposed here."}
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
            <input type="search" name="q" maxLength={100} defaultValue={data.query.q}
              placeholder="Search authored content"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Course code (exact)
            <input type="search" name="courseCode" maxLength={64} defaultValue={data.query.courseCode ?? ""}
              placeholder="e.g. CS101"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Content status
            <select name="status" defaultValue={data.query.status}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          {videos ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Video format
              <select name="format" defaultValue={data.query.format}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All video formats</option>
                <option value="VIDEO">Stored video</option>
                <option value="YOUTUBE">YouTube</option>
              </select>
            </label>
          ) : null}
          <button type="submit"
            className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
            Filter
          </button>
          <Link href={path}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Clear
          </Link>
        </form>
      </section>
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
          <table className="w-full min-w-[50rem] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Content</th>
                <th scope="col" className="px-4 py-3">Course / cohort</th>
                <th scope="col" className="px-4 py-3">Lesson / learning path</th>
                <th scope="col" className="px-4 py-3">Scope</th>
                <th scope="col" className="px-4 py-3">State</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-t border-border align-top">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.contentType}{videos ? " · " + collegeContentDuration(item.durationSeconds) : ""}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={"/college/courses/offerings/" + encodeURIComponent(item.offeringId)}
                      className="font-semibold text-primary-text hover:underline">
                      {item.courseName} ({item.courseCode})
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{item.cohortName} · {item.periodName}</p>
                  </td>
                  <td className="px-4 py-4 text-body">
                    {item.lessonName}
                    <p className="mt-1 text-xs text-muted-foreground">{item.learningPathTitle} ({item.learningPathStatus})</p>
                  </td>
                  <td className="px-4 py-4 text-body">
                    {item.deliveryId ? "Section-specific" : "Shared offering"}
                  </td>
                  <td className="px-4 py-4 text-body">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
        Read-only authoring metadata. Publishing state does not by itself grant learner visibility.
        No storage key, file download, signed URL, resource text or external playback URL is returned.
        Content creation, revision and publication remain in the offering workspace.
      </p>
    </div>
  );
}
