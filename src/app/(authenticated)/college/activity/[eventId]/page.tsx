import { PageBackLink } from "@/components/ui/page-back-link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Disclosure } from "@/components/ui/disclosure";
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
  return <div className="min-w-0 overflow-x-clip space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
    <PageHeader title="Activity detail"
      description={event.summary}
      actions={<PageBackLink href="/college/activity" label="Back to Activity Log"/>} />
    <dl className="grid min-w-0 gap-x-[var(--lms-space-6)] gap-y-[var(--lms-space-4)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] text-[var(--lms-font-base)] sm:grid-cols-2">
      <div><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Occurred (IST)</dt>
        <dd className="mt-1 text-body">{date}</dd></div>
      <div><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Actor</dt>
        <dd className="mt-1 min-w-0 break-words [overflow-wrap:anywhere] text-body">{actor?.displayName ?? actor?.email ?? "System"} ({actor?.id ?? "Unrecorded"})</dd></div>
      <div><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Event type</dt>
        <dd className="mt-1 break-words [overflow-wrap:anywhere] text-body">{event.eventType}</dd></div>
      <div><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Importance</dt>
        <dd className="mt-1 text-body"><StatusBadge tone={event.importance==="CRITICAL"?"error":event.importance==="HIGH"?"warning":"neutral"}>{event.importance}</StatusBadge></dd></div>
      <div><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Entity type</dt>
        <dd className="mt-1 text-body">{event.subjectType}</dd></div>
      <div><dt className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Entity reference</dt>
        <dd className="mt-1 break-words [overflow-wrap:anywhere] text-body">{event.subjectLabel ?? event.subjectId}</dd></div>
    </dl>
    <section className="min-w-0">
      <Disclosure title="Sanitized event metadata" className="border-t-0" contentClassName="min-w-0 pb-[var(--lms-space-2)]">
      <pre className="mt-[var(--lms-space-2)] max-w-full overflow-x-auto overscroll-x-contain whitespace-pre-wrap break-words border-y border-[var(--lms-canvas-border)] bg-transparent px-0 py-[var(--lms-space-3)] text-xs leading-5 text-body">
        {JSON.stringify(event.metadata, null, 2)}
      </pre>
      </Disclosure>
    </section>
  </div>;
}
