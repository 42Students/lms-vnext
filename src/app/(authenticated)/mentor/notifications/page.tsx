import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { NotificationList, type NotificationListItem } from "@/components/activity/notification-list";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listOwnNotifications } from "@/modules/activity/notification-service";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { listMyMentorProjectAttention } from "@/modules/projects/mentor-attention-service";

export const dynamic = "force-dynamic";

export default async function MentorNotificationsPage() {
  const context=await getCurrentRequestContext();
  // Shared notifications must remain readable even if the college disables
  // the optional Projects module.
  const [inbox, projectAccess] = await Promise.all([
    listOwnNotifications(context,{limit:60}),
    resolveOptionalModuleAccess(context).catch(()=>null),
  ]);
  const alerts=projectAccess?.projects.enabled===true
    ? await listMyMentorProjectAttention(context) : [];
  const items:NotificationListItem[]=inbox.map(({notification,event})=>({
    id:notification.id,title:notification.title,body:notification.body,
    actionHref:notification.actionHref,
    readAt:notification.readAt?.toISOString()??null,
    createdAt:notification.createdAt.toISOString(),
    module:event.module,importance:event.importance,
  }));
  return <div className="space-y-8">
    <PageHeader eyebrow="Mentor" title="Notifications"
      description="Personal notifications, project reviews and meetings that need your attention." />
    <section aria-labelledby="mentor-attention" className="space-y-3">
      <h2 id="mentor-attention" className="text-lg font-semibold text-foreground">
        Project attention ({alerts.length})
      </h2>
      {alerts.length
        ? <div className="grid gap-3">{alerts.map(alert=>
          <Link key={alert.key} href={alert.href}
            className="block rounded-xl border border-border bg-surface p-4 transition hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-foreground">{alert.title}</h3>
              <StatusBadge tone={alert.kind==="STALLED"?"error":
                alert.kind==="REVIEW"||alert.kind==="REQUESTED"?"warning":"info"}>
                {alert.kind==="MEETING_SOON"?"Upcoming meeting":
                  alert.kind==="REQUESTED"?"Requested":alert.kind}
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm text-body">{alert.description}</p>
          </Link>)}</div>
        : <div className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
            {projectAccess?.projects.enabled===true
              ? "No project items need your attention right now."
              : "Project alerts are unavailable while Projects access is disabled."}
          </div>}
    </section>
    <section aria-labelledby="mentor-personal-notifications" className="space-y-3">
      <h2 id="mentor-personal-notifications" className="text-lg font-semibold text-foreground">
        Personal notifications
      </h2>
      <NotificationList items={items} />
    </section>
  </div>;
}
