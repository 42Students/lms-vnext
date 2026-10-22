import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getDb } from "@/db/client";
import { colleges } from "@/db/schema";
import { notificationDeliveryOutbox } from "@/db/schema/activity";
import { isSuperAdmin } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { NotificationDeliveryActions } from "@/components/announcements/notification-delivery-actions";

export default async function NotificationDeliveryHistoryPage() {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context) || context.user.platformStatus !== "ACTIVE") {
    redirect("/dashboard");
  }
  const collegeId = context.adminScope?.collegeId;
  if (!collegeId) {
    return <div className="space-y-4">
      <PageHeader title="Notification delivery history" description="Choose a college in the header above to review its notification deliveries." />
      <Link href="/admin/announcements" className="text-primary-text underline">Back to announcements</Link>
    </div>;
  }
  const db = getDb();
  const [college] = await db.select({ organizationId: colleges.organizationId })
    .from(colleges).where(eq(colleges.id, collegeId)).limit(1);
  if (!college) {
    return <ErrorState title="College not found" description="The selected college is no longer available." />;
  }
  requirePermission(context, "courses.manage", {
    collegeId, organizationId: college.organizationId,
  });
  const ready = await db.execute<{ ready: boolean }>(sql`
    select to_regclass('public.notification_delivery_outbox') is not null as ready
  `);
  if (!ready.rows[0]?.ready) {
    return <div className="space-y-4">
      <PageHeader title="Notification delivery history" description="Delivery tracking is not enabled for this deployment." />
      <p role="status">The notification delivery outbox is unavailable. No delivery changes were made.</p>
      <Link href="/admin/announcements" className="text-primary-text underline">Back to announcements</Link>
    </div>;
  }
  let entries: Array<{
    id: string; deliveryStatus: string; scheduledAt: Date; deliveredAt: Date | null;
    deliveryAttempts: number; deliveryError: string | null; createdAt: Date;
  }>;
  try {
    entries = await db.select({
      id: notificationDeliveryOutbox.id,
      deliveryStatus: notificationDeliveryOutbox.deliveryStatus,
      scheduledAt: notificationDeliveryOutbox.scheduledAt,
      deliveredAt: notificationDeliveryOutbox.deliveredAt,
      deliveryAttempts: notificationDeliveryOutbox.deliveryAttempts,
      deliveryError: notificationDeliveryOutbox.deliveryError,
      createdAt: notificationDeliveryOutbox.createdAt,
    }).from(notificationDeliveryOutbox).where(and(
      eq(notificationDeliveryOutbox.collegeId, collegeId),
      eq(notificationDeliveryOutbox.organizationId, college.organizationId),
      isNull(notificationDeliveryOutbox.deletedAt),
    )).orderBy(desc(notificationDeliveryOutbox.createdAt), desc(notificationDeliveryOutbox.id)).limit(50);
  } catch {
    return <ErrorState title="Could not load notification deliveries" description="The delivery history is temporarily unavailable. Retry the page to load current statuses." />;
  }
  const formatTime = (value: Date) => value.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
  }) + " IST";
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Notification delivery history" description="The 50 most recently created delivery records in the selected college. Statuses reflect persisted delivery, not provider acceptance." />
    <Link href="/admin/announcements" className="inline-flex min-h-11 items-center text-primary-text underline">Back to announcements</Link>
    {entries.length === 0 ? <p role="status">No notification deliveries recorded for this college.</p> : (
      <div className="divide-y divide-border border-y border-border">
        {entries.map(entry => <article key={entry.id} className="space-y-2 py-4">
          <h2 className="text-sm font-semibold">Delivery {entry.id}</h2>
          <p className="text-sm">Status: <strong>{entry.deliveryStatus}</strong> · Attempts: {entry.deliveryAttempts}</p>
          <p className="text-sm">Scheduled {formatTime(entry.scheduledAt)}
            {entry.deliveredAt ? " · Delivered " + formatTime(entry.deliveredAt) : ""}
          </p>
          {entry.deliveryError ? <p role="alert" className="text-sm">Delivery error: {entry.deliveryError}</p> : null}
          <NotificationDeliveryActions id={entry.id} collegeId={collegeId} deliveryStatus={entry.deliveryStatus} />
        </article>)}
      </div>
    )}
  </div>;
}
