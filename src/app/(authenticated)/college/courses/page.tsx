import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminCourseOverview } from "@/components/courses/admin-course-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getAdminCourseWorkspace } from "@/modules/courses/admin-course-workspace";
import {collegeCourseCatalogueQuerySchema} from "@/modules/courses/college-course-catalogue-model";
import {listCollegeCourseCatalogue} from "@/modules/courses/college-course-catalogue-service";

export default async function CollegeCoursesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const context =
    await getCurrentRequestContext();
  const membership = context.membership;

  if(!membership)return <CollegeCourseMissingScope area="college"/>;

  const raw=await searchParams;
  const parsedCatalogue=collegeCourseCatalogueQuerySchema.safeParse({q:raw.q,sort:raw.sort,page:raw.page});
  const catalogueQuery=parsedCatalogue.success?parsedCatalogue.data:{q:"",sort:"NAME_ASC" as const,page:1};
  const [workspace,catalogue]=await Promise.all([
    getAdminCourseWorkspace(context,membership.collegeId,true),
    listCollegeCourseCatalogue(context,catalogueQuery),
  ]);
  const duplicateCourseId=typeof raw.duplicate==="string"&&/^[a-f0-9-]{36}$/i.test(raw.duplicate)?raw.duplicate:undefined;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Courses"
      />
      <AdminCourseOverview
        workspace={workspace}
        catalogueQuery={catalogueQuery}
        catalogueData={catalogue}
        duplicateCourseId={duplicateCourseId}
        offeringBasePath="/college/courses/offerings"
        allowOfferingLifecycle
      />
    </div>
  );
}
