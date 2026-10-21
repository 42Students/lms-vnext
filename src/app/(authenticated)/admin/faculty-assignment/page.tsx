import {and,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courseTeachingAssignments,courseSectionDeliveries,courseOfferings,courses,departments} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {redirect} from "next/navigation";
import {isSuperAdmin} from "@/modules/identity/context";
import Link from "next/link";
import {Alert} from "@/components/ui/alert";
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
 const [classesResult,workspaceResult]=await Promise.allSettled([
  collegeId?getSuperAdminFacultyAssignmentClasses(context):Promise.resolve([]),
  collegeId?getAdminCourseWorkspace(context,collegeId):Promise.resolve(null),
 ]);
 const metrics = collegeId ? await Promise.allSettled([
  listAdminFacultyAssignments(context,{status:"ALL",page:1,pageSize:20}),
  listAdminFacultyAssignments(context,{status:"ACTIVE",page:1,pageSize:20}),
  getDb().select({
   primary:sql<number>`count(*) filter (where ${courseTeachingAssignments.role} = 'PRIMARY')::integer`,
   classes:sql<number>`count(distinct ${courseSectionDeliveries.sectionId})::integer`,
  }).from(courseTeachingAssignments)
   .innerJoin(courseSectionDeliveries,eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId))
   .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .where(and(eq(departments.collegeId,collegeId),
    isNull(courseTeachingAssignments.endedAt),isNull(courseSectionDeliveries.endedAt))),
 ]) : null;
 const metricsReady=metrics?.every(item=>item.status==="fulfilled")??false;
 const total=metrics?.[0].status==="fulfilled"?metrics[0].value.total:null;
 const active=metrics?.[1].status==="fulfilled"?metrics[1].value.total:null;
 const primary=metrics?.[2].status==="fulfilled"?metrics[2].value[0]?.primary:null;
 const covered=metrics?.[2].status==="fulfilled"?metrics[2].value[0]?.classes:null;
 return <div className="min-w-0 space-y-4 md:space-y-6">
  {collegeId&&classesResult.status==="rejected"?<Alert tone="warning" title="Some selection options are unavailable">
   Classes could not be loaded. Current faculty assignments remain available.
   {" "}<Link href="/admin/faculty-assignment" className="font-semibold underline">Retry options</Link>.
  </Alert>:null}
  {collegeId&&workspaceResult.status==="rejected"?<Alert tone="warning" title="Teaching assignment options are unavailable">
   Creation is temporarily disabled until the selected college's faculty and course choices can be verified.
   {" "}<Link href="/admin/faculty-assignment" className="font-semibold underline">Retry options</Link>.
  </Alert>:null}
  <AdminScopedReadPage
  intro={workspace?<div className="space-y-4">
   {metricsReady?<section aria-label="Faculty assignment overview" className="grid grid-cols-2 divide-x divide-border border-y border-border lg:grid-cols-4">
    {[
     {label:"Assignments",value:total},
     {label:"Active",value:active},
     {label:"Primary instructors",value:primary},
     {label:"Classes covered",value:covered},
    ].map(stat=><div key={stat.label} className="min-w-0 px-3 py-4">
      <p className="text-xs text-muted-foreground">{stat.label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{typeof stat.value==="number"?stat.value.toLocaleString("en-IN"):"—"}</p>
    </div>)}
   </section>:<p role="status" className="text-sm text-muted-foreground">Faculty assignment totals are temporarily unavailable.</p>}
   <section aria-label="Create Faculty Assignment" className="flex min-w-0 flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
   <SuperAdminFacultyAssignmentCreate deliveries={workspace.deliveries} faculty={workspace.faculty} truncated={workspace.facultyTruncated}/>
   <Link href="/admin/courses" className="inline-flex min-h-11 items-center self-start rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">Create teaching assignment →</Link>
  </section>
  </div>:null}
  classOptions={classes} title="Faculty Assignments" path="/admin/faculty-assignment" statuses={statuses}
  exportPath="/api/admin/faculty-assignment/export" exportFilename="faculty-assignments.csv"
  description="Connect faculty to the right class, course, semester and teaching role. Account status and profile changes stay on the Faculty roster."
  searchParams={searchParams}
  renderRowActions={row=>{
    if(row.status!=="ACTIVE")return null;
    const rawRole=row.details.find(detail=>detail.startsWith("Teaching role: "))?.slice("Teaching role: ".length);
    const role=COURSE_TEACHING_ROLES.find(value=>value===rawRole);
    return <div className="flex min-w-0 flex-wrap items-start gap-2" aria-label={"Assignment "+row.id+" actions"}>
      <Disclosure title={"Edit assignment "+row.id} className="min-w-0 border border-border rounded-[var(--lms-control-radius)] px-2"
        contentClassName="flex min-w-0 flex-col items-start gap-2 pb-3 pt-2">
        <p className="m-0 text-xs text-body">Edit assignment {row.id}</p>
        {role&&row.revision?<SuperAdminTeachingRoleEdit assignmentId={row.id}
          role={role} revision={row.revision}/>:null}
        <p className="m-0 max-w-prose text-xs text-muted-foreground">
          To change Faculty, Course, Class, Batch, Semester, or Year, end the
          existing assignment and create the replacement under the correct
          course delivery. Keeping distinct assignments preserves attendance
          and assessment audit history.
        </p>
        <Link href="/admin/courses" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
          Open course delivery setup →
        </Link>
      </Disclosure>
      <Disclosure title={"End assignment "+row.id} className="min-w-0 rounded-[var(--lms-control-radius)] border border-error px-2"
        contentClassName="flex min-w-0 flex-col items-start gap-2 pb-3 pt-2">
        <p className="m-0 text-xs text-body">End assignment {row.id}</p>
        <p className="m-0 max-w-prose text-xs text-muted-foreground">
          Delete teaching assignment? Ending it preserves auditable teaching history,
          and the assignment can no longer create new sessions.
        </p>
        <TeachingAssignmentActions legacyCopy assignment={{
          id:row.id,facultyDisplayName:row.title,courseName:row.subtitle,
          sectionName:row.details[0]??"Selected class",
        }}/>
      </Disclosure>
    </div>;
  }}
  loader={query=>listAdminFacultyAssignments(context,query)}/></div>;
}
