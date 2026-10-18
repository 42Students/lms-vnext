import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminProgramDirectory } from "@/components/admin/admin-program-directory";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listPrograms } from "@/modules/academics/program-service";
import { listProgramContents } from "@/modules/admin-ui/program-contents-service";
import { listDepartments } from "@/modules/departments/service";

export default async function SuperAdminProgramsPage() {
  const context = await getCurrentRequestContext();
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

  const [programs, departments] = await Promise.all([
    listPrograms(context, collegeId),
    listDepartments(context, collegeId),
  ]);
  const contents = await listProgramContents(context, collegeId, programs.map(program => program.id));

  return (
    <div className="min-w-0 space-y-6">
      <AcademicSetupSteps step={2} />
      <PageHeader
        
        title="Programs"
        description="Manage programs within the selected college safety scope."
      />
      <Link href="/admin/academics"
        className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-teal-deep)] hover:border-primary hover:bg-primary-subtle">
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
