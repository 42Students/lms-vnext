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
  const view=facultyGradebookViewQuerySchema.safeParse(knownKeys?rawSearch:{invalid:true});
  if(!parsed.success||!view.success)return <section role="alert" className="space-y-3 p-6">
    <h1 className="text-xl font-semibold text-foreground">Invalid gradebook link or filters</h1>
    <Link href={parsed.success?
      facultyGradebookViewHref(parsed.data.deliveryId,{search:"",page:1}):
      "/teacher/courses"} className="text-primary-text underline">
      Return to the gradebook
    </Link>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getFacultyPublishedGradebook(context,parsed.data);
  const filtered=paginateFacultyGradebookRows(data.rows,view.data);
  const base={...view.data};
  const csv="/api/courses/faculty/gradebook/"+encodeURIComponent(parsed.data.deliveryId)+"/csv";
  return <div className="space-y-6">
    <PageHeader title="Published gradebook"
      description={data.delivery.courseName+" · "+data.delivery.sectionName}
      actions={<Link href={csv}
        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
        Download full Section CSV
      </Link>} />
    <p className="text-sm text-body">
      {data.rosterSize} current eligible learners · {data.publishedAssessments}
      {" "}assessments with published result records
    </p>
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      <label className="grid min-w-56 flex-1 gap-1 text-sm font-semibold text-foreground">
        Find learner
        <input type="search" name="search" defaultValue={view.data.search}
          maxLength={120} placeholder="Name, roll number or email"
          className="min-h-11 rounded-md border border-border bg-background px-3 text-foreground" />
      </label>
      <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
        Search
      </button>
      <Link href={facultyGradebookViewHref(parsed.data.deliveryId,{search:"",page:1})}
        className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-primary-text">
        Clear
      </Link>
    </form>
    <p aria-live="polite" className="text-sm text-muted-foreground">
      Showing {filtered.matching} of {filtered.total} authorized learners · Page {filtered.page} of {filtered.totalPages}.
      The CSV contains the full authorized Section, not only visible search matches.
    </p>
    {data.rows.length===0?<EmptyState title="No current enrolled learners"
      description="The authorized Section roster is empty. No scores were inferred."/>
    :filtered.items.length===0?<EmptyState title="No matching learners"
      description="Try another name, roll number or email. Published grades were not inferred."/>
    :<div className="grid gap-3">
      {filtered.items.map(row=><article key={row.membershipId}
        className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-semibold text-foreground">
          {row.displayName||row.email||"Unnamed learner"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {row.rollNumber?"Roll "+row.rollNumber+" · ":""}
          {row.email??"No email on record"}
        </p>
        <Link href={"/teacher/courses/"+encodeURIComponent(parsed.data.deliveryId)+
          "/gradebook/"+encodeURIComponent(row.membershipId)}
          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
          View published score breakdown →
        </Link>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <p className="text-sm text-body">Published scores: {row.gradedCount}/{row.publishedAssessments}</p>
          <p className="text-sm text-body">Recorded points: {
            row.earned===null?"Unknown":row.earned+" / "+row.possible
          }</p>
          <p className="text-sm text-body">
            {row.percent===null?"Score unknown":"Recorded score "+row.percent+"%"}
          </p>
        </div>
        {row.hasUnknown&&<p className="mt-2 text-xs text-muted-foreground">
          Incomplete: one or more recorded assessments have no published grade.
          Recorded points do not represent a final course grade.
        </p>}
      </article>)}
    </div>}
    {filtered.totalPages>1&&<nav aria-label="Gradebook pages"
      className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">
        Page {filtered.page} of {filtered.totalPages}
      </span>
      <div className="flex gap-3">
        {filtered.page>1&&<Link href={facultyGradebookViewHref(parsed.data.deliveryId,{
          ...base,page:filtered.page-1})} className="text-sm font-semibold text-primary-text">
          Previous
        </Link>}
        {filtered.page<filtered.totalPages&&<Link href={facultyGradebookViewHref(parsed.data.deliveryId,{
          ...base,page:filtered.page+1})} className="text-sm font-semibold text-primary-text">
          Next
        </Link>}
      </div>
    </nav>}
    <p className="text-xs text-muted-foreground">
      This read-only gradebook includes only actually published learner grades.
      Private, missing and ungraded results never become zero scores; percentages
      describe recorded published points only, not weighted course outcomes.
    </p>
  </div>;
}
