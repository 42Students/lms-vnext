import {getCurrentRequestContext} from "@/auth/request-context";
import Link from "next/link";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminFacultyAssignments,getSuperAdminFacultyAssignmentClasses} from "@/modules/admin-ui/super-admin-faculty-assignments-service";
const statuses=["ALL","ACTIVE","ENDED"] as const;
export default async function SuperAdminFacultyAssignmentPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 const classes=context.adminScope?.collegeId?await getSuperAdminFacultyAssignmentClasses(context):[];
 return <div className="space-y-5"><div className="flex flex-wrap items-center gap-3"><p className="font-semibold">Current teaching assignments</p><Link href="/admin/courses" className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Create teaching assignment →</Link></div><AdminScopedReadPage classOptions={classes} title="Faculty Assignments" path="/admin/faculty-assignment" statuses={statuses}
  exportPath="/api/admin/faculty-assignment/export" exportFilename="faculty-assignments.csv"
  description="Read-only teaching history for the selected college. Export includes Faculty, Course, Class, Semester, Year, Role and Active columns."
  searchParams={searchParams} loader={query=>listAdminFacultyAssignments(context,query)}/></div>;
}
