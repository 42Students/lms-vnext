import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { TpoMarkOwnNotificationRead } from "@/components/placements/tpo-mark-own-notification-read";
import { listTpoOwnNotifications } from "@/modules/placements/tpo-own-notification-service";
import { tpoOwnNotificationQuerySchema } from "@/modules/placements/tpo-own-notification-model";

type SearchParams = { status?: string | string[]; q?: string | string[]; page?: string | string[] };
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const time = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
});

export default async function TpoOwnNotificationsPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const raw = await searchParams;
  const parsed = tpoOwnNotificationQuerySchema.safeParse({
    ...(first(raw.status) ? { status: first(raw.status) } : {}),
    ...(first(raw.q) ? { q: first(raw.q) } : {}),
    ...(first(raw.page) ? { page: first(raw.page) } : {}),
  });
  if (!parsed.success) return (
    <section role="alert" className="rounded-xl border border-border bg-surface p-6">
      <h1 className="font-semibold text-foreground">Invalid notification filters</h1>
      <Link href="/tpo/messages/notifications" className="mt-3 inline-block font-semibold text-primary-text">
        Clear filters
      </Link>
    </section>
  );
  const inbox = await listTpoOwnNotifications(context, parsed.data);
  const href = (page: number) => "/tpo/messages/notifications?" +
    new URLSearchParams({ status: inbox.query.status, q: inbox.query.q, page: String(page) }).toString();
  return (
    <div className="space-y-6">
      <Link href="/tpo/messages" className="text-sm font-semibold text-primary-text hover:underline">
        ← All communication records
      </Link>
      <PageHeader eyebrow="TPO · Communication" title="My placement notifications"
        description="Own persisted in-app placement deliveries; no recruiter-message bodies or outbound delivery status is displayed." />
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-foreground">Filter notifications</h2>
        <form action="/tpo/messages/notifications" method="get"
          className="mt-3 flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm font-semibold text-body">Read status
            <select name="status" defaultValue={inbox.query.status}
              className="min-h-10 rounded-md border border-border bg-surface px-3">
              <option value="ALL">All</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Event type
            <input name="q" type="search" maxLength={100} defaultValue={inbox.query.q}
              className="min-h-10 rounded-md border border-border bg-surface px-3" />
          </label>
          <button type="submit" className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
            Apply filters
          </button>
          <Link href="/tpo/messages/notifications" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">
            Clear
          </Link>
        </form>
      </section>
      <section aria-label="Placement notification deliveries" className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-5">
          <h2 className="font-semibold text-foreground">My deliveries ({inbox.total})</h2>
          <p className="mt-1 text-sm text-body">
            Only safe event labels and recorded timestamps are shown, not message contents.
          </p>
        </div>
        {inbox.items.length === 0 ? (
          <p role="status" className="p-6 text-sm text-body">
            No placement notifications match these filters for your account.
            Other TPO members may have different deliveries.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {inbox.items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs text-body">
                    <time dateTime={item.recordedAt}>
                      {time.format(new Date(item.recordedAt))} IST
                    </time>
                    {" · "}{item.read ? "Read" : "Unread"}
                  </p>
                </div>
                {!item.read ? <TpoMarkOwnNotificationRead notificationId={item.id} /> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <nav aria-label="Notification pages" className="flex items-center justify-between gap-3 text-sm">
        <span className="text-body">Page {inbox.page} of {inbox.totalPages}</span>
        <div className="flex gap-3">
          {inbox.page > 1 ? <Link href={href(inbox.page - 1)} className="font-semibold text-primary-text">← Previous</Link> : null}
          {inbox.page < inbox.totalPages ? <Link href={href(inbox.page + 1)} className="font-semibold text-primary-text">Next →</Link> : null}
        </div>
      </nav>
    </div>
  );
}
