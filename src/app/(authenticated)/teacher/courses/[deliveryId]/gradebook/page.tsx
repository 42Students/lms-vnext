import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {facultyGradebookParamsSchema} from "@/modules/courses/faculty-gradebook-model";
import {getFacultyPublishedGradebook} from "@/modules/courses/faculty-gradebook-service";

export default async function FacultyGradebookPage({
  params,
}:{params:Promise<{deliveryId:string}>}){
  const raw=await params;
  const parsed=facultyGradebookParamsSchema.safeParse(raw);
  if(!parsed.success) return <section role="alert">
    <h1>Invalid Section identifier</h1>
    <Link href="/teacher/courses" className="text-primary-text underline">Courses</Link>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getFacultyPublishedGradebook(context,parsed.data);
  const csv="/api/courses/faculty/gradebook/"+encodeURIComponent(parsed.data.deliveryId)+"/csv";
  return <div className="space-y-6">
    <PageHeader eyebrow="Faculty · Section" title="Published gradebook"
      description={data.delivery.courseName+" · "+data.delivery.sectionName}
      actions={<Link href={csv}
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
        Download safe CSV
      </Link>} />
    <p className="text-sm text-body">
      {data.rosterSize} current eligible learners · {data.publishedAssessments}
      {" "}assessments with published result records
    </p>
    {data.rows.length===0?<EmptyState title="No current enrolled learners"
      description="The authorized Section roster is empty. No scores were inferred."/>
    :<div className="grid gap-3">
      {data.rows.map(row=><article key={row.membershipId}
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
          className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
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
    <p className="text-xs text-muted-foreground">
      This read-only gradebook includes only actually published learner grades.
      Private, missing and ungraded results never become zero scores; percentages
      describe recorded published points only, not weighted course outcomes.
    </p>
  </div>;
}
