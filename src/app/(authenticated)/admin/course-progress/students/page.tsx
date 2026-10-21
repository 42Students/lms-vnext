import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getSuperAdminStudentCourseProgress} from "@/modules/courses/super-admin-student-course-progress";
import {studentCourseCompletion} from "@/modules/courses/super-admin-student-progress-model";
import {parseSuperAdminStudentProgressParams} from "@/modules/courses/super-admin-course-progress-query";
import {requirePermission} from "@/modules/permissions/policy";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {Alert} from "@/components/ui/alert";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {AdminProgressRetakeAction} from "@/components/courses/admin-progress-retake-action";

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
  <PageHeader title="Course Progress"/>
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
  <PageHeader title="Course Progress"/>
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
 const notStarted=report.rows.filter(row=>row.videos+row.assignments+row.quizzes===0).length;
 const firstMeasured=report.rows[0];
 const measuredVideos=firstMeasured?.totalVideos??0;
 const measuredAssignments=firstMeasured?.totalAssignments??0;
 const measuredQuizzes=firstMeasured?.totalQuizzes??0;
 const audienceVaries=report.rows.some(row=>row.totalVideos!==measuredVideos||
  row.totalAssignments!==measuredAssignments||row.totalQuizzes!==measuredQuizzes);
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
  <PageHeader title="Course Progress"
    description="See measured completion for a class and course, then focus on the students furthest behind."
    actions={back}
  />
  <Alert tone="info" role="status">
    <strong>Measured work only.</strong> Progress counts videos watched to the end, assignments submitted and quizzes attempted.
    Resources are not counted, because they are marked done by the student&apos;s own click.
  </Alert>
  <section aria-label="Selected course and actions" className="min-w-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--lms-heading)]">Selected class and course</p>
        <p className="mt-1 text-xs text-muted-foreground">This report uses the authorized course offering selected on the Course Progress page.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/course-progress" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link hover:bg-primary-subtle md:min-h-9">
          Change class or course
        </Link>
        <Link href={reportHref(page)} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link hover:bg-primary-subtle md:min-h-9">
          Refresh
        </Link>
        {report.rows.length?<a href={"/api/admin/course-progress/students/export?offeringId="+encodeURIComponent(report.offeringId)}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link hover:bg-primary-subtle md:min-h-9">Export CSV</a>:
          <span aria-disabled="true" title="No students available for export"
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-muted px-3 text-sm text-muted-foreground md:min-h-9">Export CSV</span>}
      </div>
    </div>
  </section>
  <dl aria-label="Course progress summary" className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
    <div className="min-w-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
      <dt className="text-xs font-semibold text-muted-foreground">Average completion</dt>
      <dd className="mt-2 text-[24px] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]">{mean===null?"Not measured":mean+"%"}</dd>
    </div>
    <div className="min-w-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
      <dt className="text-xs font-semibold text-muted-foreground">Students</dt>
      <dd className="mt-2 text-[24px] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]">{report.rows.length}</dd>
    </div>
    <div className="min-w-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
      <dt className="text-xs font-semibold text-muted-foreground">Not started</dt>
      <dd className={"mt-2 text-[24px] font-semibold leading-[1.3] tabular-nums "+(notStarted>0?"text-[#cf1322]":"text-[var(--lms-heading)]")}>{notStarted}</dd>
    </div>
    <div className="min-w-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
      <dt className="text-xs font-semibold text-muted-foreground">Items measured</dt>
      <dd className="mt-2 text-[24px] font-semibold leading-[1.3] tabular-nums text-[var(--lms-heading)]">
        {lowestMeasured===highestMeasured?highestMeasured:lowestMeasured+"–"+highestMeasured}
      </dd>
      <p className="mt-1 text-xs text-muted-foreground">
        {measuredVideos} videos · {measuredAssignments} assignments · {measuredQuizzes} quizzes
        {audienceVaries?" (counts shown for one learner; the eligible items vary by student)":""}
      </p>
    </div>
  </dl>
  {!report.rows.length?<Alert tone="info" role="status">No students in this section.</Alert>:
    !hasMeasuredWork?<Alert tone="warning" role="status">
      This course has no videos, assignments or quizzes to measure. No completion percentage is available until work is assigned.
    </Alert>:null}
  {report.truncated?<Alert tone="warning" role="alert">
    The progress service returned a limited sample of active students. Statistics and sorting here may not include the full class.
    Use the export endpoint for the authorized report.
  </Alert>:null}
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
  <section aria-label="Per student progress" className="min-w-0 space-y-3 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
    <h2 className="text-base font-semibold text-[var(--lms-heading)]">Per student</h2>
    <p className="text-sm text-muted-foreground">
      Sorted furthest-behind first, which is the order worth acting on. A student retaking the course counts only their current attempt.
    </p>
    {shownRows.length?<div role="region" aria-label="Per student progress table" tabIndex={0}
      className="min-w-0 overflow-x-auto rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
      <table className="w-full min-w-[860px] border-collapse text-left text-sm tabular-nums">
        <caption className="sr-only">Student course progress by current attempt. Scroll horizontally for all columns.</caption>
        <thead className="bg-[var(--lms-neutral-50)] text-xs font-semibold text-muted-foreground">
          <tr>
            <th scope="col" className="border-b border-border px-3 py-3">Student</th>
            <th scope="col" className="border-b border-border px-3 py-3">Roll number</th>
            <th scope="col" className="w-[90px] border-b border-border px-3 py-3">Videos</th>
            <th scope="col" className="w-[110px] border-b border-border px-3 py-3">Assignments</th>
            <th scope="col" className="w-[90px] border-b border-border px-3 py-3">Quizzes</th>
            <th scope="col" aria-sort={sort==="percent-asc"?"ascending":"descending"}
              className="w-[220px] border-b border-border px-3 py-3">
              <Link href={reportHref(1,pageSize,sort==="percent-asc"?"percent-desc":"percent-asc")}
                className="inline-flex min-h-11 items-center gap-1 font-semibold text-link underline underline-offset-2 md:min-h-9"
                aria-label={"Sort progress "+(sort==="percent-asc"?"descending":"ascending")}>
                Progress <span aria-hidden="true">{sort==="percent-asc"?"↑":"↓"}</span>
              </Link>
            </th>
            <th scope="col" className="border-b border-border px-3 py-3">Progress attempt</th>
          </tr>
        </thead>
        <tbody>{shownRows.map(row=>{
          const completed=studentCourseCompletion(row);
          const percent=completed===null?null:Math.max(0,Math.min(100,completed));
          const progressState=percent===0?"Not started":percent!==null&&percent<40?"Below 40%":"Progress recorded";
          const progressColour=percent===0?"bg-[#ff4d4f]":percent!==null&&percent<40?"bg-[#1890ff]":"bg-[#52c41a]";
          return <tr key={row.membershipId} className="hover:bg-[var(--lms-neutral-50)]">
            <th scope="row" className="border-b border-border px-3 py-3 text-left font-semibold text-[var(--lms-heading)]">
              {row.studentName?.trim()||"Student #"+row.membershipId.slice(0,8)}
            </th>
            <td className="border-b border-border px-3 py-3">{row.rollNumber?.trim()||"—"}</td>
            <td className="border-b border-border px-3 py-3">{row.videos}/{row.totalVideos}</td>
            <td className="border-b border-border px-3 py-3">{row.assignments}/{row.totalAssignments}</td>
            <td className="border-b border-border px-3 py-3">{row.quizzes}/{row.totalQuizzes}</td>
            <td className="border-b border-border px-3 py-3">
              {percent===null?<span className="text-muted-foreground">Not measured</span>:
                <div className="flex min-w-[190px] items-center gap-2">
                  <div role="progressbar" aria-label={"Course completion for "+(row.studentName||"student")}
                    aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}
                    aria-valuetext={percent+" percent; "+progressState}
                    className="h-2 w-[145px] overflow-hidden rounded-full bg-[var(--lms-neutral-100)]">
                    <div className={"h-full rounded-full "+progressColour}
                      style={{width:percent+"%"}}/>
                  </div>
                  <span className="min-w-10 text-right font-medium">{percent}%</span>
                  <span className="sr-only">{progressState}</span>
                </div>}
            </td>
            <td className="border-b border-border px-3 py-3">
              <AdminProgressRetakeAction offeringId={offeringId}
                membershipId={row.membershipId} learnerName={row.studentName}/>
            </td>
          </tr>;
        })}</tbody>
      </table>
    </div>:<div role="status" className="rounded-[var(--lms-control-radius)] bg-muted p-4 text-sm text-body">
      No students in this section.
    </div>}
  </section>
  <nav aria-label="Student course progress pages" className="flex flex-wrap items-center justify-between gap-3">
    {page>1?<Link href={reportHref(page-1)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">← Previous</Link>:<span/>}
    <span className="text-sm text-body">Page {page} of {totalPages}</span>
    {page<totalPages?<Link href={reportHref(page+1)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Next →</Link>:<span/>}
  </nav>

 </div>;
}
