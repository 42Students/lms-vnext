import { notFound } from "next/navigation";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { CoursesServiceError } from "@/modules/courses/errors";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyCourseTabNavigation } from "@/components/courses/faculty-course-tab-navigation";
import { listFacultyCourseDeliveries } from "@/modules/courses/faculty-course-service";
import { legacyFacultyCourseRouteIntent } from "@/modules/courses/faculty-course-navigation";

export default async function FacultyCourseTabLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ deliveryId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { deliveryId } = await params;
  // The route context always comes from current, persisted, active Faculty
  // teaching assignments. Never trust a caller's Section or cached role.
  if(!hasMembershipRole(context,"FACULTY"))
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Course workspace"/>
      <ErrorState title="Faculty access required"
        description="This course workspace is available to assigned faculty members."/>
    </div>;
  let assignments:Awaited<ReturnType<typeof listFacultyCourseDeliveries>>;
  try {
    assignments=await listFacultyCourseDeliveries(context);
  } catch(error) {
    // A withdrawn teaching assignment remains a nonenumerating not-found.
    if(error instanceof AuthorizationError ||
       (error instanceof CoursesServiceError &&
        (error.code==="LEARNING_ACCESS_DENIED" ||
         error.code==="FACULTY_TEACHING_SCOPE_REQUIRED")))notFound();
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Course workspace"/>
      <ErrorState title="Could not load teacher course context"
        description="The course context could not be verified. Your assignment has not been assumed revoked."
        action={<a href={"/teacher/courses/"+encodeURIComponent(deliveryId)}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
          Retry
        </a>}/>
    </div>;
  }
  const active = assignments.find((assignment) => assignment.deliveryId === deliveryId);
  if (!active) {
    // The page below owns the persisted, assignment-scoped slug/numeric ID
    // resolution and the query's legacy class hint. Rendering that child
    // without a course header reveals nothing; it must redirect or 404.
    // Reject arbitrary path fragments before they reach the resolver.
    if (legacyFacultyCourseRouteIntent(deliveryId, {}) !== null)
      return <>{children}</>;
    notFound();
  }
  const sections=assignments.filter(a=>a.courseId===active.courseId)
   .sort((a,b)=>a.sectionName.localeCompare(b.sectionName,undefined,{numeric:true})||a.deliveryId.localeCompare(b.deliveryId))
   .map(a=>({deliveryId:a.deliveryId,label:a.sectionName.trim()||"Class "+a.deliveryId.slice(0,8)}));
  return (
    <div className="min-w-0 space-y-5">
      <PageHeader title={active.courseName} description={"Course workspace · "+active.sectionName}/>
      <FacultyCourseTabNavigation
        deliveryId={deliveryId}
        courseName={active.courseName}
        sectionName={active.sectionName}
        teachingSections={sections}
      />
      {children}
    </div>
  );
}
