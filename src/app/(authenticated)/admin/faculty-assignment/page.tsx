import {getCurrentRequestContext} from "@/auth/request-context";
import Link from "next/link";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {TeachingAssignmentActions} from "@/components/courses/admin-course-actions";
import {listAdminFacultyAssignments,getSuperAdminFacultyAssignmentClasses} from "@/modules/admin-ui/super-admin-faculty-assignments-service";
const statuses=["ALL","ACTIVE","ENDED"] as const;
export default async function SuperAdminFacultyAssignmentPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 const classes=context.adminScope?.collegeId?await getSuperAdminFacultyAssignmentClasses(context):[];
 return <div className="space-y-5"><div className="flex flex-wrap items-center gap-3"><p className="font-semibold">Current teaching assignments</p><Link href="/admin/courses" className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Create teaching assignment →</Link></div><AdminScopedReadPage classOptions={classes} title="Faculty Assignments" path="/admin/faculty-assignment" statuses={statuses}
  exportPath="/api/admin/faculty-assignment/export" exportFilename="faculty-assignments.csv"
  description="Connect faculty to the right class, course, semester and teaching role. Account status and profile changes stay on the Faculty roster."
  searchParams={searchParams}
  renderRowActions={row=>row.status==="ACTIVE"?<TeachingAssignmentActions legacyCopy assignment={{
    id:row.id,facultyDisplayName:row.title,courseName:row.subtitle,sectionName:row.details[0]??"Selected class",
  }}/>:null}
  loader={query=>listAdminFacultyAssignments(context,query)}/></div>;
}
