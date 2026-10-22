import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
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
    <Link href="/mentor/projects" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)] md:min-h-9 hover:text-[var(--lms-primary-text)]">
      Return to assigned projects
    </Link>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getMentorProjectReviewCompleteness(context,parsed.data);
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader eyebrow="Mentor · Project Overview" title="Delivery review completeness"
      description={data.projectTitle??"Current assigned project"}
      actions={<Link data-unskin="" href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">
        Delivery workspace
      </Link>} />
    {!data.enabled?<section role="status"
      className="border-b border-border pb-4 text-sm text-body">
      Projects access is disabled. Delivery history was not loaded.
    </section>:<>
      <p className="text-sm text-body leading-[22px]">
        {data.total} persisted final-delivery version{data.total===1?"":"s"}
        {" · "}Project state: {data.projectStatus}
      </p>
      {data.items.length===0?<EmptyState title="No registered delivery versions"
        description="There are no persisted final-delivery versions for this project. No review or feedback is inferred from missing history." action={<Link href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"} className="inline-flex min-h-11 items-center text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-teal-deep)]">Delivery workspace</Link>}/>
      :<ol aria-label="Recorded delivery review versions" className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(item=>
        <li key={item.id} className="min-w-0 py-[var(--lms-space-4)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 min-w-0 break-words text-base font-semibold leading-6 text-[var(--lms-heading)]">Delivery version {item.version}</h2>
            <StatusBadge tone={item.status==="APPROVED"?"success":item.status==="REJECTED"?"error":"neutral"}>{item.status}</StatusBadge>
          </div>
          <dl className="mt-2 grid min-w-0 gap-2 md:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Review decision</dt>
              <dd className="mt-1 text-sm font-semibold">{item.reviewLabel}</dd>
            </div>
            <div><dt className="text-xs text-muted-foreground">Written feedback</dt>
              <dd className="mt-1 text-sm font-semibold">
                {item.writtenFeedbackRecorded?"Recorded":"Not recorded"}
              </dd>
            </div>
          </dl>
          {item.submittedAt?<p className="mt-2 text-xs text-muted-foreground leading-5">
            Submitted {new Intl.DateTimeFormat("en-IN",{
              dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
            }).format(item.submittedAt)} IST
          </p>:<p className="mt-2 text-xs text-muted-foreground leading-5">
            No submitted timestamp (draft)
          </p>}
          {item.reviewedAt?<p className="mt-1 text-xs text-muted-foreground leading-5">
            Reviewed {new Intl.DateTimeFormat("en-IN",{
              dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
            }).format(item.reviewedAt)} IST
          </p>:null}
        </li>)}</ol>}
      {data.totalPages>1?<Pagination label="Review version pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorReviewCompletenessHref({projectId,page})}/>:null}
    </>}
    <p className="text-xs text-muted-foreground leading-[1.6]">
      A review is recorded only when a persisted review decision exists.
      Feedback means recorded written text, not a product requirement.
      Raw feedback, learner identities and inaccessible historic records are not exposed.
      Existing authorized Delivery actions remain the sole write path.
    </p>
  </div>;
}
