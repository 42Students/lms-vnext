import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getFacultyAssignmentReport } from "@/modules/courses/faculty-assessment-report-service";
import { facultyReportCsvHref } from "@/modules/courses/faculty-report-csv-request";
import {
  facultySubmissionListHref,facultySubmissionListPage,
  facultySubmissionListQuerySchema,facultySubmissionReportSearchSchema,selectFacultyAssignmentSubmissions,
} from "@/modules/courses/faculty-assignment-submissions-model";

type Params={deliveryId?:string|string[];filter?:string|string[];page?:string|string[]};

export default async function FacultyAssignmentSubmissionsPage({
  params,searchParams,
}:{params:Promise<{contentId:string}>;searchParams:Promise<Params>}) {
  const [{contentId},raw]=await Promise.all([params,searchParams]);
  const search=facultySubmissionReportSearchSchema.safeParse(raw);
  const parsed=facultySubmissionListQuerySchema.safeParse({
    assignmentId:contentId,...(search.success?search.data:{deliveryId:undefined}),
  });
  if(!parsed.success)return <section role="alert" className="space-y-3">
    <h1 className="text-xl font-semibold">Invalid Section submission filters</h1>
    <Link href="/teacher/allAssignments" className="text-primary-text underline">
      Back to All Assignments
    </Link>
  </section>;
  const context=await getCurrentRequestContext();
  const query=parsed.data;
  const report=await getFacultyAssignmentReport(context,query.assignmentId,query.deliveryId);
  const filtered=selectFacultyAssignmentSubmissions(
    report.submissions,query.filter,report.assignment.dueAt,
  );
  const data=facultySubmissionListPage(filtered,query.page);
  const csvHref=facultyReportCsvHref({
    kind:"assignment",assessmentId:report.assignment.id,
    deliveryId:report.assignment.deliveryId,filter:query.filter,
  });
  return <div className="space-y-6">
    <PageHeader eyebrow="Faculty · Assignment Report" title="Learner submissions"
      description={report.assignment.title+" · "+report.assignment.courseName+" · "+report.assignment.sectionName}
      actions={<Link href={"/teacher/report/assignment/"+
        encodeURIComponent(report.assignment.id)+"?deliveryId="+
        encodeURIComponent(report.assignment.deliveryId)}
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
        Full Section report
      </Link>} />
    <nav aria-label="Submission grading filters" className="flex flex-wrap gap-2">
      {(["ALL","GRADED","UNGRADED","LATE"] as const).map(filter=>
        <Link key={filter} href={facultySubmissionListHref({...query,filter,page:1})}
          aria-current={query.filter===filter?"page":undefined}
          className={query.filter===filter
            ? "rounded-full border border-primary bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
            : "rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-body"}>
          {filter==="ALL"?"All":filter==="GRADED"?"Graded":filter==="UNGRADED"?"Ungraded":"Late"}
        </Link>)}
    </nav>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-body">
        {data.total} matching persisted submission{data.total===1?"":"s"} in this teaching Section
      </p>
      <Link href={csvHref} className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline">
        Export {query.filter==="ALL"?"all":query.filter.toLowerCase()} CSV
      </Link>
    </div>
    {data.items.length===0?<EmptyState title="No matching submissions"
      description="No persisted submissions match this grading/timing filter. Missing responses have no grade and appear only in the full Section report." />
      :<ol className="grid gap-3">
        {data.items.map(row=>{
          const late=report.assignment.dueAt!==null&&
            row.submittedAt.getTime()>report.assignment.dueAt.getTime();
          return <li key={row.id} className="rounded-xl border border-border bg-surface p-4">
            <h2 className="font-semibold text-foreground">
              {row.learnerDisplayName||row.learnerEmail||"Learner"}
            </h2>
            <p className="mt-1 text-sm text-body">
              {row.gradingStatus==="GRADED"?"Graded":"Not graded"} · {late?"Late":"On time / no due date"}
            </p>
            <p className="mt-1 text-sm text-body">
              Recorded score: {row.gradingStatus==="GRADED"&&row.pointsAwarded!==null
                ? row.pointsAwarded+"/"+report.assignment.maxPoints:"Not graded"}
              {" · "}{row.gradePublished?"Published":"Private"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted {new Intl.DateTimeFormat("en-IN",{
                dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
              }).format(row.submittedAt)} IST
            </p>
          </li>;
        })}
      </ol>}
    <nav aria-label="Submission pages" className="flex justify-between gap-3">
      <span className="text-sm text-muted-foreground">
        Page {data.page} of {data.totalPages}
      </span>
      <div className="flex gap-3">
        {data.page>1?<Link href={facultySubmissionListHref({...query,page:data.page-1})}
          className="text-sm font-semibold text-primary-text">Previous</Link>:null}
        {data.page<data.totalPages?<Link href={facultySubmissionListHref({...query,page:data.page+1})}
          className="text-sm font-semibold text-primary-text">Next</Link>:null}
      </div>
    </nav>
    <p className="text-xs leading-5 text-muted-foreground">
      All rows and CSV exports are recalculated with the current persisted Faculty Section scope.
      Draft private grades are never described as learner-visible. No grading mutation occurs here.
    </p>
  </div>;
}
