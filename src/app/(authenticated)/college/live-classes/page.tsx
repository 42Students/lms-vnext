import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
import {getCurrentRequestContext} from "@/auth/request-context";
import {CollegeLiveClassesDirectory} from "@/components/courses/college-live-classes-directory";
import {CollegeContentCsvExport} from "@/components/courses/college-content-csv-export";
import {liveClassIstSchedule} from "@/modules/courses/college-live-classes-model";
import {CollegeContentAuthoringControl} from "@/components/courses/college-content-authoring-control";
import {getCollegeContentAuthoringOptions,collegeExistingContentFiltersFromSearch} from "@/modules/courses/college-content-authoring-service";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {collegeLiveClassQuerySchema,liveClassSearchParams} from "@/modules/courses/college-live-classes-model";
import {listCollegeContentAggregate} from "@/modules/courses/college-content-aggregate-service";
import {collegeContentCsvHref} from "@/modules/courses/college-content-export-model";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
export default async function CollegeLiveClassesPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>
}){
 const context=await getCurrentRequestContext();
 if(!context.membership)return <CollegeCourseMissingScope area="college"/>;
 const supplied=await searchParams;
 const parsed=collegeLiveClassQuerySchema.safeParse(liveClassSearchParams(supplied));
 if(!parsed.success)return <div className="min-w-0 space-y-4">
  <PageHeader title="Live Classes"/>
  <ErrorState title="Invalid session filters" description="Invalid page, publication or search filter."
    action={<TextLink href="/college/live-classes" className="inline-flex min-h-11 items-center md:min-h-9">Clear filters</TextLink>}/>
 </div>;
 const [data,authoring]=await Promise.all([listCollegeContentAggregate(context,"LIVE_CLASS",parsed.data),getCollegeContentAuthoringOptions(context,"LIVE_CLASS",collegeExistingContentFiltersFromSearch(supplied))]);
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Live classes" description="Schedule a live class with a meeting link on a lesson."
   actions={<CollegeContentCsvExport filename={"live-classes-page-"+data.query.page+".csv"}
    rows={data.items.map(item=>({title:item.title,course:item.courseName+" ("+item.courseCode+")",
     lesson:item.lessonName,status:item.status,scope:item.deliveryId?"Section-specific":"Shared",
     visible:item.visibleToStudents?"Visible":"Hidden",details:liveClassIstSchedule(item.startsAt,item.endsAt)}))}/>} />
  <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2">
   <section aria-label="Schedule live class" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] p-4">
    <Heading level={2} size="base" className="text-[var(--lms-heading)]">Schedule a live class</Heading>
    <CollegeContentAuthoringControl kind="LIVE_CLASS" lessons={authoring.lessons} deliveries={authoring.deliveries} existing={authoring.existing} existingTruncated={authoring.existingTruncated} existingPage={authoring.existingPage}
      existingFilters={authoring.existingFilters}/>
    <ButtonLink variant="secondary" prefetch={false} download href={collegeContentCsvHref("LIVE_CLASS",{...data.query,view:data.view,...(data.from !== undefined ? {from:data.from} : {}),...(data.to !== undefined ? {to:data.to} : {})})}
      className="w-full md:w-auto">
      Export live-class schedule CSV (UTC)
    </ButtonLink>
   </section>
   <section aria-label="Existing content" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] p-4">
    <Heading level={2} size="base" className="text-[var(--lms-heading)]">Existing Content</Heading>
    <CollegeLiveClassesDirectory data={data} showHeader={false}/>
   </section>
  </div>
 </div>;
}
