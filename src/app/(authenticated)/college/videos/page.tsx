import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeContentAggregate } from "@/components/courses/college-content-aggregate";
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
  if (!context.membership) redirect("/dashboard");
  const raw = collegeContentSearchParams(await searchParams);
  const parsed = collegeContentQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="College Admin · Courses & Content" title="Video Content" />
        <ErrorState title="Invalid video filters"
          description="The title, status or page filter is invalid. No content was loaded."
          action={<Link href="/college/videos" className="font-semibold text-primary-text">Clear filters</Link>} />
      </div>
    );
  }
  return <div className="space-y-4">
    <Link prefetch={false} download href={collegeContentCsvHref("VIDEO",parsed.data)}
      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Export filtered video metadata CSV
    </Link>
    <CollegeContentAggregate data={await listCollegeContentAggregate(context, "VIDEO", parsed.data)} />
  </div>;
}
