import Link from "next/link";
import { notFound } from "next/navigation";
import { ZodError } from "zod";
import { CoursesServiceError } from "@/modules/courses/errors";
import type { RequestContext } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
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
  eyebrow,
  backHref,
  deliveryId=null,
}: {
  context: RequestContext;
  offeringId: string;
  eyebrow: string;
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
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
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
          <Link
            href={backHref}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
          >
            Back to Courses
          </Link>
        }
      />
      <nav aria-label="Course detail tabs" className="flex flex-wrap gap-2 text-sm">
       <a href="#course-home" className="inline-flex min-h-10 items-center rounded border border-border px-3 font-semibold text-primary-text">Home</a>
       <a href="#course-syllabus" className="inline-flex min-h-10 items-center rounded border border-border px-3 font-semibold text-primary-text">Syllabus</a>
       <a href="#who-teaches-it" className="inline-flex min-h-10 items-center rounded border border-border px-3 font-semibold text-primary-text">Who teaches it</a>
       <a href="#section-content" className="inline-flex min-h-10 items-center rounded border border-border px-3 font-semibold text-primary-text">Section content</a>
      </nav>
      <section id="course-home" aria-label="Course Home" className="space-y-2">
      <h2 className="text-lg font-semibold">Home</h2>
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
      <section id="course-syllabus" aria-label="Course Syllabus" className="space-y-2">
       <h2 className="text-lg font-semibold">Syllabus</h2>
       <AdminOfferingLearningOverview workspace={workspace}/>
      </section>
    </div>
  );
}
