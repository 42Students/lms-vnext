import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getSuperAdminStudentCourseProgress} from "@/modules/courses/super-admin-student-course-progress";
import {studentCourseCompletion} from "@/modules/courses/super-admin-student-progress-model";
import {parseSuperAdminStudentProgressParams} from "@/modules/courses/super-admin-course-progress-query";
import {requirePermission} from "@/modules/permissions/policy";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {EmptyState} from "@/components/ui/empty-state";
import {DataTable} from "@/components/ui/data-table";
import {Alert} from "@/components/ui/alert";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";

export default async function SuperAdminStudentCourseProgressPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>
}){
 const context=await getCurrentRequestContext();
 requirePermission(context,"admin-scope.select");
 const raw=await searchParams;
 const allowed=new Set(["offeringId","page","pageSize","sort"]);
 const validKeys=Object.keys(raw).every(key=>allowed.has(key) && !Array.isArray(raw[key]));
 const offeringId=validKeys?parseSuperAdminStudentProgressParams({offeringId:raw.offeringId}):null;
 const pageSize=typeof raw.pageSize==="string"&&["20","50","100"].includes(raw.pageSize)
  ?Number(raw.pageSize):20;
 const requestedPage=typeof raw.page==="string"&&/^[1-9][0-9]{0,6}$/.test(raw.page)
  ?Number(raw.page):1;
 const sort=raw.sort==="percent-desc"?"percent-desc":"percent-asc";
 const back=<Link href="/admin/course-progress" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Back to Course Progress</Link>;
 if(!offeringId)return <div className="space-y-6">
  <PageHeader title="Student Course Progress"/>
  <ErrorState title="Choose a course offering" description="Course and class are required. Select a valid class and its taught course from Course Progress first; this page uses their authorized course offering, not separate legacy numeric IDs." action={back}/>
 </div>;
 let report:Awaited<ReturnType<typeof getSuperAdminStudentCourseProgress>>;
 try{report=await getSuperAdminStudentCourseProgress(context,{offeringId});}
 catch(error){
  // Do not expose SQL, stack traces or another tenant's identifiers in the error surface.
  const detail=error instanceof Error&&error.name==="AuthorizationError"
    ?"The selected course offering is not accessible in your current college scope."
    :error instanceof Error&&error.name==="ZodError"
      ?"The selected course offering ID is invalid."
      :"The progress service could not return this course and class report.";
  return <div className="space-y-6">
  <PageHeader title="Student Course Progress"/>
  <ErrorState title="Could not load course progress" description={detail+" Check your selected college, class and taught course, then retry."} action={
    <div className="flex flex-wrap gap-3">
      <Link href={"/admin/course-progress/students?offeringId="+encodeURIComponent(offeringId)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry course progress</Link>
      {back}
    </div>
  }/>
 </div>;}
 const measuredCounts=report.rows.map(row=>row.totalVideos+row.totalAssignments+row.totalQuizzes);
 const lowestMeasured=measuredCounts.length?Math.min(...measuredCounts):0;
 const highestMeasured=measuredCounts.length?Math.max(...measuredCounts):0;
 const average=report.rows.map(row=>studentCourseCompletion(row))
  .filter((n):n is number=>n!==null);
 const mean=average.length?Math.round(average.reduce((a,n)=>a+n,0)/average.length):null;
 const allRows=[...report.rows].sort((a,b)=>{
   const ap=studentCourseCompletion(a),bp=studentCourseCompletion(b);
   if(ap===null&&bp!==null)return 1;
   if(bp===null&&ap!==null)return -1;
   const compared=(ap??0)-(bp??0);
   return (sort==="percent-desc"?-compared:compared) ||
     a.studentName.localeCompare(b.studentName) || a.membershipId.localeCompare(b.membershipId);
 });
 const totalPages=Math.max(1,Math.ceil(allRows.length/pageSize));
 const page=Math.min(requestedPage,totalPages);
 const shownRows=allRows.slice((page-1)*pageSize,page*pageSize);
 const reportHref=(nextPage:number,nextSize=pageSize,nextSort=sort)=>
   "/admin/course-progress/students?"+new URLSearchParams({
     offeringId,page:String(nextPage),pageSize:String(nextSize),sort:nextSort,
   }).toString();
 const hasMeasuredWork=report.rows.some(row=>row.totalVideos+row.totalAssignments+row.totalQuizzes>0);
 return <div className="min-w-0 space-y-[var(--lms-space-6)]">
  <PageHeader title="Student Course Progress"
    description="Persisted video completion, assignment submissions and quiz attempts for active enrolled students in the selected course offering."
    actions={back}
  />
  <dl className="grid min-w-0 grid-cols-2 gap-[var(--lms-space-4)] border-y border-[var(--lms-canvas-border)] py-[var(--lms-space-4)] md:grid-cols-4">
   <div className="min-w-0 border-b border-[var(--lms-canvas-border)] px-[var(--lms-space-2)] pb-[var(--lms-space-3)] md:border-b-0 md:border-r md:pr-[var(--lms-space-4)] md:last:border-r-0"><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Average completion</dt><dd className="text-[24px] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]">{mean===null?"Not measured":mean+"%"}</dd></div>
   <div className="min-w-0 border-b border-[var(--lms-canvas-border)] px-[var(--lms-space-2)] pb-[var(--lms-space-3)] md:border-b-0 md:border-r md:pr-[var(--lms-space-4)] md:last:border-r-0"><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Students</dt><dd className="text-[24px] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]">{report.rows.length}</dd></div>
   <div className="min-w-0 border-b border-[var(--lms-canvas-border)] px-[var(--lms-space-2)] pb-[var(--lms-space-3)] md:border-b-0 md:border-r md:pr-[var(--lms-space-4)] md:last:border-r-0"><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Not started</dt><dd className="text-[24px] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]">{report.rows.filter(row=>row.videos+row.assignments+row.quizzes===0).length}</dd></div>
   <div className="min-w-0 border-b border-[var(--lms-canvas-border)] px-[var(--lms-space-2)] pb-[var(--lms-space-3)] md:border-b-0 md:border-r md:pr-[var(--lms-space-4)] md:last:border-r-0"><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Items measured</dt><dd className="text-[24px] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]">{lowestMeasured===highestMeasured?
     highestMeasured:lowestMeasured+"–"+highestMeasured+" per learner"}</dd></div>
  </dl>
  <p className="text-sm text-body">Video completions, submitted assignments and attempted quizzes are counted from persisted learner records. No completion percentage is inferred when there are no measurable items.</p>
  {!report.rows.length?<Alert tone="info" role="status">This class has no active learners.</Alert>:
    !hasMeasuredWork?<Alert tone="info" role="status">This course has no videos, assignments or quizzes for this class yet, so there is nothing measurable to report.</Alert>:null}
  {report.truncated?<Alert tone="warning" role="alert">Only the first 500 active students were returned by the progress service. Statistics and percentage sorting are based on that sample, not the full class. Export may also be limited.</Alert>:null}
  <div className="flex min-w-0 flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
    <p className="text-sm text-body">Showing {allRows.length===0?0:(page-1)*pageSize+1}–{Math.min(page*pageSize,allRows.length)} of {allRows.length}{report.truncated?" returned":""} students</p>
    <form method="get" action="/admin/course-progress/students" className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="offeringId" value={offeringId}/>
      <input type="hidden" name="sort" value={sort}/>
      <label className="grid gap-1 text-sm font-semibold">Rows per page
        <Select name="pageSize" defaultValue={String(pageSize)} className="min-h-11 md:min-h-9">
          {[20,50,100].map(value=><option key={value} value={value}>{value}</option>)}
        </Select>
      </label>
      <Button variant="secondary" type="submit" className="min-h-11 md:min-h-9">Apply</Button>
    </form>
  </div>
  <DataTable<(typeof report.rows)[number]>
    caption="Student Course Progress"
    rows={shownRows}
    getRowKey={row=>row.membershipId}
    columns={[
      {key:"student",header:"Student",mobilePriority:"primary",cell:row=>row.studentName},
      {key:"videos",header:"Videos",mobilePriority:"secondary",cell:row=>row.videos+"/"+row.totalVideos},
      {key:"assignments",header:"Assignments",mobilePriority:"secondary",cell:row=>row.assignments+"/"+row.totalAssignments},
      {key:"quizzes",header:"Quizzes",mobilePriority:"secondary",cell:row=>row.quizzes+"/"+row.totalQuizzes},
      {key:"progress",header:<Link href={reportHref(1,pageSize,sort==="percent-asc"?"percent-desc":"percent-asc")}
        className="inline-flex min-h-11 items-center text-primary-text underline underline-offset-2 md:min-h-9">
        Progress {sort==="percent-asc"?"↑":"↓"}
      </Link>,sortDirection:sort==="percent-asc"?"ascending":"descending",mobileLabel:"Progress",mobilePriority:"secondary",cell:row=>{
        const completed=studentCourseCompletion(row);
        return completed===null?"Not measured":completed+"%";
      }},
    ]}
    empty={<EmptyState title="No enrolled students" description="No students are enrolled in this course offering."/>}
  />
  <nav aria-label="Student course progress pages" className="flex flex-wrap items-center justify-between gap-3">
    {page>1?<Link href={reportHref(page-1)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">← Previous</Link>:<span/>}
    <span className="text-sm text-body">Page {page} of {totalPages}</span>
    {page<totalPages?<Link href={reportHref(page+1)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Next →</Link>:<span/>}
  </nav>
  <div className="flex min-w-0 justify-start print:hidden">
    <a href={"/api/admin/course-progress/students/export?offeringId="+encodeURIComponent(report.offeringId)}
   className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-white)] px-[var(--lms-space-4)] text-[var(--lms-font-base)] font-[650] text-[var(--lms-body-text)] transition-colors hover:border-[var(--lms-button-primary)] hover:bg-[var(--lms-button-primary)] hover:text-[var(--lms-on-primary)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] motion-reduce:transition-none md:min-h-9">Export CSV</a>
  </div>
 </div>;
}
