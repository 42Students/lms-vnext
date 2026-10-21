import { PageBackLink } from "@/components/ui/page-back-link";
import {Alert} from "@/components/ui/alert";
import Link from "next/link";
import { ZodError } from "zod";
import { CoursesServiceError } from "@/modules/courses/errors";
import type { RequestContext } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import {hasMembershipRole,isSuperAdmin} from "@/modules/identity/context";
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
        return "NOT_FOUND" as const;
      }
      return null;
    });
  if(workspace==="NOT_FOUND")return <div className="min-w-0 space-y-4">
   <PageHeader title="Course not found"/>
   <Alert tone="warning" role="alert">
    Course not found. It may have been removed or may not belong to the selected college.
   </Alert>
   <PageBackLink href={backHref} label="Back"/>
  </div>;
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
  const displayResult=displayEnabled?await getAdminCourseDisplayContent(
   context,workspace.offering.courseId).then(value=>({value,failed:false as const}))
    .catch(()=>({value:null,failed:true as const})):
    {value:null,failed:false as const};
  const display=displayResult.value;
  const canEditHome=displayEnabled&&
   (hasMembershipRole(context,"COLLEGE_ADMIN")||isSuperAdmin(context));

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <header className="min-w-0 border-b border-[var(--lms-canvas-border)] bg-surface pb-4">
       <h1 className="m-0 break-words text-[24px] font-semibold leading-snug text-[var(--lms-heading)]">
        {workspace.offering.courseName}
       </h1>
       <p className="mt-1 text-xs text-muted-foreground">
        {workspace.offering.courseCode+" · "+workspace.offering.cohortName+
          " · "+workspace.offering.academicPeriodName}
       </p>
      </header>
      <AdminOfferingSectionTabs home={<article className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 md:p-6">
       <div><PageBackLink href={backHref} label="Back"/></div>
       <h2 className="text-lg font-semibold text-foreground">In this Course</h2>
       {displayResult.failed?<Alert tone="warning" role="alert" title="Server Notification">
        Course Home content couldn&apos;t be loaded. Internal Server Error.
        <a href={retryHref+"#course-home"} className="ml-2 font-semibold underline">Retry</a>
       </Alert>:null}
       {display?<section aria-label="In this Course" className="space-y-3 border-b border-border pb-4">
        <h3 className="text-base font-semibold text-foreground">Course overview</h3>
        {display.introductionText?<p className="whitespace-pre-wrap text-sm text-body">{display.introductionText}</p>:null}
        {display.bodyHtml?<div className="prose max-w-none text-sm text-body"
          dangerouslySetInnerHTML={{__html:display.bodyHtml}}/>:null}
        {display.takeaways.length?<ul className="list-disc space-y-1 pl-5 text-sm text-body">
         {display.takeaways.map((value,index)=><li key={index}>{value}</li>)}
        </ul>:null}
       </section>:<p className="text-sm text-muted-foreground">In this Course: the Course introduction has not been added yet.</p>}
       {canEditHome?<Disclosure title="Edit Course Home content"
        className="border-b border-[var(--lms-canvas-border)] pb-3" contentClassName="pt-3">
        <AdminCourseDisplayEditor courseId={workspace.offering.courseId} enabled={displayEnabled}
         initial={display?{introductionText:display.introductionText,bodyHtml:display.bodyHtml,
          takeaways:display.takeaways,thumbnailUrl:display.thumbnailUrl,version:display.version}:null}/>
       </Disclosure>:
        null}
       <section aria-label="Teachers" className="space-y-3 border-t border-border pt-4">
        <h3 className="text-base font-semibold text-foreground">Teachers</h3>
        {roster?<AdminOfferingTeachersPanel roster={roster}
          academicPeriodName={workspace.offering.academicPeriodName}/>:
         <Alert tone="warning" role="alert">
          Faculty assignments couldn't be loaded.{" "}
          <a className="font-semibold text-primary-text underline"
            href={retryHref+"#course-home"}>Retry</a>
         </Alert>}
       </section>
      </article>} syllabus={<article className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 md:p-6">
       <div><PageBackLink href={backHref} label="Back"/></div>
       <h2 className="text-lg font-semibold text-foreground">Syllabus</h2>
       <AdminOfferingLearningOverview workspace={workspace}/>
       {sectionPreview?<AdminOfferingSectionPreview data={sectionPreview}/>:
        <Alert tone="warning" role="alert" title="Server Notification">
         Sections couldn&apos;t be loaded, so you&apos;re seeing shared content only.
         <a className="ml-2 font-semibold underline" href={retryHref+"#course-syllabus"}>Retry</a>
        </Alert>}
      </article>}/>
    </div>
  );
}
