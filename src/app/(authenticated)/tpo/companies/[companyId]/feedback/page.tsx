import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { TpoCompanyFeedbackForm } from "@/components/placements/tpo-company-feedback-form";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoCompanyFeedback } from "@/modules/placements/tpo-company-feedback-service";
import { tpoCompanyFeedbackQuerySchema } from "@/modules/placements/tpo-company-feedback-model";

type SearchParams = { page?: string | string[] };
const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
});
function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function TpoCompanyFeedbackPage({
  params, searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  await requireTpoBatchActor(context);
  const [{ companyId }, search] = await Promise.all([params, searchParams]);
  if (Array.isArray(search.page)) notFound();
  const parsed = tpoCompanyFeedbackQuerySchema.safeParse({
    companyId,
    ...(first(search.page) ? { page: first(search.page) } : {}),
  });
  if (!parsed.success) notFound();
  const data = await getTpoCompanyFeedback(context, parsed.data);
  if (!data) notFound();

  const base = "/tpo/companies/" + encodeURIComponent(companyId) + "/feedback";
  return (
    <div className="min-w-0 space-y-5">
      <Link href={"/tpo/companies/" + encodeURIComponent(companyId)}
        className="lms-inline-link inline-flex min-h-11 items-center text-sm font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
        ← Company details
      </Link>
      <PageHeader
        
        title={data.companyName + " · Internal feedback"}
        description="Recorded TPO recruiter notes for contacts explicitly linked to this college-company relationship."
      />
      {!data.available ? (
        <Alert tone="warning">
          Registered recruiter note storage is unavailable in this database. No
          zero-history inference is made and note creation is disabled.
        </Alert>
      ) : (
        <>
          {!data.writeEnabled ? (
            <Alert tone="warning">
              CRM writes are not enabled for this deployment. Existing notes remain
              readable, but new feedback cannot be recorded.
            </Alert>
          ) : data.contacts.length === 0 ? (
            <Alert tone="warning">
              No recruiter contacts are explicitly linked to this company. Link
              a contact before recording company feedback.
            </Alert>
          ) : (
            <TpoCompanyFeedbackForm companyId={companyId} contacts={data.contacts} />
          )}
          <section className="min-w-0 border-y border-[var(--lms-canvas-border)]">
            <h2 className="border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)] text-[var(--lms-font-lg)] font-semibold text-foreground">
              Recorded internal notes {data.total === null ? "" : "(" + data.total + ")"}
            </h2>
            {data.notes.length === 0 ? (
              <EmptyState title="No saved NOTE-type CRM activities appear on this page." description="Calls, meetings, external communications and unstored feedback are not inferred."/>
            ) : (
              <ul className="divide-y divide-border">
                {data.notes.map((item) => (
                  <li key={item.id} className="space-y-2 py-[var(--lms-space-4)]">
                    <div className="flex flex-wrap justify-between gap-2">
                      <Link href={"/tpo/recruiters/" + encodeURIComponent(item.leadId)}
                        className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
                        {item.contactName}
                      </Link>
                      <time className="text-xs text-muted-foreground" dateTime={item.recordedAtIso}>
                        {dateFormat.format(new Date(item.recordedAtIso))} IST
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-body">{item.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <nav aria-label="Feedback pages" className="flex items-center justify-between gap-3 text-sm">
            <span>Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-3">
              {data.page > 1 ? (
                <Link href={base + "?page=" + (data.page - 1)}
                  className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">← Previous</Link>
              ) : null}
              {data.totalPages !== null && data.page < data.totalPages ? (
                <Link href={base + "?page=" + (data.page + 1)}
                  className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Next →</Link>
              ) : null}
            </div>
          </nav>
        </>
      )}
      <p className="text-xs text-muted-foreground">
        This is an internal TPO CRM note log, not company-submitted ratings,
        verified recruiter responses or delivered messages. Notes can contain
        sensitive business context; they are not exposed to learners or recruiters.
      </p>
    </div>
  );
}
