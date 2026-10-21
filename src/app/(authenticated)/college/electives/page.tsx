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
import { Tabs } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import {isSuperAdmin} from "@/modules/identity/context";
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
  if (!context.membership&&!isSuperAdmin(context)) redirect("/dashboard");
  if(isSuperAdmin(context)&&!context.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
    <PageHeader title="Electives"/>
    <Alert tone="warning">Select a college first to manage elective slots.</Alert>
  </div>;
  const moduleAccess=await resolveOptionalModuleAccess(context);
  if(!moduleAccess.electives.enabled)return <section role="status" className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Electives is turned off for this college" />
    <p className="text-sm text-body leading-[22px]">Your college administrator can ask 42Students to switch Electives back on.
      Existing elective records are kept; this page cannot create or change electives while the module is off.</p>
    <Link href="/college" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Return to college dashboard</Link>
  </section>;

  const params=await searchParams;
  const normalized={...params};
  if(params.includeArchived!==undefined){
    if(params.status!==undefined||Array.isArray(params.includeArchived))
      normalized.status="INVALID";
    else normalized.status=params.includeArchived==="true"?"ALL":
      params.includeArchived==="false"?"ACTIVE":"INVALID";
    delete normalized.includeArchived;
  }
  if(params.semester!==undefined){
    if(params.semesterNumber!==undefined)normalized.semesterNumber="INVALID";
    else normalized.semesterNumber=params.semester;
    delete normalized.semester;
  }
  const raw = readCollegeStructureParams(normalized);
  const parsed = collegeElectiveQuerySchema.safeParse(raw);
  if (!parsed.success) return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Electives" />
    <ErrorState title="Invalid elective filters"
      description={collegeDirectoryValidationMessage(parsed.error)}
      action={<Link href="/college/electives" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] w-full md:w-auto">Clear filters</Link>} />
  </div>;
  const [directoryRead,optionsRead]=await Promise.allSettled([
    listCollegeElectives(context,parsed.data),listCollegeElectiveSlotOptions(context),
  ]);
  if(directoryRead.status==="rejected")return <section className="min-w-0 space-y-4">
    <PageHeader title="Electives"/>
    <Alert tone="error">Could not load elective slots. No empty results have been inferred.</Alert>
    <Link href="/college/electives" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry slots</Link>
  </section>;
  if(optionsRead.status==="rejected")return <section className="min-w-0 space-y-4">
    <PageHeader title="Electives"/>
    <Alert tone="warning">Slot editing options could not be verified. Retry to access the scoped editor.</Alert>
    <Link href="/college/electives" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry options</Link>
  </section>;
  const data=directoryRead.value,options=optionsRead.value;
  return <div className="min-w-0 space-y-4">
   <Tabs ariaLabel="Academic Setup" renderPanel={false} value="/college/electives"
     items={[
      {value:"/college/academics",label:"Academic Setup",href:"/college/academics"},
      {value:"/college/programs",label:"Programs",href:"/college/programs"},
      {value:"/college/batches",label:"Batches",href:"/college/batches"},
      {value:"/college/semesters",label:"Semesters",href:"/college/semesters"},
      {value:"/college/electives",label:"Electives",href:"/college/electives"},
     ]}/>
   <CollegeStructureDirectory data={data} electiveOptions={options}
    prepend={<div className="min-w-0 space-y-[var(--lms-space-3)]">
      {optionResult.error ? <div role="alert" className="border border-amber-300 bg-amber-50 p-3 text-sm">Could not load elective options. <Link href="/college/electives" className="font-semibold underline">Retry options</Link></div> : null}
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
      <Alert tone="info">An elective slot is one choice for an eligible program and semester. For example, students may pick one of three courses. Create a slot, add its course offerings, then review allocation and student counts.</Alert>
      <p className="max-w-[80ch] text-xs leading-5 text-muted-foreground">
        Exports up to {ELECTIVES_EXPORT_CAP} matching elective slots; the CSV records when results are truncated. Filters and college scope also apply to the download.
      </p>
    </div>}
  />
  </div>;
}
