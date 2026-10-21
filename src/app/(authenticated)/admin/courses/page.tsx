import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
import { EmptyState } from "@/components/ui/empty-state";
import { Banner } from "@/components/ui/banner";
import { CourseProgressPolicyEditor } from "@/components/admin/course-progress-policy-editor";
import { getAdminTenantSettingState } from "@/modules/platform-settings/admin-editor-service";
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
    const globalPolicy = !context.adminScope?.organizationId
      ? await getAdminTenantSettingState(context,"GLOBAL","course.minInProgressPercent")
        .then(value=>({ok:true as const,value}))
        .catch(()=>({ok:false as const,value:null}))
      : null;
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
        <Banner tone="warning" role="status">
          Select a college to view courses. Global progress policy
          can be reviewed only with the platform-wide Super Admin scope selected.
        </Banner>
        {globalPolicy?.ok && globalPolicy.value.state !== "UNAVAILABLE" ? (
          <CourseProgressPolicyEditor
            initialValue={globalPolicy.value.state === "OVERRIDDEN"
              ? Number(globalPolicy.value.value) : 5}
            initialVersion={globalPolicy.value.version ?? 0}
            isOverride={globalPolicy.value.state === "OVERRIDDEN"}
          />
        ) : context.adminScope?.organizationId ? (
          <p className="text-sm leading-6 text-body">
            Clear the organization selection in the Super Admin scope switcher
            to edit platform-wide progress policy.
          </p>
        ) : (
          <Banner tone="warning" role="status">
            Progress policy could not be loaded. The stored value has not changed.
            <Link href="/admin/courses" className="ml-2 font-semibold text-primary-text underline">
              Retry loading progress policy
            </Link>
          </Banner>
        )}
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
    <ErrorState title="Invalid course filters" description="Check the search, sort or page and retry."
      action={<Link href="/admin/courses" className="inline-flex min-h-11 items-center font-[650] text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>}/>
  </div>;
  const {catalogueQuery,duplicateCourseId}=parsed;
  const [workspaceResult,dependencyResult]=await Promise.allSettled([
    getAdminCourseWorkspace(context,collegeId),
    getSuperAdminCourseDependencyCounts(context),
  ]);
  if(workspaceResult.status==="rejected"){
   return <div className="space-y-5">
    <PageHeader title="Courses"/>
    <Banner tone="error" role="alert">Couldn&apos;t refresh courses. Previously loaded course records have not been replaced with guesses.</Banner>
    <ErrorState title="Courses could not be loaded"
      description="The selected college course directory is temporarily unavailable. Your active college scope is preserved."
      action={<Link href="/admin/courses" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Retry courses</Link>}/>
   </div>;
  }
  const workspace=workspaceResult.value;
  const lessonCountByCourse=dependencyResult.status==="fulfilled"?dependencyResult.value:undefined;

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
      {dependencyResult.status==="rejected"?<Banner tone="warning" role="status">
        Course dependency counts could not be loaded. Course listing and editing remain available, but lesson counts may be missing.
        <Link href="/admin/courses" className="ml-2 font-semibold text-primary-text underline">Retry counts</Link>
      </Banner>:null}
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
