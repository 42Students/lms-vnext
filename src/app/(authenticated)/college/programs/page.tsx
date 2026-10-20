import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminProgramDirectory } from "@/components/admin/admin-program-directory";
import { CollegeArchivedPrograms } from "@/components/academics/college-archived-programs";
import { PageHeader } from "@/components/ui/page-header";
import { listPrograms } from "@/modules/academics/program-service";
import { listProgramContents } from "@/modules/admin-ui/program-contents-service";
import { listArchivedCollegePrograms } from "@/modules/academics/college-program-mutation-service";
import { listDepartments } from "@/modules/departments/service";

export default async function CollegeProgramsPage() {
  const context = await getCurrentRequestContext();
  const collegeId = context.membership?.collegeId;
  if (!collegeId) redirect("/dashboard");

  // Both reads enforce scoped permissions and active college status.
  const [programs, departments, archived] = await Promise.all([
    listPrograms(context, collegeId),
    listDepartments(context, collegeId),
    listArchivedCollegePrograms(context),
  ]);
  const contents = await listProgramContents(context, collegeId, programs.map(program => program.id));

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Programs"
        description="Create, find and manage the programs in your college."
      />
      <section aria-label="Active programs" className="min-w-0">
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
      </section>
      <section aria-label="Archived programs" className="min-w-0">
        <CollegeArchivedPrograms programs={archived} />
      </section>
    </div>
  );
}
