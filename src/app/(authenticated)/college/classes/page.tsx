import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeStructureDirectory } from "@/components/academics/college-structure-directory";
import { CollegeClassCreate } from "@/components/academics/college-section-management";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  collegeClassQuerySchema,
  readCollegeStructureParams,
} from "@/modules/academics/college-structure-directory-model";
import { listCollegeClasses } from "@/modules/academics/college-structure-directory-service";
import { classesExportHref, CLASSES_EXPORT_CAP } from "@/modules/academics/college-classes-export-model";
import { listCollegeSectionOptions } from "@/modules/academics/college-section-mutation-service";

export default async function CollegeClassesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const raw = readCollegeStructureParams(await searchParams);
  const parsed = collegeClassQuerySchema.safeParse(raw);
  if (!parsed.success) return <div className="space-y-4">
    <PageHeader eyebrow="College Admin · Academic Setup" title="Classes" />
    <ErrorState title="Invalid class filters"
      description={collegeDirectoryValidationMessage(parsed.error)}
      action={<Link href="/college/classes" className="font-semibold text-link lms-inline-link">Clear filters</Link>} />
  </div>;
  const [classes, options] = await Promise.all([
    listCollegeClasses(context, parsed.data),
    listCollegeSectionOptions(context),
  ]);
  return <div className="min-w-0 overflow-x-clip space-y-6">
    <div className="flex flex-wrap items-center gap-3">
      <a href={classesExportHref(classes.query)}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link">
        Export CSV
      </a>
      <span className="text-xs text-muted-foreground">Up to {CLASSES_EXPORT_CAP} classes; download includes a truncation notice when capped.</span>
    </div>
    <Link href="/college/classes/recurring-preview"
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
      Preview recurring class schedule
    </Link>
    <CollegeClassCreate cohorts={options.cohorts} periods={options.periods} />
    <CollegeStructureDirectory data={classes} />
  </div>;
}
