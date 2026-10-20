import { PageBackLink } from "@/components/ui/page-back-link";
import { notFound } from "next/navigation";
import { ZodError } from "zod";
import { CoursesServiceError } from "@/modules/courses/errors";
import type { RequestContext } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import {AdminOfferingSectionTabs} from "./admin-offering-section-tabs";
import { AdminCourseDisplayEditor } from "./admin-course-display-editor";
import {AdminOfferingTeachersPanel} from "./admin-offering-teachers-panel";
import {AdminOfferingSectionPreview} from "./admin-offering-section-preview";
import {listOfferingSectionPreview} from "@/modules/courses/college-offering-section-preview-service";
import {listOfferingTeachingOverview} from "@/modules/courses/college-course-teachers-service";
import { courseDisplayRuntimeEnabled } from "@/modules/courses/course-display-readiness";
import { getAdminCourseDisplayContent } from "@/modules/courses/course-display-service";
import {
  AdminOfferingLearningOverview,
} from "./admin-offering-learning-overview";
import {
  getAdminOfferingLearningWorkspace,
} from "@/modules/courses/admin-offering-learning-workspace";

export async function AdminOfferingLearningPage({
  context,
  offeringId,
  backHref,
  deliveryId=null,
}: {
  context: RequestContext;
  offeringId: string;
  eyebrow?: string;
  backHref: string;
  deliveryId?:string|null;
}) {
  const workspace =
    await getAdminOfferingLearningWorkspace(
      context,
      offeringId,
    ).catch((error: unknown) => {
      if (
        error instanceof ZodError ||
        (error instanceof CoursesServiceError &&
          error.code === "OFFERING_NOT_FOUND")
      ) {
        notFound();
      }
      throw error;
    });
  const [roster,sectionPreview]=await Promise.all([
   listOfferingTeachingOverview(context,offeringId),
   listOfferingSectionPreview(context,offeringId,deliveryId,workspace.lessons,
    workspace.learningPath?.status==="PUBLISHED"),
  ]);
  const displayEnabled =
    courseDisplayRuntimeEnabled();
  const display = displayEnabled
    ? await getAdminCourseDisplayContent(
        context,
        workspace.offering.courseId,
      )
    : null;

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader
        title={
          workspace.offering.courseName
        }
        description={
          workspace.offering.courseCode +
          " · " +
          workspace.offering.cohortName +
          " · " +
          workspace.offering
            .academicPeriodName
        }
        actions={
          <PageBackLink href={backHref} label="Back to Courses" />
        }
      />
      <AdminOfferingSectionTabs/>
      <section id="course-home" aria-label="Course Home" className="scroll-mt-24 space-y-2">
      <h2 className="text-lg font-semibold text-foreground">Home</h2>
      <AdminCourseDisplayEditor
        courseId={workspace.offering.courseId}
        enabled={displayEnabled}
        initial={
          display
            ? {
                introductionText:
                  display.introductionText,
                bodyHtml:
                  display.bodyHtml,
                takeaways:
                  display.takeaways,
                thumbnailUrl:
                  display.thumbnailUrl,
                version: display.version,
              }
            : null
        }
      />
      </section>
      <AdminOfferingTeachersPanel roster={roster} academicPeriodName={workspace.offering.academicPeriodName}/>
      <AdminOfferingSectionPreview data={sectionPreview}/>
      <section id="course-syllabus" aria-label="Course Syllabus" className="scroll-mt-24 space-y-2">
       <h2 className="text-lg font-semibold text-foreground">Syllabus</h2>
       <AdminOfferingLearningOverview workspace={workspace}/>
      </section>
    </div>
  );
}
