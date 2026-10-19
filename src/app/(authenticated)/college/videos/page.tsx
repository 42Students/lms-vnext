import {CollegeCourseMissingScope} from "@/components/courses/college-course-missing-scope";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeContentAggregate } from "@/components/courses/college-content-aggregate";
import {CollegeContentAuthoringControl} from "@/components/courses/college-content-authoring-control";
import {getCollegeContentAuthoringOptions} from "@/modules/courses/college-content-authoring-service";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { collegeContentQuerySchema, collegeContentSearchParams } from "@/modules/courses/college-content-aggregate-model";
import { listCollegeContentAggregate } from "@/modules/courses/college-content-aggregate-service";
import { collegeContentCsvHref } from "@/modules/courses/college-content-export-model";

export default async function CollegeVideosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if(!context.membership)return <CollegeCourseMissingScope area="college"/>;
  const raw = collegeContentSearchParams(await searchParams);
  const parsed = collegeContentQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="College Admin · Courses & Content" title="Video" />
        <ErrorState title="Invalid video filters"
          description="The title, status or page filter is invalid. No content was loaded."
          action={<Link href="/college/videos" className="inline-flex min-h-11 items-center font-semibold text-link underline lms-inline-link">Clear filters</Link>} />
      </div>
    );
  }
  const authoring=await getCollegeContentAuthoringOptions(context,"YOUTUBE");
  return <main className="min-w-0 space-y-4">
    <CollegeContentAuthoringControl kind="YOUTUBE" lessons={authoring.lessons} deliveries={authoring.deliveries} existing={authoring.existing} existingTruncated={authoring.existingTruncated} />
    <Link prefetch={false} download href={collegeContentCsvHref("VIDEO",parsed.data)}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      Export filtered video metadata CSV
    </Link>
    <CollegeContentAggregate data={await listCollegeContentAggregate(context, "VIDEO", parsed.data)} />
  </main>;
}
