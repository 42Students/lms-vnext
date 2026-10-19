import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOwnLearnerApplicationHistory } from "@/modules/placements/learner-application-detail-service";
import { placementApplicationIdSchema } from "@/modules/placements/validation";

function dateInIst(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value) + " IST";
}

export default async function LearnerApplicationHistoryPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  if (!placementApplicationIdSchema.safeParse(applicationId).success) {
    notFound();
  }
  const context = await getCurrentRequestContext();
  const history = await getOwnLearnerApplicationHistory(context, applicationId);
  if (!history) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={"/learn/my-placements/applications?applicationId=" +
          encodeURIComponent(history.applicationId)}
        className="inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-primary-text hover:underline"
      >
        ← Back to application
      </Link>
      <PageHeader
        title={history.roleTitle}
        description={history.companyName + " · Persisted status-change timeline"}
        actions={<StatusBadge>{history.currentStatus.replaceAll("_", " ")}</StatusBadge>}
      />
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">Status history</h2>
        <p className="mt-2 text-sm text-body">
          Only recorded application status changes are shown. Screening
          and round decisions remain in your application details.
        </p>
        {history.events.length === 0 ? (
          <div role="status" className="mt-4 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-5 text-sm text-body">
            No application-status history records are available yet.
            Your current application status appears above.
          </div>
        ) : (
          <ol className="mt-5 space-y-3">
            {history.events.map((event) => (
              <li key={event.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="m-0 text-sm font-semibold text-foreground">{event.label}</p>
                  <time className="text-xs text-muted-foreground" dateTime={event.occurredAt.toISOString()}>
                    {dateInIst(event.occurredAt)}
                  </time>
                </div>
                <p className="mt-2 text-sm text-body">
                  {event.fromStatus
                    ? event.fromStatus.replaceAll("_", " ") + " → "
                    : "Initial status: "}
                  {event.toStatus.replaceAll("_", " ")}
                </p>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Internal actor identifiers and private change notes are not shown.
        </p>
      </section>
    </div>
  );
}
