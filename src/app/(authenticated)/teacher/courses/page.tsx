import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseList } from "@/components/courses/faculty-course-list";
import { getFacultyCourseList } from "@/modules/courses/faculty-course-list-service";
import { PageHeader } from "@/components/ui/page-header";
import { getFacultyCourseWorkspace } from "@/modules/courses/faculty-course-service";

export default async function TeacherCoursesPage({searchParams}: {
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  const list = await getFacultyCourseList(context, await searchParams);
  const rows = await Promise.all(list.items.map(async (course) => ({
    course,
    workspace: await getFacultyCourseWorkspace(context, course.deliveryId),
  })));
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Faculty"
        title="Courses"
        description="Search the courses and exact Sections assigned to you."
      />
      <FacultyCourseList rows={rows} query={list.query} pagination={list} scopeCount={list.scopeCount} periods={list.periods} />
    </div>
  );
}
