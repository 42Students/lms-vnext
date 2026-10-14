import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {getMentorDeliveryVersion} from "@/modules/projects/mentor-delivery-version-service";
export default async function MentorDeliveryVersionPage({params}:{
  params:Promise<{projectId:string;submissionId:string}>;
}){
  const raw=await params;
  const data=await getMentorDeliveryVersion(await getCurrentRequestContext(),raw);
  const v=data.version;
  const format=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
  }).format(date)+" IST";
  return <div className="space-y-6">
    <PageHeader eyebrow="Mentor · Final delivery" title={"Delivery version "+v.version}
      description={data.projectTitle+" · "+data.projectStatus}
      actions={<Link href={"/mentor/projects/"+encodeURIComponent(data.projectId)+"/review-overview"}
        className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Review overview
      </Link>}/>
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
      <h2 className="text-base font-semibold">Registered review decision</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Submission state</dt>
          <dd className="mt-1 text-sm font-semibold">{v.status}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Review</dt>
          <dd className="mt-1 text-sm font-semibold">{v.decisionLabel}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Submitted</dt>
          <dd className="mt-1 text-sm">{v.submittedAt?format(v.submittedAt):"Not submitted"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Reviewed</dt>
          <dd className="mt-1 text-sm">{v.reviewedAt?format(v.reviewedAt):"No review date recorded"}</dd></div>
      </dl>
      <h3 className="mt-5 font-semibold">Recorded reviewer feedback</h3>
      {v.feedback?<p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">
        {v.feedback}</p>:
        <p className="mt-2 text-sm text-muted-foreground">
          No written reviewer feedback is recorded for this version.
        </p>}
    </section>
    <p className="text-xs text-muted-foreground">
      This view is scoped to an active Mentor assignment and displays only the
      selected registered review decision and text. Learner contact, private
      submission notes, source URLs and reviewer identity are excluded.
      Existing authorized Delivery controls remain the only write path.
    </p>
  </div>;
}
