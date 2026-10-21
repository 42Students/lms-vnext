import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {ErrorState} from "@/components/ui/error-state";
import {Alert} from "@/components/ui/alert";
import { AdminProgramDirectory } from "@/components/admin/admin-program-directory";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { listPrograms } from "@/modules/academics/program-service";
import { listProgramContents } from "@/modules/admin-ui/program-contents-service";
import { listDepartments } from "@/modules/departments/service";

export default async function SuperAdminProgramsPage() {
  const context = await getCurrentRequestContext();
  if(!isSuperAdmin(context))return <div className="min-w-0 space-y-5">
    <PageHeader title="Programs"/>
    <ErrorState title="Program access denied"
      description="Your account cannot access Super Admin programs."
      action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Back to dashboard</Link>}/>
  </div>;
  const collegeId = context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-5">
        <PageHeader  title="Programs"
          description="Select an Organization + College in the header above to view programs." />
        <Alert tone="warning" role="alert">⚠ Select a college to continue. Choose an Organization + College in the header above before managing programs.</Alert>
        <EmptyState title="Select a college to continue"
          description="Choose a college in the header above to see its programs." />
      </div>
    );
  }

  // Fetch both inventories independently. A missing department/contents read
  // must not masquerade as an empty directory or enable incomplete edits.
  const [programRead,departmentRead]=await Promise.allSettled([
    listPrograms(context,collegeId),
    listDepartments(context,collegeId),
  ]);
  if(programRead.status==="rejected")return <div className="min-w-0 space-y-5">
    <PageHeader title="Programs"/>
    <ErrorState title="Programs unavailable"
      description="The selected college's program directory could not be verified. No changes were made."
      action={<Link href="/admin/programs" className="lms-inline-link inline-flex min-h-11 items-center font-semibold underline md:min-h-9">Retry loading programs</Link>}/>
  </div>;
  const programs=programRead.value;
  const contentsRead=await listProgramContents(context,collegeId,programs.map(program=>program.id))
    .then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}));
  if(departmentRead.status==="rejected"||!contentsRead.ok)return <div className="min-w-0 space-y-5">
    <div className="min-w-0">
      <PageBackLink href="/admin/academics" label="Academic Setup overview" />
      <PageHeader title="Programs" description="Selected-college programs are read-only until all setup details load." />
    </div>
    <AcademicSetupSteps step={2}/>
    <Alert tone="warning" role="alert">
      <strong>Couldn&apos;t refresh all program details.</strong>
      The current program list is verified, but {departmentRead.status==="rejected"?"departments":"course contents"} could not be loaded.
      Edits are paused to avoid incomplete selections.
      <Link href="/admin/programs" className="lms-inline-link font-semibold underline underline-offset-4">Retry loading details</Link>
    </Alert>
    {programs.length===0?<EmptyState title="No programs yet" description="No programs are recorded in the selected college."/>:
      <section aria-label="Programs read-only">
        <h2 className="mb-2 text-base font-semibold text-body">Programs ({programs.length})</h2>
        <ul className="divide-y divide-border border-y border-border">
          {programs.map(program=><li key={program.id} className="px-3 py-3 text-sm text-body">
            <strong>{program.name}</strong> ({program.code})
            <span className="mt-1 block text-xs text-muted-foreground">{program.departmentName??"Department not recorded"}</span>
          </li>)}
        </ul>
      </section>}
  </div>;
  const departments=departmentRead.value;
  const contents=contentsRead.value;

  return (
    <div className="min-w-0 space-y-5">
      <div className="min-w-0">
        <PageBackLink href="/admin/academics" label="Academic Setup overview" />
        <PageHeader title="Programs"
          description="Manage programs within the selected college safety scope." />
      </div>
      <AcademicSetupSteps step={2} />
      <AdminProgramDirectory
        programs={programs.map((program) => ({
          id: program.id,
          name: program.name,
          code: program.code,
          departmentId: program.departmentId,
          departmentName: program.departmentName,
          durationTerms: program.durationTerms,
          contents: contents.get(program.id) ?? null,
        }))}
        departments={departments.map((department) => ({
          id: department.id,
          name: department.name,
        }))}
      />
    </div>
  );
}
