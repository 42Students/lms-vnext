import { PageBackLink } from "@/components/ui/page-back-link";
import {Alert} from "@/components/ui/alert";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ZodError } from "zod";
import { CoursesServiceError } from "@/modules/courses/errors";
import type { RequestContext } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { Disclosure } from "@/components/ui/disclosure";
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
  const retryHref=backHref+"/offerings/"+encodeURIComponent(offeringId)+
   (deliveryId?"?deliveryId="+encodeURIComponent(deliveryId):"");
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
      return null;
    });
  if(!workspace)return <div className="min-w-0 space-y-4">
   <PageHeader title="Course unavailable" actions={<PageBackLink href={backHref} label="Back to Courses"/>}/>
   <Alert tone="error" role="alert" title="Server Notification">
    Lessons couldn&apos;t be loaded. Internal Server Error. Your changes have not been made.
   </Alert>
   <Link href={backHref} className="font-semibold text-primary-text underline">Back to Courses</Link>
   <a href={retryHref}
    className="ml-3 font-semibold text-primary-text underline">Retry</a>
  </div>;
  const [rosterResult,sectionPreviewResult]=await Promise.allSettled([
   listOfferingTeachingOverview(context,offeringId),
   listOfferingSectionPreview(context,offeringId,deliveryId,workspace.lessons,
    workspace.learningPath?.status==="PUBLISHED"),
  ]);
  const roster=rosterResult.status==="fulfilled"?rosterResult.value:null;
  const sectionPreview=sectionPreviewResult.status==="fulfilled"?sectionPreviewResult.value:null;
  const displayEnabled=courseDisplayRuntimeEnabled();
  const display=displayEnabled?await getAdminCourseDisplayContent(
   context,workspace.offering.courseId).catch(()=>null):null;

  return (
    <div className="min-w-0 max-w-full space-y-4">
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
      <AdminOfferingSectionTabs home={<div className="space-y-4">
       <h2 className="text-lg font-semibold text-foreground">Home</h2>
       {display?<section aria-label="In this Course" className="space-y-3 border-b border-border pb-4">
        <h3 className="text-base font-semibold text-foreground">In this Course</h3>
        {display.introductionText?<p className="whitespace-pre-wrap text-sm text-body">{display.introductionText}</p>:null}
        {display.bodyHtml?<div className="prose max-w-none text-sm text-body"
          dangerouslySetInnerHTML={{__html:display.bodyHtml}}/>:null}
        {display.takeaways.length?<ul className="list-disc space-y-1 pl-5 text-sm text-body">
         {display.takeaways.map((value,index)=><li key={index}>{value}</li>)}
        </ul>:null}
       </section>:<p className="text-sm text-muted-foreground">In this Course: the Course introduction has not been added yet.</p>}
       {displayEnabled?<Disclosure title="Edit Course Home content"
        className="border-b border-[var(--lms-canvas-border)] pb-3" contentClassName="pt-3">
        <AdminCourseDisplayEditor courseId={workspace.offering.courseId} enabled={displayEnabled}
         initial={display?{introductionText:display.introductionText,bodyHtml:display.bodyHtml,
          takeaways:display.takeaways,thumbnailUrl:display.thumbnailUrl,version:display.version}:null}/>
       </Disclosure>:
        <AdminCourseDisplayEditor courseId={workspace.offering.courseId} enabled={false} initial={null}/>}
      </div>} syllabus={<div className="space-y-4">
       <h2 className="text-lg font-semibold text-foreground">Syllabus</h2>
       <AdminOfferingLearningOverview workspace={workspace}/>
       {roster?<AdminOfferingTeachersPanel roster={roster}
        academicPeriodName={workspace.offering.academicPeriodName}/>:
        <Alert tone="warning" role="alert">Faculty assignments couldn&apos;t be loaded.
         <a className="ml-2 font-semibold underline" href={retryHref+"#course-syllabus"}>Retry</a>
        </Alert>}
       {sectionPreview?<AdminOfferingSectionPreview data={sectionPreview}/>:
        <Alert tone="warning" role="alert" title="Server Notification">
         Sections couldn&apos;t be loaded, so you&apos;re seeing shared content only.
         <a className="ml-2 font-semibold underline" href={retryHref+"#course-syllabus"}>Retry</a>
        </Alert>}
      </div>}/>
    </div>
  );
}
