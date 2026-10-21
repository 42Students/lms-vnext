import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { CollegeStructureDirectory } from "@/components/academics/college-structure-directory";
import { CollegeSlotManager } from "@/components/electives/college-slot-manager";
import { listCollegeElectiveSlotOptions } from "@/modules/electives/college-slot-mutation-service";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  collegeElectiveQuerySchema,
  readCollegeStructureParams,
} from "@/modules/academics/college-structure-directory-model";
import { listCollegeElectives } from "@/modules/academics/college-structure-directory-service";
import { electiveCsvHref, ELECTIVES_EXPORT_CAP } from "@/modules/academics/college-elective-export-model";

export default async function CollegeElectivesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const moduleAccess=await resolveOptionalModuleAccess(context);
  if(!moduleAccess.electives.enabled)return <section role="status" className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Electives is turned off for this college" />
    <p className="text-sm text-body leading-[22px]">Your college administrator can ask 42Students to switch Electives back on.
      Existing elective records are kept; this page cannot create or change electives while the module is off.</p>
    <Link href="/college" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Return to college dashboard</Link>
  </section>;

  const raw = readCollegeStructureParams(await searchParams);
  const parsed = collegeElectiveQuerySchema.safeParse(raw);
  if (!parsed.success) return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Electives" />
    <ErrorState title="Invalid elective filters"
      description={collegeDirectoryValidationMessage(parsed.error)}
      action={<Link href="/college/electives" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] w-full md:w-auto">Clear filters</Link>} />
  </div>;
  const [data, optionResult] = await Promise.all([
    listCollegeElectives(context, parsed.data),
    listCollegeElectiveSlotOptions(context).then(options => ({ options, error: false as const }))
      .catch(() => ({ options: { programs: [], periods: [] }, error: true as const })),
  ]);
  const options = optionResult.options;
  return <CollegeStructureDirectory data={data} electiveOptions={options}
    prepend={<div className="min-w-0 space-y-[var(--lms-space-3)]">
      {optionResult.error ? <div role="alert" className="border border-amber-300 bg-amber-50 p-3 text-sm">Could not load elective options. <Link href="/college/electives" className="font-semibold underline">Retry options</Link></div> : null}
      <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] sm:flex-row sm:flex-wrap sm:items-center">
        {!optionResult.error ? <CollegeSlotManager options={options} /> : null}
        <Link prefetch={false} download href={electiveCsvHref(data.query)}
          className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-link underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Export filtered electives CSV
        </Link>
      </div>
      <p className="max-w-[80ch] text-xs leading-5 text-muted-foreground">
        Exports up to {ELECTIVES_EXPORT_CAP} matching elective slots; the CSV records when results are truncated. Filters and college scope also apply to the download.
      </p>
    </div>}
  />;
}
