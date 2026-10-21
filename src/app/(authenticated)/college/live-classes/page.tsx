import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
import Link from "next/link";
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
    action={<Link href="/college/live-classes" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>}/>
 </div>;
 const [data,authoring]=await Promise.all([listCollegeContentAggregate(context,"LIVE_CLASS",parsed.data),getCollegeContentAuthoringOptions(context,"LIVE_CLASS",collegeExistingContentFiltersFromSearch(supplied))]);
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Live Classes" description="Saved lesson sessions in your college. Meeting links are available only through authorized course workspaces."
   actions={<CollegeContentCsvExport filename={"live-classes-page-"+data.query.page+".csv"}
    rows={data.items.map(item=>({title:item.title,course:item.courseName+" ("+item.courseCode+")",
     lesson:item.lessonName,status:item.status,scope:item.deliveryId?"Section-specific":"Shared",
     visible:item.visibleToStudents?"Visible":"Hidden",details:liveClassIstSchedule(item.startsAt,item.endsAt)}))}/>} />
  <div className="flex min-w-0 flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-start">
    <CollegeContentAuthoringControl kind="LIVE_CLASS" lessons={authoring.lessons} deliveries={authoring.deliveries} existing={authoring.existing} existingTruncated={authoring.existingTruncated} existingPage={authoring.existingPage}
      existingFilters={authoring.existingFilters}/>
    <Link prefetch={false} download href={collegeContentCsvHref("LIVE_CLASS",{...data.query,view:data.view,from:data.from,to:data.to})}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 md:w-auto">
      Export live-class schedule CSV (UTC)
    </Link>
  </div>
  <CollegeLiveClassesDirectory data={data} showHeader={false}/>
 </div>;
}
