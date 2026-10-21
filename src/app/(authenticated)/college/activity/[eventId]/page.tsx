import { PageBackLink } from "@/components/ui/page-back-link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Disclosure } from "@/components/ui/disclosure";

function compactActivityMeta(value:unknown):string{
 const raw=typeof value==="string"?value:JSON.stringify(value);
 const safe=raw??"";
 return safe.length>160?safe.slice(0,159)+"…":safe;
}
function activityDetails(metadata:unknown):[string,string][]{
 if(!metadata||typeof metadata!=="object"||Array.isArray(metadata))return [];
 return Object.entries(metadata as Record<string,unknown>)
  .filter(([,value])=>value!==null&&value!==undefined&&value!=="")
  .slice(0,14)
  .map(([key,value])=>[key.replace(/([a-z])([A-Z])/g,"$1 $2").replace(/_/g," "),compactActivityMeta(value)]);
}

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
  const compact=activityDetails(event.metadata);
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
    {compact.length ? <section className="min-w-0 space-y-3" aria-label="Activity details">
      <h2 className="text-base font-semibold text-[var(--lms-heading)]">Details</h2>
      <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
        {compact.map(([label,value],index)=><div key={label+"-"+index} className="min-w-0">
          <dt className="break-words text-xs font-semibold capitalize text-muted-foreground">{label}</dt>
          <dd className="mt-1 break-words text-sm text-body">{value}</dd>
        </div>)}
      </dl>
      <p className="text-xs text-muted-foreground">Showing up to 14 details, shortened to 160 characters each. Expand sanitized metadata for the complete permitted record.</p>
    </section> : null}
    <section className="min-w-0">
      <Disclosure title="Sanitized event metadata" className="border-t-0" contentClassName="min-w-0 pb-[var(--lms-space-2)]">
      <pre className="mt-[var(--lms-space-2)] max-w-full overflow-x-auto overscroll-x-contain whitespace-pre-wrap break-words border-y border-[var(--lms-canvas-border)] bg-transparent px-0 py-[var(--lms-space-3)] text-xs leading-5 text-body">
        {JSON.stringify(event.metadata, null, 2)}
      </pre>
      </Disclosure>
    </section>
  </div>;
}
