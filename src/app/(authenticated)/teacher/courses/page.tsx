import Link from "next/link";
import { parseFacultyCourseListLocation } from "@/modules/courses/faculty-course-list-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseList } from "@/components/courses/faculty-course-list";
import { getFacultyCourseList } from "@/modules/courses/faculty-course-list-service";
import { PageHeader } from "@/components/ui/page-header";
import { listFacultyCourseCardSummaries } from "@/modules/courses/faculty-course-card-summary-service";

export default async function TeacherCoursesPage({searchParams}: {
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  const query=parseFacultyCourseListLocation(await searchParams);
  if(!query)return <div className="space-y-6">
    <PageHeader title="My Courses" />
    <div role="alert" className="rounded-xl border border-border bg-surface p-5">
      The Course filters could not be understood. No other Section has been loaded.
      <Link href="/teacher/courses"
        className="ml-2 font-semibold text-primary-text underline">
        Reset filters
      </Link>
    </div>
  </div>;
  const list = await getFacultyCourseList(context,query);
  const summaries = await listFacultyCourseCardSummaries(list.items);
  const rows = list.items.flatMap((course) => {
    const workspace = summaries.get(course.deliveryId);
    return workspace ? [{ course, workspace }] : [];
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Courses"
      />
      <FacultyCourseList rows={rows} query={list.query} pagination={list} scopeCount={list.scopeCount} periods={list.periods} sections={list.sections} assignmentChoices={list.assignmentChoices} />
    </div>
  );
}
