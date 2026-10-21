import Link from "next/link";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { listActivityEvents } from "@/modules/activity/service";

/** Reusable, tenant-authorized event trail for any record drawer or page.
 * The service enforces membership scope before returning the event rows.
 */
export async function SubjectEventHistory({
  context, subjectType, subjectId, limit = 10,
}: {
  context: RequestContext;
  subjectType: string;
  subjectId: string;
  limit?: number;
}) {
  const result = await listActivityEvents(context, {
    subjectType, subjectId, limit: Math.max(1, Math.min(limit, 25)),
  }).then(value => ({ok: true as const, value}))
    .catch(() => ({ok: false as const, value: null}));
  const query = new URLSearchParams({
    view: "all", range: "ALL", subjectType, subjectId,
  });
  const historyHref = (isSuperAdmin(context) ? "/admin/audit" : "/activity") +
    "?" + query.toString();
  return <section aria-label="Record history" className="min-w-0 space-y-3 border-t border-border pt-5">
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Record history</h2>
      <Link href={historyHref} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
        View full history
      </Link>
    </div>
    {!result.ok ? <p role="alert" className="text-sm text-body">
      Activity history could not be loaded. Retry from the full history link.
    </p> : result.value.items.length === 0 ? <p className="text-sm text-muted-foreground">
      No recorded changes for this item.
    </p> : <ol className="divide-y divide-border border-y border-border">
      {result.value.items.map(item => <li key={item.event.id}
        className="min-w-0 space-y-1 px-2 py-3 text-sm">
        <Link href={"/activity/"+encodeURIComponent(item.event.id)}
          className="block break-words font-semibold text-primary-text hover:underline">
          {item.event.summary}
        </Link>
        <p className="text-xs text-muted-foreground">
          {item.actor?.displayName ?? "System"} · <time dateTime={item.event.occurredAt.toISOString()}>
            {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(item.event.occurredAt)} IST
          </time>
        </p>
      </li>)}
    </ol>}
  </section>;
}
