import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {CollegeLiveClassesDirectory} from "@/components/courses/college-live-classes-directory";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {collegeLiveClassQuerySchema,liveClassSearchParams} from "@/modules/courses/college-live-classes-model";
import {listCollegeContentAggregate} from "@/modules/courses/college-content-aggregate-service";
import {collegeContentCsvHref} from "@/modules/courses/college-content-export-model";
export default async function CollegeLiveClassesPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>
}){
 const context=await getCurrentRequestContext();
 if(!context.membership)redirect("/dashboard");
 const parsed=collegeLiveClassQuerySchema.safeParse(liveClassSearchParams(await searchParams));
 if(!parsed.success)return <div className="space-y-4">
  <PageHeader eyebrow="College Admin · Courses & Content" title="Live Classes"/>
  <ErrorState title="Invalid session filters" description="Invalid page, publication or search filter."
    action={<Link href="/college/live-classes" className="font-semibold text-primary-text">Clear filters</Link>}/>
 </div>;
 const data=await listCollegeContentAggregate(context,"LIVE_CLASS",parsed.data);
 return <div className="space-y-4">
  <Link prefetch={false} download href={collegeContentCsvHref("LIVE_CLASS",data.query)}
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
    Export live-class schedule CSV (UTC)
  </Link>
  <CollegeLiveClassesDirectory data={data}/>
 </div>;
}
