import { Pagination } from "@/components/ui/pagination";
import { Disclosure } from "@/components/ui/disclosure";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {
  facultyGradebookParamsSchema,
  facultyGradebookViewQuerySchema,
  paginateFacultyGradebookRows,
  facultyGradebookViewHref,
} from "@/modules/courses/faculty-gradebook-model";
import {getFacultyPublishedGradebook} from "@/modules/courses/faculty-gradebook-service";
import {CoursesServiceError} from "@/modules/courses/errors";

type SearchParams={search?:string|string[];page?:string|string[]};

export default async function FacultyGradebookPage({
  params,searchParams,
}:{
  params:Promise<{deliveryId:string}>;
  searchParams:Promise<SearchParams>;
}){
  const [raw,rawSearch]=await Promise.all([params,searchParams]);
  const parsed=facultyGradebookParamsSchema.safeParse(raw);
  // Avoid accepting duplicate query fields or arbitrary tenant/role selectors.
  const knownKeys=Object.keys(rawSearch).every(key=>key==="search"||key==="page");
  const noRepeatedKeys=Object.values(rawSearch).every(value=>!Array.isArray(value));
  const view=facultyGradebookViewQuerySchema.safeParse(
    knownKeys&&noRepeatedKeys?rawSearch:{invalid:true},
  );
  if(!parsed.success||!view.success)return <section role="alert" className="min-w-0 space-y-3">
    <PageHeader title="Published gradebook" description="Invalid gradebook link or filters" />
    <Link href={parsed.success?
      facultyGradebookViewHref(parsed.data.deliveryId,{search:"",page:1}):
      "/teacher/courses"} className="text-primary-text underline inline-flex min-h-11 min-[768px]:min-h-[var(--lms-control-height)] items-center focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
      Return to the gradebook
    </Link>
  </section>;
  const context=await getCurrentRequestContext();
  let data:Awaited<ReturnType<typeof getFacultyPublishedGradebook>>;
  try {
    data=await getFacultyPublishedGradebook(context,parsed.data);
  } catch(error) {
    if(error instanceof CoursesServiceError &&
       error.code==="FACULTY_GRADEBOOK_TOO_MANY_ASSESSMENTS") {
      return <section role="alert" className="min-w-0 space-y-3">
        <PageHeader title="Published gradebook" description="Gradebook report limit" />
        <p className="text-sm text-body leading-[22px]">
          This section has more than 100 published assessments. Contact your college
          administrator to request a gradebook report. No grades have been changed.
        </p>
        <Link href={"/teacher/courses/"+encodeURIComponent(parsed.data.deliveryId)}
          className="inline-flex min-h-11 min-[768px]:min-h-[var(--lms-control-height)] items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
          Return to your course
        </Link>
      </section>;
    }
    throw error;
  }
  const filtered=paginateFacultyGradebookRows(data.rows,view.data);
  const base={...view.data};
  const csv="/api/courses/faculty/gradebook/"+encodeURIComponent(parsed.data.deliveryId)+"/csv";
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Published gradebook"
      actions={<Link href={csv}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-[var(--lms-control-height)]">
        Download full section CSV
      </Link>} />
    <p className="text-sm text-body leading-[22px]">
      {data.rosterSize} current eligible learners · {data.publishedAssessments}
      {" "}assessments with published result records
    </p>
    <p role="note" className="text-sm text-body leading-[22px]">
      Missing or unmarked work is unknown, not Present, Absent, failed or zero.
      This published gradebook reports only confirmed published results;
      attendance is recorded separately. Legacy attendance estimated Present
      as the roster minus Absent, which counted unmarked learners as present.
    </p>
    <form role="search" aria-label="gradebook filters" method="get" className="grid min-w-0 gap-[8px] border-b border-border pb-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
      <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        Find learner
        <Input type="search" name="search" defaultValue={view.data.search}
          maxLength={120} placeholder="Name, roll number or email"
          className="min-h-11 md:min-h-[var(--lms-control-height)]" />
      </label>
      <Button type="submit" variant="primary" className="w-full sm:w-auto">
        Search
      </Button>
      <Link href={facultyGradebookViewHref(parsed.data.deliveryId,{search:"",page:1})}
        className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
        Clear
      </Link>
    </form>
    <p aria-live="polite" className="text-sm text-muted-foreground leading-[22px]">
      Showing {filtered.matching} of {filtered.total} authorized learners · Page {filtered.page} of {filtered.totalPages}.
    </p>
    {data.rows.length===0?<EmptyState title="No current enrolled learners"
      description="The authorized section roster is empty. No scores were inferred."/>
    :filtered.items.length===0?<EmptyState title="No matching learners"
      description="Try another name, roll number or email. Published grades were not inferred."/>
    :<div className="min-w-0 divide-y divide-border border-y border-border">
      {filtered.items.map(row=><article key={row.membershipId}
        className="min-w-0 py-4">
        <h2 className="break-words text-base font-semibold leading-6 text-[var(--lms-heading)]">
          {row.displayName||row.email||"Unnamed learner"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground leading-5">
          {row.rollNumber?"Roll "+row.rollNumber+" · ":""}
          {row.email??"No email on record"}
        </p>
        <Link href={"/teacher/courses/"+encodeURIComponent(parsed.data.deliveryId)+
          "/gradebook/"+encodeURIComponent(row.membershipId)}
          className="mt-2 inline-flex min-h-11 min-[768px]:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
          View published score breakdown →
        </Link>
        <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 md:grid-cols-3">
          <p className="text-sm text-body leading-[22px]">Published scores: {row.gradedCount}/{row.publishedAssessments}</p>
          <p className="text-sm text-body leading-[22px]">Recorded points: {
            row.earned===null?"Unknown":row.earned+" / "+row.possible
          }</p>
          <p className="text-sm text-body leading-[22px]">
            {row.percent===null?"Score unknown":"Recorded score "+row.percent+"%"}
          </p>
        </div>
        {row.hasUnknown&&<p className="mt-2 text-xs text-muted-foreground leading-5">
          Incomplete: one or more recorded assessments have no published grade.
          Recorded points do not represent a final course grade.
        </p>}
      </article>)}
    </div>}
    {filtered.totalPages>1&&<nav aria-label="Gradebook pages"
      className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">
        Page {filtered.page} of {filtered.totalPages}
      </span>
      <div className="flex gap-3">
        {filtered.page>1&&<Link href={facultyGradebookViewHref(parsed.data.deliveryId,{
          ...base,page:filtered.page-1})} className="text-sm font-semibold text-primary-text inline-flex min-h-11 min-[768px]:min-h-[var(--lms-control-height)] items-center focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
          Previous
        </Link>}
        {filtered.page<filtered.totalPages&&<Link href={facultyGradebookViewHref(parsed.data.deliveryId,{
          ...base,page:filtered.page+1})} className="text-sm font-semibold text-primary-text inline-flex min-h-11 min-[768px]:min-h-[var(--lms-control-height)] items-center focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
          Next
        </Link>}
      </div>
    </nav>}
    <Disclosure title="About published grades and CSV scope" className="border-t border-border">
      <p className="max-w-3xl px-2 pb-2 text-xs leading-5 text-muted-foreground">
        The CSV contains the full authorized Section, not only visible search matches.
        This read-only gradebook includes only actually published learner grades.
        Private, missing and ungraded results never become zero scores; percentages
        describe recorded published points only, not weighted course outcomes.
      </p>
    </Disclosure>
  </div>;
}
