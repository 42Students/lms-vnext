import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
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
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="College Admin · Activity Log" title="Activity detail"
      description={event.summary}
      actions={<Link href="/college/activity" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Back to Activity Log
      </Link>} />
    <dl className="grid gap-4 rounded-xl border border-border bg-surface p-5 text-sm sm:grid-cols-2">
      <div><dt className="font-semibold text-muted-foreground">Occurred (IST)</dt>
        <dd className="mt-1 text-body">{date}</dd></div>
      <div><dt className="font-semibold text-muted-foreground">Actor</dt>
        <dd className="mt-1 text-body">{actor?.displayName ?? actor?.email ?? "System"} ({actor?.id ?? "Unrecorded"})</dd></div>
      <div><dt className="font-semibold text-muted-foreground">Event type</dt>
        <dd className="mt-1 break-all text-body">{event.eventType}</dd></div>
      <div><dt className="font-semibold text-muted-foreground">Importance</dt>
        <dd className="mt-1 text-body">{event.importance}</dd></div>
      <div><dt className="font-semibold text-muted-foreground">Entity type</dt>
        <dd className="mt-1 text-body">{event.subjectType}</dd></div>
      <div><dt className="font-semibold text-muted-foreground">Entity reference</dt>
        <dd className="mt-1 break-all text-body">{event.subjectLabel ?? event.subjectId}</dd></div>
    </dl>
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="m-0 text-base font-semibold text-foreground">Sanitized event metadata</h2>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-4 text-xs text-body">
        {JSON.stringify(event.metadata, null, 2)}
      </pre>
    </section>
  </div>;
}
