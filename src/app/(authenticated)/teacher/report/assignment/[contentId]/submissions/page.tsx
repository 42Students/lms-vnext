import { notFound } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";
import { Disclosure } from "@/components/ui/disclosure";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Tabs} from "@/components/ui/tabs";
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
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatNumberIN } from "@/lib/safe-format";
import { istDateTimeFormatter } from "@/lib/format-date";

import { ROLE } from "@/modules/identity/roles";
type Params={deliveryId?:string|string[];filter?:string|string[];page?:string|string[];order?:string|string[];q?:string|string[];publication?:string|string[]};

export default async function FacultyAssignmentSubmissionsPage({
  params,searchParams,
}:{params:Promise<{contentId:string}>;searchParams:Promise<Params>}) {
  const context=await getCurrentRequestContext();
  if(context.user.platformStatus!=="ACTIVE" ||
    context.membership?.status!=="ACTIVE" ||
    !context.membership.roles.includes(ROLE.FACULTY))notFound();
  const [{contentId},raw]=await Promise.all([params,searchParams]);
  const search=facultySubmissionReportSearchSchema.safeParse(raw);
  const parsed=facultySubmissionReportPageQuerySchema.safeParse({
    assignmentId:contentId,...(search.success?search.data:{deliveryId:undefined}),
  });
  if(!parsed.success)return <section role="alert" className="space-y-3">
    <PageHeader title="Assignment submissions" description="Invalid Section submission filters" />
    <p className="text-sm text-body">These filters could not be applied. No learner submission records were loaded.</p>
    <TextLink href={"/teacher/report/assignment/"+encodeURIComponent(contentId)}
      className="inline-flex min-h-11 items-center">Open assignment report</TextLink>
    <TextLink href="/teacher/allAssignments" className="inline-flex min-h-11 items-center">
      Back to All Assignments
    </TextLink>
  </section>;
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
      description={[report.assignment.courseName, report.assignment.sectionName].join(" · ")}
      actions={<ButtonLink variant="secondary" href={"/teacher/report/assignment/"+
        encodeURIComponent(report.assignment.id)+"?deliveryId="+
        encodeURIComponent(report.assignment.deliveryId)}
        className="w-full md:w-auto">
        Full Section report
      </ButtonLink>} />
    <form method="get" className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
      <Input type="hidden" name="deliveryId" value={query.deliveryId}/>
      {query.filter!=="ALL"?<Input type="hidden" name="filter" value={query.filter}/>:null}
      {query.order!=="NEWEST"?<Input type="hidden" name="order" value={query.order}/>:null}
      {query.publication!=="ALL"?<Input type="hidden" name="publication" value={query.publication}/>:null}
      <Label stack className="min-w-0 w-full">
        Find learner submissions
        <Input type="search" name="q" defaultValue={query.q} maxLength={120} placeholder="Learner name"
          className="min-h-11 md:min-h-[var(--lms-control-height)] w-full max-md:text-[16px]"/>
      </Label>
      <Button type="submit" variant="primary" className="w-full md:w-auto">Search</Button>
      <TextLink href={facultySubmissionListHref({...query,q:"",page:1})}
        className="inline-flex min-h-11 w-full items-center justify-center text-sm md:w-auto md:min-h-[var(--lms-control-height)]">Clear search</TextLink>
    </form>
    <Tabs ariaLabel="Submission grading filters" value={query.filter} renderPanel={false}
      items={(["ALL","GRADED","UNGRADED","LATE"] as const).map(filter=>({
       value:filter,label:filter==="ALL"?"All":filter==="GRADED"?"Graded":filter==="UNGRADED"?"Ungraded":"Late",
       href:facultySubmissionListHref({...query,filter,page:1}),
      }))}/>
    <Disclosure title="Grade visibility and order" className="min-w-0 border-b border-[var(--lms-canvas-border)]" contentClassName="min-w-0 space-y-3 px-2 py-3">
    <Tabs ariaLabel="Grade publication visibility" value={query.publication} renderPanel={false}
      items={(["ALL","PUBLISHED","PRIVATE"] as const).map(mode=>({
       value:mode,label:mode==="ALL"?"All grades":mode==="PUBLISHED"?"Published grades":"Private grades",
       href:facultySubmissionListHref({...query,publication:mode,page:1}),
      }))}/>
    <Tabs ariaLabel="Submission date order" value={query.order} renderPanel={false}
      items={[{value:"NEWEST",label:"Newest first",href:facultySubmissionListHref({...query,order:"NEWEST",page:1})},
       {value:"OLDEST",label:"Oldest first",href:facultySubmissionListHref({...query,order:"OLDEST",page:1})}]}/>
    </Disclosure>
    <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-body leading-[22px]">
        {formatNumberIN(data.total)} matching persisted submission{data.total===1?"":"s"} in this teaching Section
      </p>
      <div className="min-w-0 space-y-1">
        <ButtonLink variant="secondary" href={csvHref} className="w-full md:w-auto">
          Export {query.filter==="ALL"?"all":query.filter.toLowerCase()} CSV
        </ButtonLink>
        <p className="max-w-prose text-xs leading-5 text-muted-foreground">{facultySubmissionCsvScopeNote(query)}</p>
      </div>
    </div>
    {data.items.length===0?<EmptyState title={empty.title}
      description={empty.description}
      action={<TextLink href={facultySubmissionListHref({...query,filter:"ALL",q:"",publication:"ALL",order:"NEWEST",page:1})}
        className="inline-flex min-h-11 items-center">Clear submission filters</TextLink>} />
      :<ol className="min-w-0 border-y border-[var(--lms-canvas-border)] divide-y divide-[var(--lms-canvas-border)]">
        {data.items.map(row=>{
          const late=report.assignment.dueAt!==null&&
            row.submittedAt.getTime()>report.assignment.dueAt.getTime();
          return <li key={row.id} className="min-w-0 bg-transparent py-4">
            <Heading level={2} size="base" className="break-words leading-6 text-[var(--lms-heading)]">
              {row.learnerDisplayName||row.learnerEmail||"Learner"}
            </Heading>
            <p className="mt-1 text-sm text-body leading-[22px]">
              {row.gradingStatus==="GRADED"?"Graded":"Pending"} · {late?"Late":"On time / no due date"}
            </p>
            <p className="mt-1 text-sm text-body leading-[22px]">
              Recorded score: {row.gradingStatus==="GRADED"&&row.pointsAwarded!==null
                ? row.pointsAwarded+"/"+report.assignment.maxPoints:"Grade pending"}
              {" · "}{row.gradePublished?"Published":"Private"}
            </p>
            {row.submissionType==="FILE"?<FacultySubmissionFileReview submissionId={row.id}/>:null}
            <p className="mt-1 text-xs text-muted-foreground leading-5">
              Submitted {istDateTimeFormatter.format(row.submittedAt)} IST
            </p>
          </li>;
        })}
      </ol>}
    {data.totalPages > 1 ? <Pagination label="Submission pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>facultySubmissionListHref({...query,page})} /> : null}
    <p className="max-w-prose text-xs leading-5 text-muted-foreground">
      All rows and CSV exports are recalculated with the current persisted Faculty Section scope.
      Draft private grades are never described as learner-visible. No grading mutation occurs here.
    </p>
  </div>;
}
