import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubjectEventHistory } from "@/components/activity/subject-event-history";
import { ActivityServiceError } from "@/modules/activity/errors";
import { getActivityEventDetail } from "@/modules/activity/service";
import { hasMembershipRole, isSuperAdmin } from "@/modules/identity/context";

function when(value: Date) {
  return value.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (
    !isSuperAdmin(context) &&
    !hasMembershipRole(context, "COLLEGE_ADMIN")
  ) {
    redirect("/dashboard");
  }

  const { eventId } = await params;
  let detail;
  try {
    detail = await getActivityEventDetail(context, eventId);
  } catch (error) {
    if (
      error instanceof ActivityServiceError &&
      error.code === "ACTIVITY_EVENT_NOT_FOUND"
    ) {
      notFound();
    }
    throw error;
  }

  const { event, actor } = detail;
  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <Breadcrumbs items={[{ label: "Activity Log", href: "/activity" }, { label: event.summary }]} />
      <PageHeader
        title={event.summary}
        description="Tenant-scoped event detail. Known credential and identity-secret metadata keys are redacted before rendering."
        actions={<PageBackLink href="/activity" label="Back to activity" />}
      />

      <section className="min-w-0 space-y-4 border-b border-border pb-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge>{event.module}</StatusBadge>
          <StatusBadge tone={event.importance==="CRITICAL"?"error":event.importance==="HIGH"?"warning":event.importance==="MEDIUM"?"info":"neutral"}>{event.importance}</StatusBadge>
          <StatusBadge>{event.eventType}</StatusBadge>
        </div>
        <dl className="grid min-w-0 gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="font-semibold text-muted-foreground">Actor</dt>
            <dd className="m-0 break-all text-foreground">
              {actor?.displayName ?? actor?.email ?? "System"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Occurred</dt>
            <dd className="m-0 text-foreground"><time dateTime={event.occurredAt.toISOString()}>{when(event.occurredAt)} IST</time></dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Subject type</dt>
            <dd className="m-0 break-all text-foreground">{event.subjectType}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Subject label</dt>
            <dd className="m-0 break-all text-foreground">{event.subjectLabel ?? "—"}</dd>
          </div>
        </dl>
        <details className="min-w-0 border-t border-border pt-3">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">More event details</summary>
          <dl className="grid min-w-0 gap-4 pb-3 pt-3 text-sm md:grid-cols-2">
          <div>
            <dt className="font-semibold text-muted-foreground">Subject ID</dt>
            <dd className="m-0 break-all text-foreground">{event.subjectId}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Event ID</dt>
            <dd className="m-0 break-all text-foreground">{event.id}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Organization scope</dt>
            <dd className="m-0 break-all text-foreground">{event.organizationId ?? "Global"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">College scope</dt>
            <dd className="m-0 break-all text-foreground">{event.collegeId ?? "Global"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Group key</dt>
            <dd className="m-0 break-all text-foreground">{event.groupKey ?? "—"}</dd>
          </div>
          </dl>
        </details>
      </section>

      <div className="flex flex-wrap gap-3 border-b border-border pb-4">
        <Link href={(isSuperAdmin(context)?"/admin/audit":"/activity")+"?view=all&range=ALL&subjectType="+
          encodeURIComponent(event.subjectType)+"&subjectId="+encodeURIComponent(event.subjectId)}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">
          View history for this record
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">Event context</h2>
        {Object.keys(event.metadata).length === 0 ? (
          <p className="border-t border-border pt-4 text-sm text-muted-foreground">
            This event has no structured context.
          </p>
        ) : (
          <pre className="max-h-96 max-w-full overflow-auto whitespace-pre-wrap break-words border-y border-border bg-[var(--lms-neutral-50)] p-4 text-xs leading-6 text-body md:p-6">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        )}
      </section>

      <SubjectEventHistory context={context} subjectType={event.subjectType} subjectId={event.subjectId}/>

      <details className="min-w-0 border-t border-border pt-4">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Legacy audit gap notice</summary>
        <p className="mt-2 text-sm leading-6 text-body">
          The legacy admin audit table also persisted an actor role snapshot,
          request IP, and user agent. Those are not currently persisted by
          vNext activity events and are tracked as DB10 parity gaps rather than
          being synthesized on this page.
        </p>
      </details>
    </div>
  );
}
