import { Alert } from "@/components/ui/alert";
import { ErrorState } from "@/components/ui/error-state";
import {AuthorizationError} from "@/modules/permissions/policy";
import Link from "next/link";
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
  let programs:Awaited<ReturnType<typeof listPrograms>>;
  let departments:Awaited<ReturnType<typeof listDepartments>>;
  try {
    [programs, departments] = await Promise.all([
      listPrograms(context, collegeId),
      listDepartments(context, collegeId),
    ]);
  } catch (error) {
    if(error instanceof AuthorizationError)throw error;
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Programs" description="Create, find and manage the programs in your college."/>
      <ErrorState title="Could not load programs" description="Your college programs could not be refreshed. No records were changed."
        action={<Link href="/college/programs" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Retry</Link>}/>
    </div>;
  }
  // Auxiliary counts/archive listings must not cause a false empty active
  // directory. Keep the main program roster available when they fail.
  const [contentsResult, archivedResult] = await Promise.allSettled([
    listProgramContents(context, collegeId, programs.map(program => program.id)),
    listArchivedCollegePrograms(context),
  ]);
  if(contentsResult.status==="rejected"&&contentsResult.reason instanceof AuthorizationError)
    throw contentsResult.reason;
  if(archivedResult.status==="rejected"&&archivedResult.reason instanceof AuthorizationError)
    throw archivedResult.reason;
  const contents=contentsResult.status==="fulfilled"?contentsResult.value:new Map<string,{semesters:number;batches:number;classes:number}>();
  const archived=archivedResult.status==="fulfilled"?archivedResult.value:[];
  const partial=contentsResult.status==="rejected"||archivedResult.status==="rejected";

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Programs"
        description="Create, find and manage the programs in your college."
      />
      <nav aria-label="Academic Setup" className="flex min-w-0 flex-wrap gap-2 border-b border-border pb-3 text-sm">
        {([
          ["/college/departments","Departments"],
          ["/college/programs","Programs"],
          ["/college/semesters","Semesters"],
          ["/college/batches","Batches"],
          ["/college/classes","Classes"],
        ] as const).map(([href,label])=><Link key={href} href={href}
          aria-current={href==="/college/programs"?"page":undefined}
          className={"inline-flex min-h-11 items-center border-b-[3px] px-3 font-semibold md:min-h-9 "+
            (href==="/college/programs"?"border-primary text-primary-text":"border-transparent text-body hover:text-primary-text")}>
          {label}
        </Link>)}
      </nav>
      {partial?<Alert tone="warning">
        Some linked program details could not be loaded. Active programs remain available; refresh to retrieve the missing records.
        <Link href="/college/programs" className="ml-2 font-semibold text-link underline">Retry</Link>
      </Alert>:null}
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
