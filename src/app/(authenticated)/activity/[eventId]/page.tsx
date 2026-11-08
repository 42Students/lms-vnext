import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubjectEventHistory } from "@/components/activity/subject-event-history";
import { ActivityServiceError } from "@/modules/activity/errors";
import { getActivityEventDetail } from "@/modules/activity/service";
import { hasMembershipRole, isSuperAdmin } from "@/modules/identity/context";
import { Heading } from "@/components/ui/heading";
import { Disclosure } from "@/components/ui/disclosure";
import { ButtonLink } from "@/components/ui/button-link";
import { formatDateTimeIst } from "@/lib/format-date";

function when(value: Date) {
  return formatDateTimeIst(value);
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
    <div className="min-w-0 max-w-full space-y-4 break-words md:space-y-6">
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
        <Disclosure title="More event details" className="min-w-0">
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
        </Disclosure>
      </section>

      <div className="flex flex-wrap gap-3 border-b border-border pb-4">
        <ButtonLink variant="secondary" href={(isSuperAdmin(context)?"/admin/audit":"/activity")+"?view=all&range=ALL&subjectType="+
          encodeURIComponent(event.subjectType)+"&subjectId="+encodeURIComponent(event.subjectId)}>
          View history for this record
        </ButtonLink>
      </div>

      <section className="space-y-3">
        <Heading level={2} className="m-0 text-[var(--lms-heading)] text-[length:var(--lms-font-lg)] leading-[26px] md:text-[length:var(--lms-font-xl)] md:leading-[28px]">Event context</Heading>
        {Object.keys(event.metadata).length === 0 ? (
          <p className="border-t border-border pt-4 text-sm text-muted-foreground">
            This event has no structured context.
          </p>
        ) : (
          <pre role="region" aria-label="Event context JSON, scrollable" tabIndex={0} className="max-h-96 max-w-full overflow-auto whitespace-pre-wrap break-words border-y border-border bg-[var(--lms-neutral-50)] p-4 text-xs leading-6 text-body focus-ring md:p-6">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        )}
      </section>

      <SubjectEventHistory context={context} subjectType={event.subjectType} subjectId={event.subjectId}/>

      <Disclosure title="Legacy audit gap notice" className="min-w-0">
        <p className="mt-2 text-sm leading-6 text-body">
          The legacy admin audit table also persisted an actor role snapshot,
          request IP, and user agent. Those are not currently persisted by
          vNext activity events and are tracked as DB10 parity gaps rather than
          being synthesized on this page.
        </p>
      </Disclosure>
    </div>
  );
}
