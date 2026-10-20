import { PageBackLink } from "@/components/ui/page-back-link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCollegeActivityDetail } from "@/modules/activity/college-activity-service";

export default async function CollegeActivityDetailPage({
  params,
}: { params: Promise<{ eventId: string }> }) {
  const context = await getCurrentRequestContext();
  const { eventId } = await params;
  const { event, actor } = await getCollegeActivityDetail(context, eventId);
  const date = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full", timeStyle: "medium", timeZone: "Asia/Kolkata",
  }).format(event.occurredAt);
  return <div className="min-w-0 overflow-x-clip space-y-6">
    <PageHeader title="Activity detail"
      description={event.summary}
      actions={<PageBackLink href="/college/activity" label="Back to Activity Log"/>} />
    <dl className="grid min-w-0 gap-4 border-y border-border py-4 text-sm md:grid-cols-2">
      <div><dt className="font-semibold text-muted-foreground">Occurred (IST)</dt>
        <dd className="mt-1 text-body">{date}</dd></div>
      <div><dt className="font-semibold text-muted-foreground">Actor</dt>
        <dd className="mt-1 text-body">{actor?.displayName ?? actor?.email ?? "System"} ({actor?.id ?? "Unrecorded"})</dd></div>
      <div><dt className="font-semibold text-muted-foreground">Event type</dt>
        <dd className="mt-1 break-all text-body">{event.eventType}</dd></div>
      <div><dt className="font-semibold text-muted-foreground">Importance</dt>
        <dd className="mt-1 text-body"><StatusBadge tone={event.importance==="CRITICAL"?"error":event.importance==="HIGH"?"warning":"neutral"}>{event.importance}</StatusBadge></dd></div>
      <div><dt className="font-semibold text-muted-foreground">Entity type</dt>
        <dd className="mt-1 text-body">{event.subjectType}</dd></div>
      <div><dt className="font-semibold text-muted-foreground">Entity reference</dt>
        <dd className="mt-1 break-all text-body">{event.subjectLabel ?? event.subjectId}</dd></div>
    </dl>
    <section className="border-t border-border pt-5">
      <h2 className="m-0 text-base font-semibold text-foreground">Sanitized event metadata</h2>
      <pre className="mt-3 overflow-x-auto overscroll-x-contain whitespace-pre-wrap break-words rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4 text-xs text-body">
        {JSON.stringify(event.metadata, null, 2)}
      </pre>
    </section>
  </div>;
}
