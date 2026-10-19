import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {PageHeader} from "@/components/ui/page-header";
import {getMentorProjectReviewCompleteness}
  from "@/modules/projects/mentor-review-completeness-service";
import {mentorReviewCompletenessHref,mentorReviewCompletenessQuerySchema}
  from "@/modules/projects/mentor-review-completeness-model";

type Params={page?:string|string[]};
export default async function MentorProjectReviewCompletenessPage({
  params,searchParams,
}:{params:Promise<{projectId:string}>;searchParams:Promise<Params>}) {
  const [{projectId},query]=await Promise.all([params,searchParams]);
  const parsed=mentorReviewCompletenessQuerySchema.safeParse(
    Array.isArray(query.page)?null:{projectId,page:query.page},
  );
  if(!parsed.success)return <section role="alert" className="space-y-3">
    <PageHeader title="Invalid review history selector" />
    <Link href="/mentor/projects" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      Return to assigned projects
    </Link>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getMentorProjectReviewCompleteness(context,parsed.data);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Project Overview" title="Delivery review completeness"
      description={data.projectTitle??"Current assigned project"}
      actions={<Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Delivery workspace
      </Link>} />
    {!data.enabled?<section role="status"
      className="border-b border-border pb-4 text-sm text-body">
      Projects access is disabled. Delivery history was not loaded.
    </section>:<>
      <p className="text-sm text-body">
        {data.total} persisted final-delivery version{data.total===1?"":"s"}
        {" · "}Project state: {data.projectStatus}
      </p>
      {data.items.length===0?<EmptyState title="No registered delivery versions"
        description="There are no persisted final-delivery versions for this project. No review or feedback is inferred from missing history."/>
      :<ol className="divide-y divide-border">{data.items.map(item=>
        <li key={item.id} className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground">Delivery version {item.version}</h2>
            <span className="text-sm font-semibold text-body">{item.status}</span>
          </div>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Review decision</dt>
              <dd className="mt-1 text-sm font-semibold">{item.reviewLabel}</dd>
            </div>
            <div><dt className="text-xs text-muted-foreground">Written feedback</dt>
              <dd className="mt-1 text-sm font-semibold">
                {item.writtenFeedbackRecorded?"Recorded":"Not recorded"}
              </dd>
            </div>
          </dl>
          {item.submittedAt?<p className="mt-2 text-xs text-muted-foreground">
            Submitted {new Intl.DateTimeFormat("en-IN",{
              dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
            }).format(item.submittedAt)} IST
          </p>:<p className="mt-2 text-xs text-muted-foreground">
            No submitted timestamp (draft)
          </p>}
          {item.reviewedAt?<p className="mt-1 text-xs text-muted-foreground">
            Reviewed {new Intl.DateTimeFormat("en-IN",{
              dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
            }).format(item.reviewedAt)} IST
          </p>:null}
        </li>)}</ol>}
      <Pagination label="Review version pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorReviewCompletenessHref({projectId,page})}/>
    </>}
    <p className="text-xs leading-5 text-muted-foreground">
      A review is recorded only when a persisted review decision exists.
      Feedback means recorded written text, not a product requirement.
      Raw feedback, learner identities and inaccessible historic records are not exposed.
      Existing authorized Delivery actions remain the sole write path.
    </p>
  </div>;
}
