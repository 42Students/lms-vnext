import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="space-y-6">
      <Link href={"/tpo/companies/" + encodeURIComponent(companyId)}
        className="text-sm font-semibold text-link hover:underline">
        ← Company details
      </Link>
      <PageHeader
        eyebrow="TPO · Recruiter relationships"
        title={data.companyName + " · Internal feedback"}
        description="Recorded TPO recruiter notes for contacts explicitly linked to this college-company relationship."
      />
      {!data.available ? (
        <p role="status" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6 text-sm text-body">
          Registered recruiter note storage is unavailable in this database. No
          zero-history inference is made and note creation is disabled.
        </p>
      ) : (
        <>
          {!data.writeEnabled ? (
            <p role="status" className="border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 py-3 text-sm text-body">
              CRM writes are not enabled for this deployment. Existing notes remain
              readable, but new feedback cannot be recorded.
            </p>
          ) : data.contacts.length === 0 ? (
            <p role="status" className="border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 py-3 text-sm text-body">
              No recruiter contacts are explicitly linked to this company. Link
              a contact before recording company feedback.
            </p>
          ) : (
            <TpoCompanyFeedbackForm companyId={companyId} contacts={data.contacts} />
          )}
          <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface">
            <h2 className="border-b border-border px-5 py-4 text-lg font-semibold text-foreground">
              Recorded internal notes {data.total === null ? "" : "(" + data.total + ")"}
            </h2>
            {data.notes.length === 0 ? (
              <p role="status" className="p-5 text-sm text-body">
                No saved NOTE-type CRM activities appear on this page. Calls,
                meetings, external communications and unstored feedback are not inferred.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {data.notes.map((item) => (
                  <li key={item.id} className="space-y-2 px-5 py-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <Link href={"/tpo/recruiters/" + encodeURIComponent(item.leadId)}
                        className="font-semibold text-link hover:underline">
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
                  className="font-semibold text-link hover:underline">← Previous</Link>
              ) : null}
              {data.totalPages !== null && data.page < data.totalPages ? (
                <Link href={base + "?page=" + (data.page + 1)}
                  className="font-semibold text-link hover:underline">Next →</Link>
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
