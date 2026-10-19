import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
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
import { electiveCsvHref , ELECTIVES_EXPORT_CAP } from "@/modules/academics/college-elective-export-model";

export default async function CollegeElectivesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const moduleAccess=await resolveOptionalModuleAccess(context);
  if(!moduleAccess.electives.enabled)return <main role="status" className="space-y-3 border-b border-border pb-5">
    <PageHeader title="Electives is turned off for this college" />
    <p className="text-sm text-body">Your college administrator can ask 42Students to switch Electives back on.
      Existing elective records are kept; this page cannot create or change electives while the module is off.</p>
    <Link href="/college" className="text-sm font-semibold text-link underline">Return to college dashboard</Link>
  </main>;

  const raw = readCollegeStructureParams(await searchParams);
  const parsed = collegeElectiveQuerySchema.safeParse(raw);
  if (!parsed.success) return <div className="min-w-0 overflow-x-clip space-y-4">
    <PageHeader eyebrow="College Admin · Academic Setup" title="Electives" />
    <ErrorState title="Invalid elective filters"
      description={collegeDirectoryValidationMessage(parsed.error)}
      action={<Link href="/college/electives" className="font-semibold text-link">Clear filters</Link>} />
  </div>;
  const [data, options] = await Promise.all([
    listCollegeElectives(context, parsed.data),
    listCollegeElectiveSlotOptions(context),
  ]);
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">
    <Link prefetch={false} download href={electiveCsvHref(data.query)}
      className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
      Export filtered electives CSV
    </Link>
    <p className="text-xs text-muted-foreground">Exports up to {ELECTIVES_EXPORT_CAP} matching elective slots; the CSV records when results are truncated. Filters and college scope also apply to the download.</p>
    </div>
    <CollegeSlotManager options={options} />
    <CollegeStructureDirectory data={data} electiveOptions={options} />
  </div>;
}
