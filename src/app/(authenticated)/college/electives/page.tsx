import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
import {isSuperAdmin} from "@/modules/identity/context";
import { getCurrentRequestContext } from "@/auth/request-context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { CollegeStructureDirectory } from "@/components/academics/college-structure-directory";
import { listCollegeElectiveSlotOptions } from "@/modules/electives/college-slot-mutation-service";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import {
  collegeElectiveQuerySchema,
  readCollegeStructureParams,
} from "@/modules/academics/college-structure-directory-model";
import { listCollegeElectives } from "@/modules/academics/college-structure-directory-service";
import { electiveCsvHref, ELECTIVES_EXPORT_CAP } from "@/modules/academics/college-elective-export-model";
import { TextLink } from "@/components/ui/text-link";

export default async function CollegeElectivesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership&&!isSuperAdmin(context)) return <div className="min-w-0 space-y-4">
    <PageHeader title="Electives"/>
    <Alert tone="warning" title="Admin not assigned to a college">
     Contact your administrator to assign you to a college before managing elective slots.
    </Alert>
   </div>;
  if(isSuperAdmin(context)&&!context.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
    <PageHeader title="Electives"/>
    <Alert tone="warning">Select a college first to manage elective slots.</Alert>
  </div>;
  const moduleAccess=await resolveOptionalModuleAccess(context);
  if(!moduleAccess.electives.enabled)return <section role="status" className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Electives is turned off for this college" />
    <p className="text-sm text-body leading-[22px]">Your college administrator can ask 42Students to switch Electives back on.
      Existing elective records are kept; this page cannot create or change electives while the module is off.</p>
    <TextLink href="/college" className="inline-flex min-h-11 items-center md:min-h-9">Return to college dashboard</TextLink>
  </section>;

  const params=await searchParams;
  const normalized={...params};
  if(params["includeArchived"]!==undefined){
    if(params["status"]!==undefined||Array.isArray(params["includeArchived"]))
      normalized["status"]="INVALID";
    else normalized["status"]=params["includeArchived"]==="true"?"ALL":
      params["includeArchived"]==="false"?"ACTIVE":"INVALID";
    delete normalized["includeArchived"];
  }
  if(params["semester"]!==undefined){
    if(params["semesterNumber"]!==undefined)normalized["semesterNumber"]="INVALID";
    else normalized["semesterNumber"]=params["semester"];
    delete normalized["semester"];
  }
  const raw = readCollegeStructureParams(normalized);
  const parsed = collegeElectiveQuerySchema.safeParse(raw);
  if (!parsed.success) return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Electives" />
    <ErrorState title="Invalid elective filters"
      description={collegeDirectoryValidationMessage(parsed.error)}
      action={<TextLink href="/college/electives" className="inline-flex min-h-11 items-center md:min-h-9 w-full md:w-auto">Clear filters</TextLink>} />
  </div>;
  const [directoryRead,optionsRead]=await Promise.allSettled([
    listCollegeElectives(context,parsed.data),listCollegeElectiveSlotOptions(context),
  ]);
  if(directoryRead.status==="rejected")return <section className="min-w-0 space-y-4">
    <PageHeader title="Electives"/>
    <Alert tone="error">Could not load elective slots. No empty results have been inferred.</Alert>
    <TextLink href="/college/electives" className="inline-flex min-h-11 items-center md:min-h-9">Retry slots</TextLink>
  </section>;
  // An option-read failure must not hide the already-authorized directory.
  // Keep its rows visible and retry the editor options independently.
  const data=directoryRead.value;
  const options=optionsRead.status==="fulfilled"?optionsRead.value:undefined;
  return <div className="min-w-0 overflow-x-clip space-y-4">
   <Tabs ariaLabel="Academic Setup" renderPanel={false} value="/college/electives"
     items={[
      {value:"/college/academics",label:"Academic Setup",href:"/college/academics"},
      {value:"/college/programs",label:"Programs",href:"/college/programs"},
      {value:"/college/batches",label:"Batches",href:"/college/batches"},
      {value:"/college/semesters",label:"Semesters",href:"/college/semesters"},
      {value:"/college/electives",label:"Electives",href:"/college/electives"},
     ]}/>
   <CollegeStructureDirectory data={data} {...(options!==undefined?{electiveOptions:options}:{})}
    prepend={<div className="min-w-0 space-y-[var(--lms-space-3)]">
      <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] sm:flex-row sm:flex-wrap sm:items-center">
        {!options?<ErrorState title="Couldn't load elective slot options"
          description="Program and period choices could not be refreshed. Existing slots are still available below."
          action={<TextLink href="/college/electives">Retry options</TextLink>}/>:null}
        <TextLink prefetch={false} download href={electiveCsvHref(data.query)}
          className="inline-flex min-h-11 items-center justify-center text-sm md:min-h-9">
          Export filtered electives CSV
        </TextLink>
      </div>
      <Alert tone="info">An elective slot is one choice for an eligible program and semester. For example, students may pick one of three courses. Create a slot, add its course offerings, then review allocation and student counts.</Alert>
      <p className="max-w-[80ch] text-xs leading-5 text-muted-foreground">
        Exports up to {ELECTIVES_EXPORT_CAP} matching elective slots; the CSV records when results are truncated. Filters and college scope also apply to the download.
      </p>
    </div>}
  />
  </div>;
}
