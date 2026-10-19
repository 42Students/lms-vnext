import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActivityServiceError } from "@/modules/activity/errors";
import { getActivityEventDetail } from "@/modules/activity/service";
import { hasMembershipRole, isSuperAdmin } from "@/modules/identity/context";

function when(value: Date) {
  return value.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "long",
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
    <div className="min-w-0 space-y-6">
      <Breadcrumbs items={[{ label: "Activity Log", href: "/activity" }, { label: event.summary }]} />
      <PageHeader
        eyebrow="Activity Center"
        title={event.summary}
        description="Tenant-scoped event detail. Known credential and identity-secret metadata keys are redacted before rendering."
        actions={
          <Link
            href="/activity"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]"
          >
            Back to activity
          </Link>
        }
      />

      <Card as="section" className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge>{event.module}</StatusBadge>
          <StatusBadge>{event.importance}</StatusBadge>
          <StatusBadge>{event.eventType}</StatusBadge>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
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
            <dt className="font-semibold text-muted-foreground">Subject ID</dt>
            <dd className="m-0 break-all text-foreground">{event.subjectId}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Subject label</dt>
            <dd className="m-0 break-all text-foreground">{event.subjectLabel ?? "—"}</dd>
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
      </Card>

      <section className="space-y-3">
        <h2 className="m-0 text-lg font-semibold text-foreground">Event context</h2>
        {Object.keys(event.metadata).length === 0 ? (
          <p className="border-b border-border py-5 text-sm text-muted-foreground">
            This event has no structured context.
          </p>
        ) : (
          <pre className="max-h-[32rem] max-w-full overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-surface p-4 text-xs leading-6 text-body sm:p-6">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        )}
      </section>

      <Card as="section">
        <h2 className="m-0 text-base font-semibold text-foreground">Legacy audit gap notice</h2>
        <p className="mt-2 text-sm leading-6 text-body">
          The legacy admin audit table also persisted an actor role snapshot,
          request IP, and user agent. Those are not currently persisted by
          vNext activity events and are tracked as DB10 parity gaps rather than
          being synthesized on this page.
        </p>
      </Card>
    </div>
  );
}
