import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {CollegeNotAssignedAlert} from "@/components/courses/college-not-assigned-alert";
import {CollegeLiveClassesDirectory} from "@/components/courses/college-live-classes-directory";
import {CollegeContentAuthoringControl} from "@/components/courses/college-content-authoring-control";
import {getCollegeContentAuthoringOptions} from "@/modules/courses/college-content-authoring-service";
import {loadCollegeTabOptions} from "@/modules/courses/college-tab-options";
import {CollegeOptionsUnavailable} from "@/components/courses/college-options-unavailable";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {collegeLiveClassQuerySchema,liveClassSearchParams} from "@/modules/courses/college-live-classes-model";
import {listCollegeContentAggregate} from "@/modules/courses/college-content-aggregate-service";
import {collegeContentCsvHref} from "@/modules/courses/college-content-export-model";
export default async function CollegeLiveClassesPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>
}){
 const context=await getCurrentRequestContext();
 if (!context.membership) return <CollegeNotAssignedAlert tab="live-classes" />;
 const parsed=collegeLiveClassQuerySchema.safeParse(liveClassSearchParams(await searchParams));
 if(!parsed.success)return <div className="space-y-4">
  <PageHeader eyebrow="College Admin · Courses & Content" title="Live Classes"/>
  <ErrorState title="Invalid session filters" description="Invalid page, publication or search filter."
    action={<Link href="/college/live-classes" className="font-semibold text-primary-text">Clear filters</Link>}/>
 </div>;
 const [data,authoringLoad]=await Promise.all([listCollegeContentAggregate(context,"LIVE_CLASS",parsed.data),loadCollegeTabOptions(()=>getCollegeContentAuthoringOptions(context,"LIVE_CLASS"),{lessons:[],deliveries:[],existing:[],existingTruncated:false})]);
 const authoring=authoringLoad.value;
 return <div className="space-y-4">
  {authoringLoad.failed?<CollegeOptionsUnavailable tab="live-classes" href="/college/live-classes"/>:<CollegeContentAuthoringControl kind="LIVE_CLASS" lessons={authoring.lessons} deliveries={authoring.deliveries} existing={authoring.existing} existingTruncated={authoring.existingTruncated}/>}
  <Link prefetch={false} download href={collegeContentCsvHref("LIVE_CLASS",{...data.query,view:data.view,from:data.from,to:data.to})}
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
    Export live-class schedule CSV (UTC)
  </Link>
  <CollegeLiveClassesDirectory data={data}/>
 </div>;
}
