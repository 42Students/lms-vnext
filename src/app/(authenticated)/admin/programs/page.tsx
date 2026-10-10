import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminProgramDirectory } from "@/components/admin/admin-program-directory";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listPrograms } from "@/modules/academics/program-service";
import { listDepartments } from "@/modules/departments/service";

export default async function SuperAdminProgramsPage() {
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Super Admin" title="Programs"
          description="Choose a college scope before managing programs." />
        <EmptyState title="Select a college scope"
          description="Use the Super Admin scope selector to choose a college." />
      </div>
    );
  }

  const [programs, departments] = await Promise.all([
    listPrograms(context, collegeId),
    listDepartments(context, collegeId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Programs"
        description="Manage programs within the selected college safety scope."
      />
      <AdminProgramDirectory
        programs={programs.map((program) => ({
          id: program.id,
          name: program.name,
          code: program.code,
          departmentId: program.departmentId,
          departmentName: program.departmentName,
          durationTerms: program.durationTerms,
        }))}
        departments={departments.map((department) => ({
          id: department.id,
          name: department.name,
        }))}
      />
    </div>
  );
}
