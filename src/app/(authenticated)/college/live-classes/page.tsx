import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {CollegeLiveClassesDirectory} from "@/components/courses/college-live-classes-directory";
import {CollegeContentAuthoringControl} from "@/components/courses/college-content-authoring-control";
import {getCollegeContentAuthoringOptions} from "@/modules/courses/college-content-authoring-service";
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
 const parsed=collegeLiveClassQuerySchema.safeParse(liveClassSearchParams(await searchParams));
 if(!parsed.success)return <div className="min-w-0 overflow-x-clip space-y-4">
  <PageHeader eyebrow="College Admin · Courses & Content" title="Live Classes"/>
  <ErrorState title="Invalid session filters" description="Invalid page, publication or search filter."
    action={<Link href="/college/live-classes" className="font-semibold text-link lms-inline-link">Clear filters</Link>}/>
 </div>;
 const [data,authoring]=await Promise.all([listCollegeContentAggregate(context,"LIVE_CLASS",parsed.data),getCollegeContentAuthoringOptions(context,"LIVE_CLASS")]);
 return <div className="space-y-4">
  <CollegeContentAuthoringControl kind="LIVE_CLASS" lessons={authoring.lessons} deliveries={authoring.deliveries} existing={authoring.existing} existingTruncated={authoring.existingTruncated}/>
  <Link prefetch={false} download href={collegeContentCsvHref("LIVE_CLASS",{...data.query,view:data.view,from:data.from,to:data.to})}
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
    Export live-class schedule CSV (UTC)
  </Link>
  <CollegeLiveClassesDirectory data={data}/>
 </div>;
}
