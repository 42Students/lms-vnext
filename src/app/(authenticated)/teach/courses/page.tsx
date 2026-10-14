import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseList } from "@/components/courses/faculty-course-list";
import { getFacultyCourseList } from "@/modules/courses/faculty-course-list-service";
import { PageHeader } from "@/components/ui/page-header";
import {
  getFacultyCourseWorkspace,
} from "@/modules/courses/faculty-course-service";

export default async function FacultyCoursesPage({searchParams}: {
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context =
    await getCurrentRequestContext();
  const list = await getFacultyCourseList(context, await searchParams);
  const rows = await Promise.all(
    list.items.map(async (course) => ({
      course,
      workspace:
        await getFacultyCourseWorkspace(
          context,
          course.deliveryId,
        ),
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Faculty"
        title="My Teaching Courses"
        description="Your active Course deliveries, exact Sections and the learning items visible to each class."
      />
      <FacultyCourseList rows={rows} query={list.query} pagination={list} scopeCount={list.scopeCount} periods={list.periods} />
    </div>
  );
}
