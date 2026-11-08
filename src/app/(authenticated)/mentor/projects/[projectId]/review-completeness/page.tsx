import { Pagination } from "@/components/ui/pagination";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import {getMentorProjectReviewCompleteness}
  from "@/modules/projects/mentor-review-completeness-service";
import {mentorReviewCompletenessHref,mentorReviewCompletenessQuerySchema,mentorReviewVersionHref}
  from "@/modules/projects/mentor-review-completeness-model";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { istDateTimeFormatter } from "@/lib/format-date";

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
    <TextLink href={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-completeness"} className="inline-flex min-h-11 items-center md:min-h-9">
      Clear invalid filters
    </TextLink>
  </section>;
  const context=await getCurrentRequestContext();
  const data=await getMentorProjectReviewCompleteness(context,parsed.data);
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader eyebrow="Mentor · Project Overview" title="Delivery review completeness"
      description={data.projectTitle??"Current assigned project"}
      actions={<TextLink data-unskin="" href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"}
        className="inline-flex min-h-11 items-center text-sm md:min-h-9">
        Delivery workspace
      </TextLink>} />
    {!data.enabled?<section role="status"
      className="border-b border-border pb-4 text-sm text-body">
      Projects access is disabled. Delivery history was not loaded.
    </section>:<>
      <p className="text-sm text-body leading-[22px]">
        {data.total} persisted final-delivery version{data.total===1?"":"s"}
        {" · "}Project state: {data.projectStatus}
      </p>
      {data.items.length===0?<EmptyState title="No registered delivery versions"
        description="There are no persisted final-delivery versions for this project. No review or feedback is inferred from missing history." action={<TextLink href={"/mentor/projects/"+encodeURIComponent(projectId)+"?tab=delivery"} className="inline-flex min-h-11 items-center md:min-h-9">Delivery workspace</TextLink>}/>
      :<ol aria-label="Recorded delivery review versions" className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(item=>
        <li key={item.id} className="min-w-0 py-[var(--lms-space-4)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Heading level={2} size="base" className="m-0 min-w-0 break-words leading-6 text-[var(--lms-heading)]">Delivery version {item.version}</Heading>
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
            Submitted {istDateTimeFormatter.format(item.submittedAt)} IST
          </p>:<p className="mt-2 text-xs text-muted-foreground leading-5">
            No submitted timestamp (draft)
          </p>}
          {item.reviewedAt?<p className="mt-1 text-xs text-muted-foreground leading-5">
            Reviewed {istDateTimeFormatter.format(item.reviewedAt)} IST
          </p>:null}
          <TextLink href={mentorReviewVersionHref(projectId,item.id)}
            aria-label={"View delivery version "+item.version+" details"}
            className="mt-2 inline-flex min-h-11 max-w-full items-center break-words text-sm md:min-h-9">
            View version details
          </TextLink>
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
