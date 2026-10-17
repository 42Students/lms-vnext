import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getAdminCourseWorkspace } from "@/modules/courses/admin-course-workspace";
import { collegeCourseCatalogueQuerySchema } from "@/modules/courses/college-course-catalogue-model";
import { ErrorState } from "@/components/ui/error-state";
import {getSuperAdminCourseDependencyCounts} from "@/modules/admin-ui/super-admin-course-dependencies-service";

export default async function SuperAdminCoursesPage({searchParams}:{searchParams:Promise<{duplicate?:string|string[];q?:string|string[];sort?:string|string[];page?:string|string[]}>}) {
  const context =
    await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Courses"
          description="Course administration requires a college safety scope."
        />
        <Link href="/admin/lessons" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">Lessons directory →</Link>
      <Link href="/admin/videos" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Videos directory →</Link>
      <Link href="/admin/resources" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Resources directory →</Link>
      <Link href="/admin/live-classes" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Live Classes directory →</Link>
        <Link href="/admin/course-progress" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">Course Progress directory →</Link>
        <Link href="/admin/assignments" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">Assignments directory →</Link>
        <Link href="/admin/quizzes" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">Quizzes directory →</Link>
        <EmptyState
          title="Select a college to continue"
          description="Choose a college in the header above to see its courses."
        />
      </div>
    );
  }

  const query=await searchParams;
  const catalogueQuery=collegeCourseCatalogueQuerySchema.safeParse({q:query.q,sort:query.sort,page:query.page});
  if(!catalogueQuery.success)return <div className="space-y-5">
    <PageHeader eyebrow="Super Admin" title="Courses"/>
    <ErrorState title="Invalid course filters" description="Check the search, sort or page and retry."
      action={<Link href="/admin/courses" className="font-semibold text-primary-text underline">Clear filters</Link>}/>
  </div>;
  const duplicateCourseId=typeof query.duplicate==="string"&&/^[a-f0-9-]{36}$/i.test(query.duplicate)
    ?query.duplicate:undefined;
  const [workspace,lessonCountByCourse]=await Promise.all([
    getAdminCourseWorkspace(context,collegeId),
    getSuperAdminCourseDependencyCounts(context),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Courses"
        description="Course structure inside the selected college safety scope."
      />
      <Link href="/admin/lessons" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Lessons directory →</Link>
      <Link href="/admin/videos" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Videos directory →</Link>
      <Link href="/admin/resources" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Resources directory →</Link>
      <Link href="/admin/live-classes" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Live Classes directory →</Link>
      <Link href="/admin/course-progress" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Course Progress →</Link>
      <Link href="/admin/assignments" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Assignments →</Link>
      <Link href="/admin/quizzes" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Quizzes →</Link>
      <AdminCourseOverview
        workspace={workspace}
        courseBasePath="/admin/courses"
        duplicateCourseId={duplicateCourseId}
        catalogueQuery={catalogueQuery.data}
        lessonCountByCourse={lessonCountByCourse}
        offeringBasePath="/admin/courses/offerings"
      />
    </div>
  );
}
