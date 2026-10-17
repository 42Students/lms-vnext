import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeNotAssignedAlert } from "@/components/courses/college-not-assigned-alert";
import { CollegeContentAggregate } from "@/components/courses/college-content-aggregate";
import {CollegeContentAuthoringControl} from "@/components/courses/college-content-authoring-control";
import {getCollegeContentAuthoringOptions} from "@/modules/courses/college-content-authoring-service";
import {resourceMaterialsRuntimeEnabled} from "@/modules/courses/resource-material-readiness";
import {loadCollegeTabOptions} from "@/modules/courses/college-tab-options";
import {CollegeOptionsUnavailable} from "@/components/courses/college-options-unavailable";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegeContentQuerySchema, collegeContentSearchParams } from "@/modules/courses/college-content-aggregate-model";
import { listCollegeContentAggregate } from "@/modules/courses/college-content-aggregate-service";
import {collegeContentCsvHref} from "@/modules/courses/college-content-export-model";

export default async function CollegeResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <CollegeNotAssignedAlert tab="resources" />;
  const raw = collegeContentSearchParams(await searchParams);
  const parsed = collegeContentQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="College Admin · Courses & Content" title="Resources" />
        <ErrorState title="Invalid resource filters"
          description="The title, status or page filter is invalid. No content was loaded."
          action={<Link href="/college/resources" className="font-semibold text-primary-text">Clear filters</Link>} />
      </div>
    );
  }
  const authoringLoad=await loadCollegeTabOptions(()=>getCollegeContentAuthoringOptions(context,"RESOURCE"),{lessons:[],deliveries:[],existing:[],existingTruncated:false});
  const authoring=authoringLoad.value;
  return <div className="space-y-4">
    {authoringLoad.failed?<CollegeOptionsUnavailable tab="resources" href="/college/resources"/>:<CollegeContentAuthoringControl kind="RESOURCE" lessons={authoring.lessons} deliveries={authoring.deliveries} existing={authoring.existing} existingTruncated={authoring.existingTruncated} materialsEnabled={resourceMaterialsRuntimeEnabled()}/>}
    <Link download prefetch={false} href={collegeContentCsvHref("RESOURCE",parsed.data)}
      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Export filtered resource metadata CSV
    </Link>
    <CollegeContentAggregate data={await listCollegeContentAggregate(context, "RESOURCE", parsed.data)} />
  </div>;
}
