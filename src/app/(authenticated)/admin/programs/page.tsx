import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {ErrorState} from "@/components/ui/error-state";
import { AdminProgramDirectory } from "@/components/admin/admin-program-directory";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listPrograms } from "@/modules/academics/program-service";
import { listProgramContents } from "@/modules/admin-ui/program-contents-service";
import { listDepartments } from "@/modules/departments/service";

export default async function SuperAdminProgramsPage() {
  const context = await getCurrentRequestContext();
  if(!isSuperAdmin(context))return <div className="min-w-0 space-y-6">
    <PageHeader title="Programs"/>
    <ErrorState title="Program access denied"
      description="Your account cannot access Super Admin programs."
      action={<Link href="/dashboard" className="font-semibold text-primary-text underline">Back to dashboard</Link>}/>
  </div>;
  const collegeId = context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader  title="Programs"
          description="Choose a college scope before managing programs." />
        <EmptyState title="Select a college to continue"
          description="Choose a college in the header above to see its programs." />
      </div>
    );
  }

  // A failed read must never render a false empty program directory or
  // authoring controls backed by incomplete departmental/course choices.
  const outcome=await (async()=>{
    const [programs,departments]=await Promise.all([
      listPrograms(context,collegeId),
      listDepartments(context,collegeId),
    ]);
    const contents=await listProgramContents(context,collegeId,programs.map(program=>program.id));
    return {programs,departments,contents};
  })().then(value=>({ok:true as const,value}))
     .catch(()=>({ok:false as const}));
  if(!outcome.ok)return <div className="min-w-0 space-y-6">
    <PageHeader title="Programs"/>
    <ErrorState title="Programs unavailable"
      description="The selected college's program directory could not be verified. No changes were made."
      action={<Link href="/admin/programs" className="font-semibold text-primary-text underline">Retry loading programs</Link>}/>
  </div>;
  const {programs,departments,contents}=outcome.value;

  return (
    <div className="min-w-0 space-y-6">
      <AcademicSetupSteps step={2} />
      <PageHeader
        
        title="Programs"
        description="Manage programs within the selected college safety scope."
      />
      <Link href="/admin/academics"
        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle">
        Open Academic Setup overview →
      </Link>
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
