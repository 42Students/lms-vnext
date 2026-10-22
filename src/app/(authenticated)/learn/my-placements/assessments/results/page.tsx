import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/ui/error-state";
import { AuthorizationError } from "@/modules/permissions/policy";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  learnerAssessmentResultsQuerySchema,
  pageLearnerAssessmentResults,
  type LearnerAssessmentResultsView,
} from "@/modules/placements/learner-assessment-results-model";
import { getOwnLearnerAssessmentResults } from "@/modules/placements/learner-assessment-results-service";

const views: readonly { id: LearnerAssessmentResultsView; label: string }[] = [
  { id: "all", label: "All results" },
  { id: "passed", label: "Passed" },
  { id: "failed", label: "Not passed" },
  { id: "other", label: "Other outcomes" },
];

function formatIst(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value) + " IST";
}

export default async function LearnerAssessmentResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[]; q?: string | string[]; page?: string | string[] }>;
}) {
  const parsed=learnerAssessmentResultsQuerySchema.safeParse(await searchParams);
  if(!parsed.success)notFound();
  const {view,q}=parsed.data;
  const context = await getCurrentRequestContext();
  let results:Awaited<ReturnType<typeof getOwnLearnerAssessmentResults>>;
  try {
    results = await getOwnLearnerAssessmentResults(context, view);
  } catch(error) {
    if(error instanceof AuthorizationError)throw error;
    const retry=new URLSearchParams();
    if(view!=="all")retry.set("view",view);
    if(q)retry.set("q",q);
    if(parsed.data.page>1)retry.set("page",String(parsed.data.page));
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Official assessment results" />
      <ErrorState title="Could not load assessment results"
        description="Published outcomes could not be loaded. No result has been treated as missing or not passed."
        action={<Link href={"/learn/my-placements/assessments/results"+(retry.size?"?"+retry.toString():"")}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry official results</Link>} />
    </div>;
  }
  const paged=pageLearnerAssessmentResults(results.items,parsed.data);
  function href(nextView:string,pageNumber=1,search=q) {
    const query=new URLSearchParams();
    if(nextView!=="all")query.set("view",nextView);
    if(search)query.set("q",search);
    if(pageNumber>1)query.set("page",String(pageNumber));
    const tail=query.toString();
    return "/learn/my-placements/assessments/results"+(tail?"?"+tail:"");
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Official assessment results"
        description="Only placement-team-applied test outcomes from your own applications. A scheduled or submitted assessment is not a published result."
      />
      <Link href="/learn/my-placements/assessments"
        className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text hover:underline">
        ← Assessment schedule
      </Link>

      <Tabs ariaLabel="Filter published assessment results" renderPanel={false} value={view} items={views.map(option=>({value:option.id,label:option.label,count:results.counts[option.id],href:href(option.id)}))}/>
      <form method="get" role="search" aria-label="Placement assessment results filters" className="flex min-w-0 flex-col items-stretch gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:gap-[8px]">
        {view!=="all" ? <Input type="hidden" name="view" value={view}/> : null}
        <label className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">
          Search published results
          <Input type="search" name="q" defaultValue={q} maxLength={100}
            placeholder="Company, role or round"
            className="mt-1 min-h-11 md:min-h-[var(--lms-control-height)]"/>
        </label>
        <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-[var(--lms-control-height)]">
          Search
        </Button>
        {q?<Link href={href(view,1,"")}
          className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text">Clear search</Link>:null}
      </form>
      <p role="status" className="text-sm text-body">
        Showing {paged.items.length} of {paged.total.toLocaleString("en-IN")} matching published assessment outcomes.
      </p>
      {paged.items.length === 0 ? (
        <section role="status" className="flex min-h-44 flex-col items-start justify-center border-y border-border px-2 py-6">
          <h2 className="text-base font-semibold text-[var(--lms-heading)]">
            {results.counts.all === 0 ? "No official assessment results yet" : "No results in this category"}
          </h2>
          <p className="mt-2 text-sm text-body">
            {results.counts.all === 0
              ? "No applied test outcomes are recorded for your placement applications. Check the schedule for upcoming assessments; submitting on a provider platform does not publish a result here."
              : "Your published test outcomes do not match the selected category."}
          </p>
          {results.counts.all > 0 ? (
            <Link href="/learn/my-placements/assessments/results"
              className="mt-3 inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text hover:underline">
              View all official results →
            </Link>
          ) : null}
        </section>
      ) : (
        <section aria-label="Official assessment outcomes" className="min-w-0 divide-y divide-border">
          {paged.items.map((item) => (
            <article key={item.resultId} className="min-w-0 py-4 first:pt-0 last:pb-0 md:py-4">
              <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-text">
                    {item.companyName}
                  </p>
                  <h2 className="mt-1 break-words text-base font-semibold text-[var(--lms-heading)]">{item.roundName}</h2>
                  <p className="mt-1 text-sm text-body">
                    {item.roleTitle} · Round {item.roundSequence}
                  </p>
                </div>
                <StatusBadge tone={item.outcome === "PASS" ? "success" :
                  item.outcome === "FAIL" ? "error" : "neutral"}>
                  {item.outcome.replaceAll("_", " ")}
                </StatusBadge>
              </div>
              <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <dt className="font-semibold text-muted-foreground">Applied on</dt>
                  <dd className="mt-1 text-foreground">
                    <time dateTime={item.appliedAt.toISOString()}>{formatIst(item.appliedAt)}</time>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted-foreground">Published score</dt>
                  <dd className="mt-1 text-foreground">
                    {item.scorePercent === null ? "Not provided" : item.scorePercent + "%"}
                  </dd>
                </div>
              </dl>
              {item.candidateMessage ? (
                <section className="mt-4 min-w-0 border-t border-border pt-3">
                  <h3 className="text-xs font-semibold text-[var(--lms-heading)]">Shared feedback</h3>
                  <p className="mt-2 max-w-3xl whitespace-pre-wrap break-words text-sm leading-6 text-body">{item.candidateMessage}</p>
                </section>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-4">
                <Link href={"/learn/my-placements/applications?applicationId=" +
                  encodeURIComponent(item.applicationId)}
                  className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 md:min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-primary-text hover:underline">
                  View application →
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
      {paged.pages>1 ? <Pagination label="Assessment results pagination" page={paged.page} pageCount={paged.pages} hrefForPage={page=>href(view,page)} /> : null}
      <p className="text-xs text-muted-foreground">
        Only applied placement round results appear here. Provider submission
        status, internal reviews and unpublished grades are not inferred.
      </p>
    </div>
  );
}
