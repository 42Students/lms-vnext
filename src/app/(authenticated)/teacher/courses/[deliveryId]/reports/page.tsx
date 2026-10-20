import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {parseFacultyReportsHubLocation,facultyReportHubHref} from "@/modules/courses/faculty-reports-hub-model";
import {getFacultyReportsHub} from "@/modules/courses/faculty-reports-hub-service";
type Search={kind?:string|string[];page?:string|string[]};
export default async function FacultyReportsHubPage({params,searchParams}:{
params:Promise<{deliveryId:string}>;searchParams:Promise<Search>}){
 const [{deliveryId},raw]=await Promise.all([params,searchParams]);
 const parsed=parseFacultyReportsHubLocation(deliveryId,raw);
 if(!parsed.success)return <section role="alert" className="min-w-0 space-y-3">
 <PageHeader title={"Invalid report filters"} />
 <Link href="/teacher/courses" className="text-primary-text underline inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Courses</Link>
 </section>;
 const data=await getFacultyReportsHub(await getCurrentRequestContext(),parsed.data);
 const root="/teacher/courses/"+encodeURIComponent(deliveryId);
 return <div className="min-w-0 max-w-full space-y-6">
 <PageHeader title="Section reports"
 actions={<Link href={root+"/home"} className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Section workspace</Link>}/>
 <p className="text-sm text-body">{data.rosterSize} current eligible learners.</p>
 <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
 {([["Assignments",data.breakdown.assignments],
 ["Quizzes",data.breakdown.quizzes],
 ["Published assignments",data.breakdown.publishedAssignments],
 ["Published quizzes",data.breakdown.publishedQuizzes]] as const).map(([title,n])=>
 <section key={title} className="min-w-0 border-b border-[var(--lms-canvas-border)] bg-transparent py-4">
 <h2 className="text-xs font-semibold text-muted-foreground">{title}</h2>
 <p className="mt-2 text-xl font-semibold tabular-nums">{n}</p></section>)}</div>
 <div className="grid gap-3 md:grid-cols-2">
 <section className="min-w-0 border-b border-[var(--lms-canvas-border)] bg-transparent py-5">
 <h2 className="font-semibold">Attendance</h2>
 <p className="mt-2 text-sm text-body">{data.attendance.scheduled} scheduled sessions;
 {" "}{data.attendance.marked} marked. Unmarked attendance is unknown, not zero.</p>
 <Link href={root+"/attendanceDetail"} className="mt-3 inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open attendance report →</Link>
 </section>
 <section className="min-w-0 border-b border-[var(--lms-canvas-border)] bg-transparent py-5">
 <h2 className="font-semibold">Published gradebook</h2>
 <p className="mt-2 text-sm text-body">Published assessment counts are not a final grade. Individual published scores are shown only in the gradebook.</p>
 <Link href={root+"/gradebook"} className="mt-3 inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open gradebook →</Link>
 </section></div>
 <form method="get" className="flex flex-wrap items-end gap-3">
 <label className="grid gap-1 text-[13px] font-semibold leading-4">Assessment type
 <Select name="kind" defaultValue={data.query.kind} className="min-h-11 md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
 <option value="ALL">All</option><option value="ASSIGNMENT">Assignments</option><option value="QUIZ">Quizzes</option>
 </Select></label>
 <Button type="submit" variant="primary" className="min-h-11 md:min-h-9">Filter</Button>
 <Link href={facultyReportHubHref({...data.query,kind:"ALL",page:1})} className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center px-3 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear</Link>
 </form>
 {data.health.items.length===0?<EmptyState title="No published assessment reports"
 description="This Section has no published assessments matching the filter. Private or ungraded work is not fabricated."/>
 :<div className="grid gap-3">{data.health.items.map(item=>
 <article key={item.kind+item.id} className="min-w-0 border-b border-[var(--lms-canvas-border)] bg-transparent py-4">
 <h2 className="font-semibold">{item.title}</h2>
 <p className="mt-1 text-sm text-body">{item.kind} · {item.responded}/{item.eligible} recorded responses · {item.outstanding} not responded</p>
 <p className="mt-1 text-xs text-muted-foreground">Graded average: {item.averagePercent===null?"Unknown":item.averagePercent+"%"}</p>
 <Link href={item.href} className="mt-3 inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open Section report →</Link>
 </article>)}</div>}
 <nav aria-label="Report pages" className="flex min-w-0 flex-wrap items-center justify-between gap-3">
 <span className="text-sm text-muted-foreground">Page {data.health.page} of {data.health.totalPages}</span>
 <div className="flex gap-3">
 {data.health.page>1&&<Link href={facultyReportHubHref({...data.query,page:data.health.page-1})} className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Previous</Link>}
 {data.health.page<data.health.totalPages&&<Link href={facultyReportHubHref({...data.query,page:data.health.page+1})} className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Next</Link>}
 </div></nav>
 <p className="text-xs text-muted-foreground">All counts are exact current-Section persisted records. Missing and unpublished grades remain unknown.</p>
 </div>;
}
