import {getCurrentRequestContext} from "@/auth/request-context";
import {redirect} from "next/navigation";
import {isSuperAdmin} from "@/modules/identity/context";
import Link from "next/link";
import { Disclosure } from "@/components/ui/disclosure";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {TeachingAssignmentActions} from "@/components/courses/admin-course-actions";
import {SuperAdminFacultyAssignmentCreate,SuperAdminTeachingRoleEdit} from "@/components/admin/super-admin-faculty-assignment-create";
import {COURSE_TEACHING_ROLES} from "@/modules/courses/constants";
import {getAdminCourseWorkspace} from "@/modules/courses/admin-course-workspace";
import {listAdminFacultyAssignments,getSuperAdminFacultyAssignmentClasses} from "@/modules/admin-ui/super-admin-faculty-assignments-service";
const statuses=["ALL","ACTIVE","ENDED"] as const;
export default async function SuperAdminFacultyAssignmentPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context))redirect("/dashboard");
 const collegeId=context.adminScope?.collegeId??null;
 const [classes,workspace]=await Promise.all([
  collegeId?getSuperAdminFacultyAssignmentClasses(context):Promise.resolve([]),
  collegeId?getAdminCourseWorkspace(context,collegeId):Promise.resolve(null),
 ]);
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <AdminScopedReadPage
  intro={workspace?<section aria-label="Create faculty assignment" className="flex min-w-0 flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
   <SuperAdminFacultyAssignmentCreate deliveries={workspace.deliveries} faculty={workspace.faculty} truncated={workspace.facultyTruncated}/>
   <Link href="/admin/courses" className="inline-flex min-h-11 items-center self-start rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Create teaching assignment →</Link>
  </section>:null}
  classOptions={classes} title="Faculty Assignments" path="/admin/faculty-assignment" statuses={statuses}
  exportPath="/api/admin/faculty-assignment/export" exportFilename="faculty-assignments.csv"
  description="Connect faculty to the right class, course, semester and teaching role. Account status and profile changes stay on the Faculty roster."
  searchParams={searchParams}
  renderRowActions={row=>{
    if(row.status!=="ACTIVE")return null;
    const rawRole=row.details.find(detail=>detail.startsWith("Teaching role: "))?.slice("Teaching role: ".length);
    const role=COURSE_TEACHING_ROLES.find(value=>value===rawRole);
    return <Disclosure title="Manage assignment" className="min-w-0"
      contentClassName="flex min-w-0 flex-col items-start gap-2 pb-2 pt-2 sm:flex-row sm:flex-wrap">
      {role&&row.revision?<SuperAdminTeachingRoleEdit assignmentId={row.id} role={role} revision={row.revision}/>:null}
      <TeachingAssignmentActions legacyCopy assignment={{
        id:row.id,facultyDisplayName:row.title,courseName:row.subtitle,sectionName:row.details[0]??"Selected class",
      }}/>
    </Disclosure>;
  }}
  loader={query=>listAdminFacultyAssignments(context,query)}/></div>;
}
