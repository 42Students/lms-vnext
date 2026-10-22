import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { listScopedAdminNotificationPage } from "@/modules/activity/notification-service";
import { PageHeader } from "@/components/ui/page-header";

type Query = Record<string, string | string[] | undefined>;
const statuses = ["SENT", "SCHEDULED", "PROCESSING", "FAILED", "DELETED"] as const;
type DeliveryStatus = (typeof statuses)[number];

function metaText(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function formatIst(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST";
}

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function NotificationDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context) || context.user.platformStatus !== "ACTIVE") {
    redirect("/dashboard");
  }
  const query = await searchParams;
  const rawStatus = single(query.status);
  const status: DeliveryStatus | undefined =
    rawStatus && statuses.some((value) => value === rawStatus)
      ? (rawStatus as DeliveryStatus)
      : undefined;
  const pageValue = single(query.page) ?? "0";
  const pageNo = /^\d{1,5}$/.test(pageValue) ? Number(pageValue) : NaN;
  if (
    (rawStatus && !status) ||
    !Number.isSafeInteger(pageNo) ||
    (Array.isArray(query.status) || Array.isArray(query.page))
  ) {
    return (
      <main className="space-y-4">
        <PageHeader title="Notification delivery" description="Review scheduled and completed notification delivery." />
        <p role="alert">Invalid delivery filters. <Link href="/admin/notification-delivery" className="underline">Reset filters</Link></p>
      </main>
    );
  }
  const result = await listScopedAdminNotificationPage(context, {
    deliveryStatus: status,
    pageNo,
    pageSize: 50,
  });
  const urlFor = (nextPage: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (nextPage > 0) params.set("page", String(nextPage));
    const suffix = params.toString();
    return "/admin/notification-delivery" + (suffix ? "?" + suffix : "");
  };
  const first = pageNo * result.pagination.pageSize + 1;
  const last = Math.min((pageNo + 1) * result.pagination.pageSize, result.pagination.total);
  return (
    <main className="min-w-0 space-y-6">
      <PageHeader title="Notification delivery" description="Review delivery states separately from announcement visibility and read receipts." />
      <p className="text-sm text-muted-foreground">
        <Link href="/admin/announcements" className="underline">Back to announcements</Link>
      </p>
      <section aria-label="Delivery status filters" className="space-y-2">
        <h2 className="text-lg font-semibold">Delivery history</h2>
        <nav aria-label="Filter delivery status" className="flex flex-wrap gap-2">
          <Link href="/admin/notification-delivery" aria-current={!status ? "page" : undefined} className="inline-flex min-h-11 items-center rounded border px-3 text-sm">All</Link>
          {statuses.map((value) => (
            <Link key={value} href={"/admin/notification-delivery?status=" + value}
              aria-current={status === value ? "page" : undefined}
              className="inline-flex min-h-11 items-center rounded border px-3 text-sm">
              {value} ({result.deliveryStatusCounts[value] ?? 0})
            </Link>
          ))}
        </nav>
      </section>
      <p role="status" className="text-sm text-muted-foreground">
        {result.pagination.total === 0 ? "No matching notification deliveries." :
          `Showing ${first}–${last} of ${result.pagination.total} notification deliveries.`}
      </p>
      <ol className="divide-y border-y">
        {result.items.map((item) => (
          <li key={item.id} className="min-w-0 space-y-2 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm">{item.deliveryStatus}</strong>
              <time className="text-xs text-muted-foreground" dateTime={item.occurredAt.toISOString()}>
                {item.occurredAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST
              </time>
            </div>
            <p className="break-words font-medium">{item.subjectLabel || item.summary || "Notification"}</p>
            {metaText(item.metadata, "scheduledAt") ? (
              <p className="text-xs text-muted-foreground">Scheduled for: {formatIst(metaText(item.metadata, "scheduledAt") ?? "")}</p>
            ) : null}
            {metaText(item.metadata, "deliveryError") ? (
              <p className="text-xs text-red-700" role="alert">Delivery error: {metaText(item.metadata, "deliveryError")}</p>
            ) : null}
            <p className="break-all text-xs text-muted-foreground">Event: {item.id}</p>
            <p className="text-xs text-muted-foreground">
              Delivery history is read-only here. Retry and cancel require the associated outbox delivery ID and an authorized, current-state transition; an event ID is not a delivery ID.
            </p>
          </li>
        ))}
      </ol>
      <nav aria-label="Delivery history pages" className="flex flex-wrap gap-3">
        {pageNo > 0 ? <Link href={urlFor(pageNo - 1)} className="inline-flex min-h-11 items-center rounded border px-4">Newer</Link> : null}
        {last < result.pagination.total ? <Link href={urlFor(pageNo + 1)} className="inline-flex min-h-11 items-center rounded border px-4">Older</Link> : null}
      </nav>
    </main>
  );
}
