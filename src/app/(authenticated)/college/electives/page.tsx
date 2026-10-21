import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
import Link from "next/link";
import {isSuperAdmin} from "@/modules/identity/context";
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
  if (!context.membership) return <section className="min-w-0 space-y-4" role="alert">
    <PageHeader title="Electives"/>
    <ErrorState title={isSuperAdmin(context)?"Select a college first":"Admin not assigned to a college"}
      description={isSuperAdmin(context)?"Select a college in the college and role switcher before managing electives.":
        "Contact your administrator to assign a college before managing electives."}
      action={<Link href="/dashboard" className="font-semibold text-link underline">Back to dashboard</Link>}/>
  </section>;
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
  const [dataResult, optionsResult] = await Promise.allSettled([
    listCollegeElectives(context, parsed.data),
    listCollegeElectiveSlotOptions(context),
  ]);
  if(dataResult.status==="rejected")return <section className="space-y-4">
    <PageHeader title="Electives"/>
    <ErrorState title="Couldn't load elective slots"
      description="The elective slots could not be loaded. The previous results have not been changed."
      action={<Link href="/college/electives" className="font-semibold text-link underline">Retry slots</Link>}/>
  </section>;
  const data=dataResult.value;
  const options=optionsResult.status==="fulfilled"?optionsResult.value:undefined;
  return <CollegeStructureDirectory data={data} electiveOptions={options}
    prepend={<div className="min-w-0 space-y-[var(--lms-space-3)]">
      <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] sm:flex-row sm:flex-wrap sm:items-center">
        {options?<CollegeSlotManager options={options} />:
          <ErrorState title="Couldn't load elective slot options"
            description="Program and period choices could not be refreshed. Existing slots are still available below."
            action={<Link href="/college/electives" className="font-semibold text-link underline">Retry slots</Link>}/>}
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
