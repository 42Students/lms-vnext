import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseList } from "@/components/courses/faculty-course-list";
import { getFacultyCourseList } from "@/modules/courses/faculty-course-list-service";
import { PageHeader } from "@/components/ui/page-header";
import { listFacultyCourseCardSummaries } from "@/modules/courses/faculty-course-card-summary-service";

export default async function FacultyCoursesPage({searchParams}: {
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context =
    await getCurrentRequestContext();
  const list = await getFacultyCourseList(context, await searchParams);
  // UX-teach-courses-01: one scoped, batched summary read avoids per-course workspace N+1 queries.
  const summaries = await listFacultyCourseCardSummaries(list.items);
  const rows = list.items.flatMap(course => {
    const workspace = summaries.get(course.deliveryId);
    return workspace ? [{ course, workspace }] : [];
  });

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader
        title="My Teaching Courses"
        description="Your active Course deliveries, exact Sections and the learning items visible to each class."
      />
      <FacultyCourseList rows={rows} query={list.query} pagination={list} scopeCount={list.scopeCount} periods={list.periods} sections={list.sections} assignmentChoices={list.assignmentChoices} />
    </div>
  );
}
