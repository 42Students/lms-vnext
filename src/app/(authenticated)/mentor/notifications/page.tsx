import { Suspense } from "react";
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
import { Alert } from "@/components/ui/alert";
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

function MentorNotificationsLoading() {
  return <div className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading notifications">
    <PageHeader title="Notifications" />
    <div className="space-y-3" aria-hidden="true">
      {[1,2,3].map(value=><div key={value} className="flex items-start gap-3 border-b border-border py-4">
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
        <div className="w-full space-y-2"><div className="h-4 w-2/5 animate-pulse rounded bg-muted"/>
          <div className="h-3 w-4/5 animate-pulse rounded bg-muted"/></div>
      </div>)}
    </div>
  </div>;
}

export default function MentorNotificationsPage({searchParams}:{searchParams:Promise<Params>}) {
  return <Suspense fallback={<MentorNotificationsLoading />}>
    <MentorNotificationsContent searchParams={searchParams}/>
  </Suspense>;
}

async function MentorNotificationsContent({
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
  if (!parsed.success||!kind.success||!projectId.success||!attentionOrder.success) return <section role="alert" className="min-w-0 max-w-full space-y-3">
    <PageHeader title="Invalid notification filters" />
    <Link href={MENTOR_INBOX} className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lms-inline-link hover:text-[var(--lms-primary-text)]">Return to newest notifications</Link>
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
  // Legacy priority: announcements first, then reviews/meeting requests,
  // stalled projects, and finally meetings coming up soon. Timestamp is the
  // tie-breaker within a priority rather than the only sort key.
  const visibleAlerts=selectMentorAttention(alerts,kind.data,projectId.data,attentionOrder.data)
    .slice().sort((a,b)=>{
      const rank={REVIEW:0,REQUESTED:1,STALLED:2,MEETING_SOON:3} as const;
      return rank[a.kind]-rank[b.kind] ||
        b.occurredAt.localeCompare(a.occurredAt) || a.key.localeCompare(b.key);
    });
  const attentionFiltered=Boolean(projectId.data)||kind.data!=="ALL"||attentionOrder.data!=="RECENT";
  const items:NotificationListItem[] = (inbox?.page.items ?? []).map(({notification,event})=>({
    id:notification.id,title:notification.title,body:notification.body,
    actionHref:notification.actionHref,
    readAt:notification.readAt?.toISOString()??null,
    createdAt:notification.createdAt.toISOString(),
    module:event.module,importance:event.importance,
  }));
  const nextHref = inbox?.page.nextCursor
    ? mentorInboxPageHref(inbox.query.view,inbox.page.nextCursor) : null;
  const allRelevantFailed=!inbox &&
    (!announcementsEnabled || announcementResult.status==="rejected") &&
    (!projectAccess?.projects.enabled || failedSources.includes("Project attention"));
  const allSourcesEmpty = failedSources.length===0 && items.length===0 &&
    visibleAlerts.length===0 && announcements.length===0 && !nextHref;
  const retryParams = new URLSearchParams();
  if(parsed.data.view!=="all")retryParams.set("view",parsed.data.view);
  if(kind.data!=="ALL")retryParams.set("kind",kind.data);
  if(projectId.data)retryParams.set("projectId",projectId.data);
  if(attentionOrder.data!=="RECENT")retryParams.set("attentionOrder",attentionOrder.data);
  const retryHref = MENTOR_INBOX+(retryParams.size?"?"+retryParams.toString():"");
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title="Notifications"
      description="Announcements, submissions waiting for review, stalled projects, and meetings coming up soon." />
    {failedSources.length ? <Alert tone={allRelevantFailed?"error":"warning"} role="alert">
      <h2 className="m-0 text-[var(--lms-font-md)] font-semibold leading-6 text-[var(--lms-heading)]">
        {allRelevantFailed?"We couldn't load your notifications.":"Some notification sources are unavailable"}
      </h2>
      <p className="mt-1 text-sm text-body leading-[22px]">
        {allRelevantFailed?"No verified notification source could be loaded.":`Could not load: ${failedSources.join(", ")}. Everything else below is current, but this page may be incomplete.`}
      </p>
      <Link href={retryHref}
        className="mt-3 inline-flex min-h-11 min-[768px]:min-h-9 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">Retry sources</Link>
    </Alert> : null}
    {allSourcesEmpty?<div role="status" className="flex items-center gap-3 border-b border-border py-6">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        className="h-8 w-8 shrink-0 text-success">
        <circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>
      </svg>
      <p className="text-sm font-semibold text-body">Nothing needs your attention right now.</p>
    </div>:null}
    {!allSourcesEmpty&&!allRelevantFailed?<AnnouncementFeed enabled={announcementsEnabled}
      items={announcements.map(item=>({
        id:item.id,title:item.title,message:item.message,
        senderType:item.senderType,receiverType:item.receiverType,
        isPinned:item.isPinned,createdAt:item.createdAt,
      }))} />:null}
    {!allSourcesEmpty&&!allRelevantFailed?<section aria-labelledby="mentor-attention" className="min-w-0 space-y-3">
      <h2 id="mentor-attention" className="font-semibold text-lg leading-7 text-[var(--lms-heading)]">
        Project attention ({visibleAlerts.length} of {alerts.length})
      </h2>
      <form method="get" action={MENTOR_INBOX} role="search" aria-label="Mentor attention filters"
        className="grid min-w-0 items-end gap-3 border-b border-border pb-[var(--lms-space-4)] md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto_auto]">
        <label className="grid min-w-0 gap-1 text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Project with recorded attention
          <Select name="projectId" defaultValue={projectId.data??""}
            className="min-h-11 max-w-full min-[768px]:min-h-9">
            <option value="">All assigned Projects</option>
            {projectOptions.map(({id,title})=><option key={id} value={id}>{title}</option>)}
          </Select>
        </label>
        <label className="grid min-w-0 gap-1 text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Attention order
          <Select name="attentionOrder" defaultValue={attentionOrder.data}
            className="min-h-11 min-[768px]:min-h-9">
            <option value="RECENT">Most recent recorded first</option>
            <option value="REVIEW_FIRST">Reviews and requests first</option>
          </Select>
        </label>
        <label className="grid min-w-0 gap-1 text-[var(--lms-font-sm)] font-semibold text-[var(--lms-neutral-400)] leading-4">Attention type
          <Select name="kind" defaultValue={kind.data}
            className="min-h-11 min-[768px]:min-h-9">
            <option value="ALL">All</option><option value="REVIEW">Reviews</option>
            <option value="STALLED">Stalled</option>
            <option value="REQUESTED">Meeting requests</option>
            <option value="MEETING_SOON">Meetings soon</option>
          </Select>
        </label>
        <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 xl:w-auto">
          Filter attention
        </Button>
        {attentionFiltered?<Link href={MENTOR_INBOX} className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lms-inline-link hover:text-[var(--lms-primary-text)]">Clear</Link>:null}
      </form>
      {!projectAccess?.projects.enabled
        ? <p role="status" className="border-b border-border pb-4 text-sm text-body leading-[22px]">
            Projects access is disabled; project attention is unavailable.
          </p>
        : visibleAlerts.length === 0
          ? <p className="border-b border-border pb-4 text-sm text-body leading-[22px]">
              {failedSources.length ? "No project alerts are visible, but some notification sources could not be checked." : "Nothing needs your attention right now."}
            </p>
          : <div className="min-w-0 divide-y divide-border border-b border-border">{visibleAlerts.map(alert=>
              <Link key={alert.key} href={alert.href}
                className="block min-h-11 min-w-0 py-4 transition hover:border-primary focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="min-w-0 break-words font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[26px]">{alert.title}</h3>
                  <StatusBadge tone={alert.kind === "STALLED" ? "error" :
                    alert.kind === "REVIEW" || alert.kind === "REQUESTED" ? "warning" : "info"}>
                    {alert.kind === "MEETING_SOON" ? "Upcoming meeting" :
                      alert.kind === "REQUESTED" ? "Meeting requested" :
                      alert.kind === "REVIEW" ? "Needs review" : "Stalled"}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-body leading-[22px]">{alert.description}</p>
              </Link>)}</div>}
    </section>:null}
    {!allSourcesEmpty&&!allRelevantFailed?<section aria-labelledby="mentor-personal-notifications" className="min-w-0 space-y-4">
      <h2 id="mentor-personal-notifications" className="font-semibold text-lg leading-7 text-[var(--lms-heading)]">
        Personal notifications
      </h2>
      {inbox ? <NotificationToolbar view={inbox.query.view} unreadCount={inbox.unreadCount}
        baseHref={MENTOR_INBOX} markAllEndpoint="/api/mentor/notifications/read-all"
        confirmMarkAll /> : null}
      {inbox?.cursor.invalid
        ? <Alert tone="error" role="alert">
            The notification page link is invalid.{" "}
            <Link href={mentorInboxPageHref(inbox?.query.view ?? parsed.data.view)}
              className="inline-flex min-h-11 min-[768px]:min-h-9 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
              Return to newest notifications
            </Link>
          </Alert>
        : <>
            <NotificationList items={items} readEndpoint="/api/mentor/notifications"
              emptyText={!inbox ? "Personal notifications are temporarily unavailable." : inbox.query.view === "unread" ? "No unread notifications." : "No personal notifications yet."} />
            {nextHref ? <div className="flex justify-center">
              <Link href={nextHref}
                className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-foreground hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:underline">
                Older notifications
              </Link>
            </div> : null}
          </>}
    </section>:null}


  </div>;
}
