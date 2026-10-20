import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { getAdminCourseWorkspace } from "@/modules/courses/admin-course-workspace";
import {parseSuperAdminCourseQuery} from "@/modules/admin-ui/super-admin-course-query-model";
import { ErrorState } from "@/components/ui/error-state";
import {getSuperAdminCourseDependencyCounts} from "@/modules/admin-ui/super-admin-course-dependencies-service";

export default async function SuperAdminCoursesPage({searchParams}:{searchParams:Promise<{duplicate?:string|string[];q?:string|string[];sort?:string|string[];page?:string|string[];pageSize?:string|string[]}>}) {
  const context =
    await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader
          title="Courses"
          description="Course administration requires a college safety scope."
        />
        <Tabs ariaLabel="Course and content directories" value="courses" renderPanel={false}
          items={[
            { value: "courses", label: "Courses", href: "/admin/courses" },
            { value: "lessons", label: "Lessons directory →", href: "/admin/lessons" },
            { value: "videos", label: "Videos directory →", href: "/admin/videos" },
            { value: "resources", label: "Resources directory →", href: "/admin/resources" },
            { value: "live", label: "Live Classes directory →", href: "/admin/live-classes" },
            { value: "progress", label: "Course Progress directory →", href: "/admin/course-progress" },
            { value: "assignments", label: "Assignments directory →", href: "/admin/assignments" },
            { value: "quizzes", label: "Quizzes directory →", href: "/admin/quizzes" },
          ]}
        />
        <EmptyState
          title="Select a college to continue"
          description="Choose a college in the header above to see its courses."
        />
      </div>
    );
  }

  const query=await searchParams;
  const parsed=parseSuperAdminCourseQuery(query);
  if(!parsed)return <div className="min-w-0 space-y-5">
    <PageHeader title="Courses"/>
    <ErrorState title="Invalid course filters" description="Check the search, sort or page and retry."
      action={<Link href="/admin/courses" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Clear filters</Link>}/>
  </div>;
  const {catalogueQuery,duplicateCourseId}=parsed;
  const [workspace,lessonCountByCourse]=await Promise.all([
    getAdminCourseWorkspace(context,collegeId),
    getSuperAdminCourseDependencyCounts(context),
  ]);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Courses"
        description="Course structure inside the selected college safety scope."
      />
      <Tabs ariaLabel="Course and content directories" value="courses" renderPanel={false}
          items={[
            { value: "courses", label: "Courses", href: "/admin/courses" },
            { value: "lessons", label: "Lessons directory →", href: "/admin/lessons" },
            { value: "videos", label: "Videos directory →", href: "/admin/videos" },
            { value: "resources", label: "Resources directory →", href: "/admin/resources" },
            { value: "live", label: "Live Classes directory →", href: "/admin/live-classes" },
            { value: "progress", label: "Course Progress →", href: "/admin/course-progress" },
            { value: "assignments", label: "Assignments →", href: "/admin/assignments" },
            { value: "quizzes", label: "Quizzes →", href: "/admin/quizzes" },
          ]}
        />
      <AdminCourseOverview
        workspace={workspace}
        courseBasePath="/admin/courses"
        duplicateCourseId={duplicateCourseId}
        catalogueQuery={catalogueQuery}
        lessonCountByCourse={lessonCountByCourse}
        offeringBasePath="/admin/courses/offerings"
      />
    </div>
  );
}
