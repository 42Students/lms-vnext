import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminProgramDirectory } from "@/components/admin/admin-program-directory";
import { PageHeader } from "@/components/ui/page-header";
import { listPrograms } from "@/modules/academics/program-service";
import { listDepartments } from "@/modules/departments/service";

export default async function CollegeProgramsPage() {
  const context = await getCurrentRequestContext();
  const collegeId = context.membership?.collegeId;
  if (!collegeId) redirect("/dashboard");

  // Both reads enforce scoped permissions and active college status.
  const [programs, departments] = await Promise.all([
    listPrograms(context, collegeId),
    listDepartments(context, collegeId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Programs"
        description="Create, find and manage the programs in your college."
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
