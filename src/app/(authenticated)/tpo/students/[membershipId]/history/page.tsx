import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  getTpoStudentPlacementHistory,
} from "@/modules/placements/tpo-student-history-service";
import {
  tpoStudentHistoryQuerySchema,
} from "@/modules/placements/tpo-student-history-model";

type SearchParams = { page?: string | string[] };
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export default async function TpoLearnerPlacementHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ membershipId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const [{ membershipId }, search] = await Promise.all([params, searchParams]);
  const parsed = tpoStudentHistoryQuerySchema.safeParse({
    membershipId,
    ...(first(search.page) ? { page: first(search.page) } : {}),
  });
  if (!parsed.success) notFound();

  const history = await getTpoStudentPlacementHistory(context, parsed.data);
  if (!history) notFound();

  const href = (page: number) => "/tpo/students/" +
    encodeURIComponent(history.learner.membershipId) + "/history?page=" + page;

  return (
    <div className="space-y-6">
      <Link href="/tpo/students" className="text-sm font-semibold text-link hover:underline">
        ← Back to Students
      </Link>
      <PageHeader
        eyebrow="TPO · Students"
        title={history.learner.displayName + " · Placement history"}
        description="Read-only application status, versioned round results, offer transitions and joining evidence across persisted placement seasons."
        actions={
          <Link
            href={"/tpo/students/" +
              encodeURIComponent(history.learner.membershipId) + "/participation"}
            className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-foreground"
          >
            Participation decision
          </Link>
        }
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Placement history totals">
        {[
          ["Applications (all seasons)", history.total],
          ["Offer versions (this page)", history.pageFacts.offerVersions],
          ["Round result versions (this page)", history.pageFacts.resultVersions],
          ["Staged round results (this page)", history.pageFacts.stagedResults],
          ["Accepted offer versions (this page)", history.pageFacts.acceptedOfferVersions],
          ["Confirmed joins (this page)", history.pageFacts.confirmedJoins],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5">
            <p className="text-sm font-medium text-body">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </section>
      <p className="text-sm text-body">
        Membership status: {history.learner.membershipStatus}. Offer counts are historical
        versions, not necessarily distinct accepted placements. Joining is confirmed only
        when an accepted offer has a recorded JOINED outcome.
      </p>
      {history.items.length === 0 ? (
        <p role="status" className="border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 py-3 text-sm text-body">
          No persisted placement applications were found for this learner on this page.
          External placement records and unmigrated placement registration sources are
          not included.
        </p>
      ) : (
        <div className="space-y-4">
          {history.items.map((item) => (
            <article key={item.id} className="space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{item.jobTitle}</h2>
                  <p className="mt-1 text-sm text-body">
                    {item.companyName} · {item.seasonName} · {item.roleTitle}
                  </p>
                  {item.addedByCollege?<p className="mt-1 text-sm font-semibold">Added by the college</p>:null}
                  {item.jobId?<Link href={"/tpo/placements/jobs/"+encodeURIComponent(item.jobId)}
                    className="mt-2 inline-flex min-h-9 items-center font-semibold text-link underline">Open drive</Link>:null}
                </div>
                <span className="rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle px-3 py-1 text-xs font-semibold text-foreground">
                  {item.applicationStatus}
                </span>
              </div>
              <p className="text-sm text-body">
                Applied {dateFormat.format(new Date(item.submittedAt))} IST ·
                Channel: {item.channel}
              </p>
              <section aria-label="Application status changes">
                <h3 className="mb-2 font-semibold text-foreground">
                  Application status history
                </h3>
                {item.applicationEvents.length === 0 ? (
                  <p className="text-sm text-body">
                    No separate application status events are recorded.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2 text-sm">
                    {item.applicationEvents.map((event) => (
                      <li key={event.id} className="rounded-[var(--lms-control-radius)] border border-border px-3 py-2">
                        {event.fromStatus ?? "NEW"} → {event.toStatus}
                        {" · "}{dateFormat.format(new Date(event.at))} IST
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <div className="grid gap-4 lg:grid-cols-2">
                <section>
                  <h3 className="mb-2 font-semibold text-foreground">
                    Applied round results ({item.appliedRounds.length})
                  </h3>
                  {item.appliedRounds.length === 0 ? (
                    <p className="text-sm text-body">No applied round outcomes recorded.</p>
                  ) : (
                    <ul className="space-y-2">
                      {item.appliedRounds.map((round) => (
                        <li key={round.id} className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm">
                          {round.name}: <strong>{round.outcome}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                  <details className="mt-4 rounded-[var(--lms-control-radius)] border border-border p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-foreground">
                      All recorded round result versions ({item.resultVersions.length})
                    </summary>
                    {item.resultVersions.length === 0 ? (
                      <p className="mt-2 text-sm text-body">
                        No staged, superseded or applied result versions are recorded.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2 text-sm">
                        {item.resultVersions.map((version) => (
                          <li key={version.id} className="rounded-[var(--lms-control-radius)] bg-surface-secondary p-3">
                            {version.name} · version {version.version}:{" "}
                            <strong>{version.status}</strong> · {version.outcome}
                            <p className="mt-1 text-xs text-muted-foreground">
                              Recorded {dateFormat.format(new Date(version.submittedAt))} IST.
                              {version.status !== "APPLIED"
                                ? " Not an applied final outcome."
                                : " Applied result."}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </details>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold text-foreground">
                    Offer history ({item.offers.length} version(s))
                  </h3>
                  {item.offers.length === 0 ? (
                    <p className="text-sm text-body">No persisted offers recorded.</p>
                  ) : (
                    <ul className="space-y-2">
                      {item.offers.map((offer) => (
                        <li key={offer.id} className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-body">
                          <p className="font-semibold text-foreground">
                            {offer.roleTitle} · {offer.status}
                          </p>
                          <p className="mt-1">
                            Package: {offer.annualCtcInr === null ? "Not recorded" :
                              new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0,
                              }).format(offer.annualCtcInr)}
                          </p>
                          <p className="mt-1">
                            Joining: {offer.joiningStatus ?? "No outcome recorded"}
                          </p>
                          {offer.statusEvents.length > 0 ? (
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {offer.statusEvents.map((event) => (
                                <li key={event.id}>
                                  {event.fromStatus ?? "NEW"} → {event.toStatus}
                                  {" · "}{dateFormat.format(new Date(event.at))} IST
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </article>
          ))}
        </div>
      )}
      <nav aria-label="History pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span>Page {history.page} of {history.totalPages} · {history.total} application(s)</span>
        <div className="flex gap-4">
          {history.page > 1 ? (
            <Link href={href(history.page - 1)} className="font-semibold text-link hover:underline">
              ← Previous
            </Link>
          ) : null}
          {history.page < history.totalPages ? (
            <Link href={href(history.page + 1)} className="font-semibold text-link hover:underline">
              Next →
            </Link>
          ) : null}
        </div>
      </nav>
      <p className="text-xs leading-5 text-muted-foreground">
        Source is registered in-app placement data, including archived historical drives.
        External offers, registration choices and background verification are not
        inferred from these records. STAGED/SUPERSEDED round results are audit
        versions, not final candidate outcomes. Internal comments, private
        reasons and messaging are not displayed. No learner eligibility is changed
        on this page.
      </p>
    </div>
  );
}
