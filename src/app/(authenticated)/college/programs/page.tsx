import { Alert } from "@/components/ui/alert";
import { isSuperAdmin } from "@/modules/identity/context";
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
  const collegeId=context.membership?.collegeId ??
    (isSuperAdmin(context)?context.adminScope?.collegeId:null);
  if (!collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Programs"/>
    <Alert tone="warning" title="Admin not assigned to a college">
      You must be assigned to a college to view and manage programs. Contact your administrator.
    </Alert>
  </div>;

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
      <CollegeArchivedPrograms programs={archived} />
    </div>
  );
}
