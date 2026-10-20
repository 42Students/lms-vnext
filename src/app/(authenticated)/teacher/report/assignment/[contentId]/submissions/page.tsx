import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Tabs} from "@/components/ui/tabs";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { FacultySubmissionFileReview } from "@/components/courses/faculty-submission-file-review";
import { getFacultyAssignmentReport } from "@/modules/courses/faculty-assessment-report-service";
import { facultyReportCsvHref } from "@/modules/courses/faculty-report-csv-request";
import {
  facultySubmissionListHref,facultySubmissionListPage,facultySortSubmissionReportRows,facultySearchSubmissionReportRows,facultyFilterSubmissionPublication,facultySubmissionReportEmptyState,facultySubmissionCsvScopeNote,
  facultySubmissionReportPageQuerySchema,facultySubmissionReportSearchSchema,selectFacultyAssignmentSubmissions,
} from "@/modules/courses/faculty-assignment-submissions-model";

type Params={deliveryId?:string|string[];filter?:string|string[];page?:string|string[];order?:string|string[];q?:string|string[];publication?:string|string[]};

export default async function FacultyAssignmentSubmissionsPage({
  params,searchParams,
}:{params:Promise<{contentId:string}>;searchParams:Promise<Params>}) {
  const [{contentId},raw]=await Promise.all([params,searchParams]);
  const search=facultySubmissionReportSearchSchema.safeParse(raw);
  const parsed=facultySubmissionReportPageQuerySchema.safeParse({
    assignmentId:contentId,...(search.success?search.data:{deliveryId:undefined}),
  });
  if(!parsed.success)return <section role="alert" className="space-y-3">
    <PageHeader title={"Invalid Section submission filters"} />
    <Link href="/teacher/allAssignments" className="text-primary-text underline inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      Back to All Assignments
    </Link>
  </section>;
  const context=await getCurrentRequestContext();
  const query=parsed.data;
  const report=await getFacultyAssignmentReport(context,query.assignmentId,query.deliveryId);
  const filtered=selectFacultyAssignmentSubmissions(
    report.submissions,query.filter,report.assignment.dueAt,
  );
  const data=facultySubmissionListPage(facultySortSubmissionReportRows(facultySearchSubmissionReportRows(facultyFilterSubmissionPublication(filtered,query.publication),query.q),query.order),query.page);
  const empty=facultySubmissionReportEmptyState(query,report.submissions.length);
  const csvHref=facultyReportCsvHref({
    kind:"assignment",assessmentId:report.assignment.id,
    deliveryId:report.assignment.deliveryId,filter:query.filter,
  });
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader title="Assignment submissions"
      actions={<Link href={"/teacher/report/assignment/"+
        encodeURIComponent(report.assignment.id)+"?deliveryId="+
        encodeURIComponent(report.assignment.deliveryId)}
        className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Full Section report
      </Link>} />
    <form method="get" className="flex flex-wrap items-end gap-3">
      <Input type="hidden" name="deliveryId" value={query.deliveryId}/>
      {query.filter!=="ALL"?<Input type="hidden" name="filter" value={query.filter}/>:null}
      {query.order!=="NEWEST"?<Input type="hidden" name="order" value={query.order}/>:null}
      {query.publication!=="ALL"?<Input type="hidden" name="publication" value={query.publication}/>:null}
      <label className="grid min-w-0 flex-1 basis-56 gap-1 text-[13px] font-semibold leading-4 text-body">
        Find learner submissions
        <Input type="search" name="q" defaultValue={query.q} maxLength={120} placeholder="Learner name"
          className="min-h-11 md:min-h-[var(--lms-control-height)] w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-body text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/>
      </label>
      <Button type="submit" variant="primary" className="min-h-11 md:min-h-9">Search</Button>
      <Link href={facultySubmissionListHref({...query,q:"",page:1})}
        className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear search</Link>
    </form>
    <Tabs ariaLabel="Submission grading filters" value={query.filter} renderPanel={false}
      items={(["ALL","GRADED","UNGRADED","LATE"] as const).map(filter=>({
       value:filter,label:filter==="ALL"?"All":filter==="GRADED"?"Graded":filter==="UNGRADED"?"Ungraded":"Late",
       href:facultySubmissionListHref({...query,filter,page:1}),
      }))}/>
    <Tabs ariaLabel="Grade publication visibility" value={query.publication} renderPanel={false}
      items={(["ALL","PUBLISHED","PRIVATE"] as const).map(mode=>({
       value:mode,label:mode==="ALL"?"All grades":mode==="PUBLISHED"?"Published grades":"Private grades",
       href:facultySubmissionListHref({...query,publication:mode,page:1}),
      }))}/>
    <Tabs ariaLabel="Submission date order" value={query.order} renderPanel={false}
      items={[{value:"NEWEST",label:"Newest first",href:facultySubmissionListHref({...query,order:"NEWEST",page:1})},
       {value:"OLDEST",label:"Oldest first",href:facultySubmissionListHref({...query,order:"OLDEST",page:1})}]}/>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-body">
        {data.total} matching persisted submission{data.total===1?"":"s"} in this teaching Section
      </p>
      <div className="min-w-0 space-y-1">
        <Link href={csvHref} className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Export {query.filter==="ALL"?"all":query.filter.toLowerCase()} CSV
        </Link>
        <p className="max-w-prose text-xs leading-5 text-muted-foreground">{facultySubmissionCsvScopeNote(query)}</p>
      </div>
    </div>
    {data.items.length===0?<EmptyState title={empty.title}
      description={empty.description} />
      :<ol className="grid gap-3">
        {data.items.map(row=>{
          const late=report.assignment.dueAt!==null&&
            row.submittedAt.getTime()>report.assignment.dueAt.getTime();
          return <li key={row.id} className="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(38,186,199,0.25)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary motion-reduce:transition-none md:p-6">
            <h2 className="font-semibold text-foreground">
              {row.learnerDisplayName||row.learnerEmail||"Learner"}
            </h2>
            <p className="mt-1 text-sm text-body">
              {row.gradingStatus==="GRADED"?"Graded":"Pending"} · {late?"Late":"On time / no due date"}
            </p>
            <p className="mt-1 text-sm text-body">
              Recorded score: {row.gradingStatus==="GRADED"&&row.pointsAwarded!==null
                ? row.pointsAwarded+"/"+report.assignment.maxPoints:"Grade pending"}
              {" · "}{row.gradePublished?"Published":"Private"}
            </p>
            {row.submissionType==="FILE"?<FacultySubmissionFileReview submissionId={row.id}/>:null}
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted {new Intl.DateTimeFormat("en-IN",{
                dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
              }).format(row.submittedAt)} IST
            </p>
          </li>;
        })}
      </ol>}
    <nav aria-label="Submission pages" className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">
        Page {data.page} of {data.totalPages}
      </span>
      <div className="flex gap-3">
        {data.page>1?<Link href={facultySubmissionListHref({...query,page:data.page-1})}
          className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous</Link>:null}
        {data.page<data.totalPages?<Link href={facultySubmissionListHref({...query,page:data.page+1})}
          className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next</Link>:null}
      </div>
    </nav>
    <p className="text-xs leading-5 text-muted-foreground">
      All rows and CSV exports are recalculated with the current persisted Faculty Section scope.
      Draft private grades are never described as learner-visible. No grading mutation occurs here.
    </p>
  </div>;
}
