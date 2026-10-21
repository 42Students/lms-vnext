import { CollegeCourseMissingScope } from "@/components/courses/college-course-missing-scope";
import { getCurrentRequestContext } from "@/auth/request-context";
import {CollegeCoursesLastGood} from "@/components/college/college-courses-last-good";
import { PageHeader } from "@/components/ui/page-header";
import { getAdminCourseWorkspace } from "@/modules/courses/admin-course-workspace";
import { collegeCourseCatalogueQuerySchema } from "@/modules/courses/college-course-catalogue-model";
import { listCollegeCourseCatalogue } from "@/modules/courses/college-course-catalogue-service";

export default async function CollegeCoursesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const context =
    await getCurrentRequestContext();
  const membership = context.membership;

  if(!membership)return <CollegeCourseMissingScope area="college"/>;

  const raw=await searchParams;
  const parsedCatalogue=collegeCourseCatalogueQuerySchema.safeParse({q:raw.q,sort:raw.sort,page:raw.page});
  const catalogueQuery=parsedCatalogue.success?parsedCatalogue.data:{q:"",sort:"NAME_ASC" as const,page:1};
  // Refresh failures must not wipe same-scope rows already on screen.
  const [workspaceResult,catalogueResult]=await Promise.allSettled([
    getAdminCourseWorkspace(context,membership.collegeId,true),
    listCollegeCourseCatalogue(context,catalogueQuery),
  ]);
  const workspace=workspaceResult.status==="fulfilled"?workspaceResult.value:null;
  const catalogue=catalogueResult.status==="fulfilled"?catalogueResult.value:null;
  // A duplicate link from a different college must never populate this editor.
  const requestedDuplicate=typeof raw.duplicate==="string"&&/^[a-f0-9-]{36}$/i.test(raw.duplicate)
    ?raw.duplicate:undefined;
  const duplicateCourseId=requestedDuplicate&&workspace?.courses.some(course=>course.id===requestedDuplicate)
    ?requestedDuplicate:undefined;
  return (
    <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
      <PageHeader title="Courses"/>
      <CollegeCoursesLastGood
        key={context.user.id+":"+membership.id+":"+JSON.stringify(catalogueQuery)+":"+(duplicateCourseId??"")}
        workspace={workspace}
        catalogueQuery={catalogueQuery}
        catalogueData={catalogue}
        duplicateCourseId={duplicateCourseId}
      />
    </div>
  );
}
