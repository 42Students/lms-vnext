import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseList } from "@/components/courses/faculty-course-list";
import { PageHeader } from "@/components/ui/page-header";
import { getFacultyCourseWorkspace, listFacultyCourseDeliveries } from "@/modules/courses/faculty-course-service";

export default async function TeacherCoursesPage() {
  const context = await getCurrentRequestContext();
  const courses = await listFacultyCourseDeliveries(context);
  const rows = await Promise.all(courses.map(async (course) => ({
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
      <FacultyCourseList rows={rows} />
    </div>
  );
}
