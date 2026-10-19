import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {listMyProjectInstances} from "@/modules/projects/member-service";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  NotificationList, type NotificationListItem,
} from "@/components/activity/notification-list";
import { NotificationToolbar } from "@/components/activity/notification-toolbar";
import { AnnouncementFeed } from "@/components/announcements/announcement-feed";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { mentorInboxQuerySchema, mentorInboxPageHref } from "@/modules/activity/mentor-notifications-model";
import { getMentorPersonalInbox } from "@/modules/activity/mentor-notifications-service";
import { listMyMentorProjectAttention } from "@/modules/projects/mentor-attention-service";
import {mentorAttentionKindSchema,mentorAttentionProjectSchema,mentorAttentionOrderSchema,selectMentorAttention,mentorAttentionProjectOptions} from "@/modules/projects/mentor-attention-kind-model";

export const dynamic = "force-dynamic";
const MENTOR_INBOX = "/mentor/notifications";
type Params = {
  view?: string | string[];
  kind?: string | string[];
  projectId?: string | string[];
  attentionOrder?: string | string[];
  beforeCreatedAt?: string | string[];
  beforeId?: string | string[];
};
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MentorNotificationsPage({
  searchParams,
}: { searchParams: Promise<Params> }) {
  const raw = await searchParams;
  const parsed = mentorInboxQuerySchema.safeParse({
    view:first(raw.view) ?? undefined,
    beforeCreatedAt:first(raw.beforeCreatedAt) ?? undefined,
    beforeId:first(raw.beforeId) ?? undefined,
  });
  const kind=mentorAttentionKindSchema.safeParse(first(raw.kind)??"ALL");
  const projectId=mentorAttentionProjectSchema.safeParse(first(raw.projectId)??undefined);
  const attentionOrder=mentorAttentionOrderSchema.safeParse(first(raw.attentionOrder)??"RECENT");
  if (!parsed.success||!kind.success||!projectId.success||!attentionOrder.success) return <section role="alert" className="space-y-3">
    <h1 className="font-semibold text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Invalid notification filters</h1>
    <Link href={MENTOR_INBOX} className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Return to newest notifications</Link>
  </section>;

  const context = await getCurrentRequestContext();
  const failedSources: string[] = [];
  const inbox = await getMentorPersonalInbox(context,parsed.data).catch(() => {
    failedSources.push("Personal notifications");
    return null;
  });
  // Personal messages remain accessible even when the optional Projects module
  // is disabled. Never treat a missing project policy as a successful empty feed.
  const announcementsEnabled = announcementsRuntimeEnabled();
  const [accessResult, announcementResult] = await Promise.allSettled([
    resolveOptionalModuleAccess(context),
    announcementsEnabled
      ? listVisibleAnnouncementsForMembership(context) : Promise.resolve([]),
  ]);
  const projectAccess = accessResult.status === "fulfilled" ? accessResult.value : null;
  if (accessResult.status === "rejected") failedSources.push("Project access");
  const announcements = announcementResult.status === "fulfilled" ? announcementResult.value : [];
  if (announcementResult.status === "rejected") failedSources.push("Announcements");
  const alerts = projectAccess?.projects.enabled
    ? await listMyMentorProjectAttention(context).catch(() => {
      failedSources.push("Project attention");
      return [];
    }) : [];
  const assigned = projectAccess?.projects.enabled
    ? await listMyProjectInstances(context).then(rows=>rows.filter(row=>row.memberRole==="MENTOR"))
      .catch(() => { failedSources.push("Assigned projects"); return []; })
    : [];
  const projectOptions=mentorAttentionProjectOptions(alerts,
    assigned.map(row=>({id:row.project.id,title:row.project.title})));
  const visibleAlerts=selectMentorAttention(alerts,kind.data,projectId.data,attentionOrder.data);
  const items:NotificationListItem[] = (inbox?.page.items ?? []).map(({notification,event})=>({
    id:notification.id,title:notification.title,body:notification.body,
    actionHref:notification.actionHref,
    readAt:notification.readAt?.toISOString()??null,
    createdAt:notification.createdAt.toISOString(),
    module:event.module,importance:event.importance,
  }));
  const nextHref = inbox?.page.nextCursor
    ? mentorInboxPageHref(inbox.query.view,inbox.page.nextCursor) : null;
  return <div className="min-w-0 max-w-full space-y-8">
    <PageHeader title="Notifications"
      description="Announcements, submissions waiting for review, stalled projects, and meetings coming up soon." />
    {failedSources.length ? <div role="alert" className="rounded-xl border border-border bg-surface p-4">
      <h2 className="font-semibold text-foreground">Some notification sources are unavailable</h2>
      <p className="mt-1 text-sm text-body">
        Could not load: {failedSources.join(", ")}. Everything else below is current, but this page may be incomplete.
      </p>
      <Link href={MENTOR_INBOX}
        className="mt-3 inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Retry sources</Link>
    </div> : null}
    <AnnouncementFeed enabled={announcementsEnabled}
      items={announcements.map(item=>({
        id:item.id,title:item.title,message:item.message,
        senderType:item.senderType,receiverType:item.receiverType,
        isPinned:item.isPinned,createdAt:item.createdAt,
      }))} />
    <section aria-labelledby="mentor-attention" className="space-y-3">
      <h2 id="mentor-attention" className="text-lg font-semibold text-foreground">
        Project attention ({visibleAlerts.length} of {alerts.length})
      </h2>
      <form method="get" action={MENTOR_INBOX}
        className="flex flex-wrap items-end gap-3 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
        <label className="grid gap-1 text-sm font-semibold">Project with recorded attention
          <Select name="projectId" defaultValue={projectId.data??""}
            className="min-h-11 sm:min-h-9 max-w-full rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="">All assigned Projects</option>
            {projectOptions.map(({id,title})=><option key={id} value={id}>{title}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Attention order
          <Select name="attentionOrder" defaultValue={attentionOrder.data}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="RECENT">Most recent recorded first</option>
            <option value="REVIEW_FIRST">Reviews and requests first</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Attention type
          <Select name="kind" defaultValue={kind.data}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
            <option value="ALL">All</option><option value="REVIEW">Reviews</option>
            <option value="STALLED">Stalled</option>
            <option value="REQUESTED">Meeting requests</option>
            <option value="MEETING_SOON">Meetings soon</option>
          </Select>
        </label>
        <Button type="submit" variant="primary">
          Filter attention
        </Button>
        <Link href={MENTOR_INBOX} className="inline-flex min-h-11 items-center text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear</Link>
      </form>
      {!projectAccess?.projects.enabled
        ? <p role="status" className="border-b border-border pb-4 text-sm text-body">
            Projects access is disabled; project attention is unavailable.
          </p>
        : visibleAlerts.length === 0
          ? <p className="border-b border-border pb-4 text-sm text-body">
              {failedSources.length ? "No project alerts are visible, but some notification sources could not be checked." : "Nothing needs your attention right now."}
            </p>
          : <div className="grid">{visibleAlerts.map(alert=>
              <Link key={alert.key} href={alert.href}
                className="min-h-11 block border-b border-border py-4 transition hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{alert.title}</h3>
                  <StatusBadge tone={alert.kind === "STALLED" ? "error" :
                    alert.kind === "REVIEW" || alert.kind === "REQUESTED" ? "warning" : "info"}>
                    {alert.kind === "MEETING_SOON" ? "Upcoming meeting" :
                      alert.kind === "REQUESTED" ? "Meeting requested" :
                      alert.kind === "REVIEW" ? "Needs review" : "Stalled"}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-body">{alert.description}</p>
              </Link>)}</div>}
    </section>
    <section aria-labelledby="mentor-personal-notifications" className="space-y-4">
      <h2 id="mentor-personal-notifications" className="text-lg font-semibold text-foreground">
        Personal notifications
      </h2>
      {inbox ? <NotificationToolbar view={inbox.query.view} unreadCount={inbox.unreadCount}
        baseHref={MENTOR_INBOX} markAllEndpoint="/api/mentor/notifications/read-all"
        confirmMarkAll /> : null}
      {inbox?.cursor.invalid
        ? <div role="alert" className="rounded-xl border border-border bg-surface p-4 text-sm text-foreground">
            The notification page link is invalid.{" "}
            <Link href={mentorInboxPageHref(inbox?.query.view ?? parsed.data.view)}
              className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Return to newest notifications
            </Link>
          </div>
        : <>
            <NotificationList items={items} readEndpoint="/api/mentor/notifications"
              emptyText={!inbox ? "Personal notifications are temporarily unavailable." : inbox.query.view === "unread" ? "No unread notifications." : "No personal notifications yet."} />
            {nextHref ? <div className="flex justify-center">
              <Link href={nextHref}
                className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Older notifications
              </Link>
            </div> : null}
          </>}
    </section>
  </div>;
}
