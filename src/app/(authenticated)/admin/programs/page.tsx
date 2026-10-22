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
import { listProgramsPage, listGlobalProgramsForSuperAdmin } from "@/modules/academics/program-service";
import {z} from "zod";
import { listProgramContents } from "@/modules/admin-ui/program-contents-service";
import { listDepartments } from "@/modules/departments/service";

export default async function SuperAdminProgramsPage({
 searchParams,
}: {searchParams?:Promise<{page?:string;q?:string;pageSize?:string}>} ) {
  const context = await getCurrentRequestContext();
  if(!isSuperAdmin(context))return <div className="min-w-0 space-y-5">
    <PageHeader title="Programs"/>
    <ErrorState title="Program access denied"
      description="Your account cannot access Super Admin programs."
      action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Back to dashboard</Link>}/>
  </div>;
  const collegeId = context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    // The legacy Super Admin /fetchAll is a catalogue read, not authority to
    // edit a program outside the selected college x role workspace.
    {
      const rawPage=(await searchParams)?.page;
      if(rawPage && !/^[1-9][0-9]{0,3}$/.test(rawPage))
        return <div className="min-w-0 space-y-4">
          <PageHeader title="Programs" />
          <ErrorState title="Invalid page number" description="Choose a valid page of the global program directory."
            action={<Link href="/admin/programs" className="font-semibold text-link underline">Return to first page</Link>} />
        </div>;
      const page=rawPage?Number(rawPage):1;
      const directory=await listGlobalProgramsForSuperAdmin(context,{page}).catch(()=>null);
      if(!directory)return <div className="min-w-0 space-y-4">
        <PageHeader title="Programs" description={context.adminScope?.organizationId?"Organization program catalogue":"Platform-wide program catalogue"} />
        <ErrorState title="Could not load programs"
          description="The global program catalogue is unavailable. No rows are assumed empty, and no college has been selected."
          action={<Link href={"/admin/programs?page="+page} className="font-semibold text-link underline">Retry program directory</Link>} />
      </div>;
      return <div className="min-w-0 space-y-5">
        <PageHeader title="Programs"
          description="Read-only platform catalogue for the selected scope. Select a college before creating or editing programs." />
        <p className="text-sm text-body" role="status">
          {directory.total.toLocaleString("en-IN")} active programs across active colleges. Page {directory.page} of {directory.totalPages}.
        </p>
        {directory.items.length?<div className="min-w-0 overflow-x-auto border-y border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Programs across colleges, read only</caption>
            <thead><tr className="border-b border-border text-xs font-semibold text-muted-foreground">
              <th scope="col" className="px-3 py-3">Program</th>
              <th scope="col" className="px-3 py-3">Department</th>
              <th scope="col" className="px-3 py-3">College</th>
              <th scope="col" className="px-3 py-3">Organization</th>
              <th scope="col" className="px-3 py-3">Duration</th>
            </tr></thead>
            <tbody>{directory.items.map(program=><tr key={program.id} className="border-b border-border last:border-b-0">
              <td className="px-3 py-3 font-semibold text-[var(--lms-heading)]">{program.name} <span className="block text-xs font-normal text-muted-foreground">{program.code}</span></td>
              <td className="px-3 py-3">{program.departmentName}</td>
              <td className="px-3 py-3">{program.collegeName}</td>
              <td className="px-3 py-3">{program.organizationName}</td>
              <td className="px-3 py-3 tabular-nums">{program.durationYears} years</td>
            </tr>)}</tbody>
          </table>
        </div>:<EmptyState title="No programs found" description="No active college programs are available in the platform catalogue."/>}
        <nav aria-label="Program directory pagination" className="flex flex-wrap gap-4 text-sm font-semibold">
          {directory.page>1?<Link href={"/admin/programs?page="+(directory.page-1)} className="text-link underline">Previous page</Link>:null}
          {directory.page<directory.totalPages?<Link href={"/admin/programs?page="+(directory.page+1)} className="text-link underline">Next page</Link>:null}
        </nav>
        <p className="text-xs text-muted-foreground">This list is informational. Changes require an explicitly selected college.</p>
      </div>;
    }
  }

  // A selected-college directory reads only its SQL page: never load every
  // learner-facing or archived program to filter them in the browser.
  const filters=z.strictObject({
    q:z.string().trim().max(100).default(""),
    page:z.coerce.number().int().min(1).max(10000).default(1),
    pageSize:z.coerce.number().int().min(1).max(100).default(20),
  }).safeParse(await searchParams??{});
  if(!filters.success)return <div className="min-w-0 space-y-4">
   <PageHeader title="Programs"/>
   <ErrorState title="Invalid program filters"
    description="Search must be at most 100 characters. Choose a page from 1 to 10000 and a size from 1 to 100."
    action={<Link href="/admin/programs" className="inline-flex min-h-11 items-center font-semibold text-link underline">Clear filters</Link>}/>
  </div>;
  const [programRead,departmentRead]=await Promise.allSettled([
    listProgramsPage(context,collegeId,filters.data),
    listDepartments(context,collegeId),
  ]);
  if(programRead.status==="rejected")return <div className="min-w-0 space-y-5">
    <PageHeader title="Programs"/>
    <ErrorState title="We could not load this page"
      description="The selected college's program directory could not be verified. No changes were made."
      action={<Link href="/admin/programs" className="lms-inline-link inline-flex min-h-11 items-center font-semibold underline md:min-h-9">Retry loading programs</Link>}/>
  </div>;
  const programPage=programRead.value;
  const programs=programPage.programs;
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
    {programs.length===0?<EmptyState title="No programs found. Create a department first." description="No programs are recorded in the selected college."/>:
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
          description="Create New Program and manage Existing Programs for this college." />
      </div>
      <AcademicSetupSteps step={2} />
      <AdminProgramDirectory
        serverPage={{page:programPage.page,total:programPage.total,totalPages:programPage.totalPages,
          pageSize:programPage.pageSize,q:filters.data.q}}
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
