import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeStructureDirectory } from "@/components/academics/college-structure-directory";
import { CollegeClassCreate } from "@/components/academics/college-section-management";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  collegeStructureQuerySchema,
  readCollegeStructureParams,
} from "@/modules/academics/college-structure-directory-model";
import { listCollegeClasses } from "@/modules/academics/college-structure-directory-service";
import { listCollegeSectionOptions } from "@/modules/academics/college-section-mutation-service";

export default async function CollegeClassesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const raw = readCollegeStructureParams(await searchParams);
  const parsed = collegeStructureQuerySchema.safeParse(raw);
  if (!parsed.success) return <div className="space-y-4">
    <PageHeader eyebrow="College Admin · Academic Setup" title="Classes" />
    <ErrorState title="Invalid class filters"
      description="The search, program, status or page is invalid. No classes were loaded."
      action={<Link href="/college/classes" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const [classes, options] = await Promise.all([
    listCollegeClasses(context, parsed.data),
    listCollegeSectionOptions(context),
  ]);
  return <div className="space-y-6">
    <Link href="/college/classes/recurring-preview"
      className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Preview recurring class schedule
    </Link>
    <CollegeClassCreate cohorts={options.cohorts} periods={options.periods} />
    <CollegeStructureDirectory data={classes} />
  </div>;
}
