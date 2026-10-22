import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {listSuperAdminGlobalCourses} from "@/modules/courses/super-admin-global-course-directory";
import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
import { AdminCourseRecycleBin } from "@/components/courses/admin-course-recycle-bin";
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
import {paginateCollegeCourses} from "@/modules/courses/college-course-catalogue-model";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {AdminCoursesLastGood} from "@/components/courses/admin-courses-last-good";

export default async function SuperAdminCoursesPage({searchParams}:{searchParams:Promise<{duplicate?:string|string[];q?:string|string[];sort?:string|string[];page?:string|string[];pageSize?:string|string[];create?:string|string[]}>}) {
  const context =
    await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    const globalQuery=await searchParams;
    const rawQ=typeof globalQuery.q==="string"?globalQuery.q:"";
    const rawPage=typeof globalQuery.page==="string"?globalQuery.page:"1";
    const valid=rawQ.length<=100&&/^[1-9][0-9]{0,3}$/.test(rawPage);
    const catalogue=valid?await listSuperAdminGlobalCourses(context,{
      q:rawQ,page:Number(rawPage),
    }).then(value=>({ok:true as const,value})).catch(()=>({ok:false as const,value:null})):
      {ok:false as const,value:null};
    const catalogueHref=(pageNumber:number)=>{
      const params=new URLSearchParams();
      if(rawQ)params.set("q",rawQ);
      if(pageNumber>1)params.set("page",String(pageNumber));
      return "/admin/courses"+(params.size?"?"+params.toString():"");
    };
    const globalPolicy = !context.adminScope?.organizationId
      ? await getAdminTenantSettingState(context,"GLOBAL","course.minInProgressPercent")
        .then(value=>({ok:true as const,value}))
        .catch(()=>({ok:false as const,value:null}))
      : null;
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader
          title="Courses"
          description="Select a college to manage Courses"
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
          Select a college to manage Courses. Global progress policy can be reviewed
          with the platform-wide Super Admin scope selected.
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
        <section aria-label="Read-only authorized course catalogue"
          className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
          <h2 className="text-lg font-semibold text-foreground">
            {context.adminScope?.organizationId?"Organization course catalogue":"Platform course catalogue"}
          </h2>
          <p className="text-sm text-body">Read-only courses from authorized active colleges.
            Select a college in the header to create or edit courses. This view never changes your active scope.</p>
          <form action="/admin/courses" method="get" className="flex flex-wrap gap-2">
            <label className="min-w-0 flex-1 text-xs font-semibold text-body">
              Find course or code
              <Input type="search" name="q" defaultValue={rawQ} maxLength={100}
                className="mt-1 w-full"/>
            </label>
            <Button variant="secondary" type="submit" className="self-end">Search</Button>
          </form>
          {!valid?<ErrorState title="Invalid course filters"
            description="Use up to 100 search characters and a positive page number."
            action={<Link href="/admin/courses" className="font-semibold text-primary-text underline">Clear filters</Link>}/>:
            !catalogue.ok||!catalogue.value?<ErrorState title="Course catalogue unavailable"
              description="Could not verify the current authorized course catalogue."
              action={<Link href={catalogueHref(Number(rawPage))} className="font-semibold text-primary-text underline">Retry</Link>}/>:
            catalogue.value.items.length===0?<EmptyState title="No courses found" description="Try another search or select a college."/>:
            <>
              <div className="min-w-0 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead><tr className="border-b border-border text-xs text-muted-foreground">
                    <th scope="col" className="p-2">Course</th><th scope="col" className="p-2">Code</th>
                    <th scope="col" className="p-2">College</th><th scope="col" className="p-2">Department</th>
                    <th scope="col" className="p-2">Status</th>
                  </tr></thead>
                  <tbody>{catalogue.value.items.map(item=><tr key={item.id} className="border-b border-border">
                    <td className="p-2 font-semibold">{item.name}</td>
                    <td className="p-2">{item.code}</td>
                    <td className="p-2">{item.college}</td>
                    <td className="p-2">{item.department}</td>
                    <td className="p-2">{item.status}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              <nav aria-label="Course catalogue pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span role="status">Page {catalogue.value.page} · {catalogue.value.total} matching courses</span>
                <div className="flex gap-3">
                  {catalogue.value.page>1?<Link href={catalogueHref(catalogue.value.page-1)}
                    className="font-semibold text-primary-text underline">Previous</Link>:null}
                  {catalogue.value.hasMore?<Link href={catalogueHref(catalogue.value.page+1)}
                    className="font-semibold text-primary-text underline">Next</Link>:null}
                </div>
              </nav>
            </>}
        </section>
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
  const {catalogueQuery,duplicateCourseId,openCreateCourse}=parsed;
  const workspaceResult=await getAdminCourseWorkspace(context,collegeId)
    .then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}));
  const workspace=workspaceResult.ok?workspaceResult.value:null;
  const dependenciesResult=await getSuperAdminCourseDependencyCounts(context,
    (workspace?.courses??[]).slice(0,100).map(course=>course.id))
    .then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}));
  const lessonCountByCourse=dependenciesResult.ok?dependenciesResult.value:undefined;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Courses"
        description="Create New Course and manage Existing Courses."
        actions={workspace?<Link href="/admin/courses?create=1#create-course"
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)] md:min-h-9">Create New Course</Link>:undefined}
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
      {!dependenciesResult.ok?<Banner tone="warning" role="status">
        Course lesson dependencies could not be verified. Archive decisions must be checked again before proceeding.
        <Link href="/admin/courses" className="ml-2 font-semibold underline">Retry</Link>
      </Banner>:null}
      <AdminCoursesLastGood key={context.user.id+":"+collegeId}
        available={Boolean(workspace)} retryHref="/admin/courses">
        {workspace?<>
          <AdminCourseOverview
            workspace={workspace}
            openCreateCourse={openCreateCourse}
            courseBasePath="/admin/courses"
            duplicateCourseId={duplicateCourseId}
            catalogueQuery={catalogueQuery}
            lessonCountByCourse={lessonCountByCourse}
            offeringBasePath="/admin/courses/offerings"
          />
          <AdminCourseRecycleBin collegeId={collegeId}/>
        </>:null}
      </AdminCoursesLastGood>
    </div>
  );
}
