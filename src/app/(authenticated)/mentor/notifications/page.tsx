import { Suspense } from "react";
import { Select } from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {listMyProjectInstances} from "@/modules/projects/member-service";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import type {NotificationListItem} from "@/components/activity/notification-list";

import { AnnouncementFeed } from "@/components/announcements/announcement-feed";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { listVisibleAnnouncementsForMembershipPage } from "@/modules/announcements/service";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { mentorInboxQuerySchema, mentorInboxPageHref } from "@/modules/activity/mentor-notifications-model";
import { getMentorPersonalInbox } from "@/modules/activity/mentor-notifications-service";
import { listMyMentorProjectAttention } from "@/modules/projects/mentor-attention-service";
import {listOwnMentorSourceReceipts} from
  "@/modules/projects/mentor-notification-source-receipts-service";
import {mentorAttentionReceiptKey,mentorAnnouncementReceiptKey}
  from "@/modules/projects/mentor-attention-read-model";
import {MentorSourceNotificationRead} from
  "@/components/projects/mentor-source-notification-read";
import {MentorSourceReadAll} from "@/components/projects/mentor-source-read-all";
import {MentorUnifiedReadAll} from "@/components/projects/mentor-unified-read-all";
import {MentorUnifiedNotificationFeed} from
  "@/components/projects/mentor-unified-notification-feed";
import {sortMentorUnifiedNotifications,type MentorUnifiedNotification}
  from "@/modules/projects/mentor-unified-notification-model";
import {mentorAttentionKindSchema,mentorAttentionProjectSchema,mentorAttentionOrderSchema,selectMentorAttention,mentorAttentionProjectOptions} from "@/modules/projects/mentor-attention-kind-model";

export const dynamic = "force-dynamic";
const MENTOR_INBOX = "/mentor/notifications";
type Params = {
  view?: string | string[];
  pill?: string | string[];
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
  type MentorPill="all"|"unread"|"subs"|"meet"|"tasks"|"ann";
  const pills:readonly MentorPill[]=["all","unread","subs","meet","tasks","ann"];
  const pillValue=first(raw.pill)??"all";
  const selectedPill:MentorPill=pills.includes(pillValue as MentorPill)
    ? pillValue as MentorPill : "all";
  const parsed = mentorInboxQuerySchema.safeParse({
    view:selectedPill==="unread" ? "unread" : first(raw.view) ?? undefined,
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
      ? listVisibleAnnouncementsForMembershipPage(context) :
        Promise.resolve({items:[],nextCursor:null}),
  ]);
  const projectAccess = accessResult.status === "fulfilled" ? accessResult.value : null;
  if (accessResult.status === "rejected") failedSources.push("Project access");
  const announcementPage=announcementResult.status==="fulfilled"?
    announcementResult.value:{items:[],nextCursor:null};
  const announcements=announcementPage.items;
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
  const sourceKeys=[...alerts.map(mentorAttentionReceiptKey),
    ...announcements.map(mentorAnnouncementReceiptKey)];
  const ownSourceReceipts=await listOwnMentorSourceReceipts(context,sourceKeys)
    .catch(()=>{
      failedSources.push("Notification read state");
      return null;
    });
  const sourceRead=(key:string)=>ownSourceReceipts?.has(key)??false;
  const projectUnread=ownSourceReceipts?
    alerts.filter(alert=>!sourceRead(mentorAttentionReceiptKey(alert))).length:0;
  const announcementUnread=ownSourceReceipts?
    announcements.filter(notice=>!sourceRead(mentorAnnouncementReceiptKey(notice))).length:0;
  const unifiedUnreadCount=(inbox?.unreadCount??0)+projectUnread+announcementUnread;
  const projectOptions=mentorAttentionProjectOptions(alerts,
    assigned.map(row=>({id:row.project.id,title:row.project.title})));
  // Legacy priority: announcements first, then reviews/meeting requests,
  // stalled projects, and finally meetings coming up soon. Timestamp is the
  // tie-breaker within a priority rather than the only sort key.
  const visibleAlerts=selectMentorAttention(alerts,kind.data,projectId.data,attentionOrder.data)
    .slice().sort((a,b)=>{
      const rank={REVIEW:0,TASK_REVIEW:1,SPRINT_SIGN_OFF:2,TASK_BLOCKED:3,
        UNASSIGNED_NEXT:4,REQUESTED:5,STALLED:6,MEETING_SOON:7} as const;
      return rank[a.kind]-rank[b.kind] ||
        b.occurredAt.localeCompare(a.occurredAt) || a.key.localeCompare(b.key);
    });
  const shownAlerts=visibleAlerts.filter(alert=>
    selectedPill==="all" ? true :
    selectedPill==="unread" ? ownSourceReceipts!==null&&
      !sourceRead(mentorAttentionReceiptKey(alert)) :
    selectedPill==="subs" ? alert.kind==="REVIEW" :
    selectedPill==="meet" ? alert.kind==="REQUESTED"||alert.kind==="MEETING_SOON" :
    selectedPill==="tasks" ? ["STALLED","TASK_REVIEW","TASK_BLOCKED",
      "SPRINT_SIGN_OFF","UNASSIGNED_NEXT"].includes(alert.kind) : false);
  const attentionFiltered=Boolean(projectId.data)||kind.data!=="ALL"||attentionOrder.data!=="RECENT";
  const items:NotificationListItem[] = (inbox?.page.items ?? []).map(({notification,event})=>({
    id:notification.id,title:notification.title,body:notification.body,
    actionHref:notification.actionHref,
    readAt:notification.readAt?.toISOString()??null,
    createdAt:notification.createdAt.toISOString(),
    module:event.module,importance:event.importance,
  }));
  const unifiedRows:MentorUnifiedNotification[]=sortMentorUnifiedNotifications([
    ...items.map(item=>({
      id:item.id,source:"PERSONAL" as const,title:item.title,
      description:item.body,occurredAt:item.createdAt,
      actionHref:item.actionHref,read:item.readAt!==null,receiptKey:null,
    })),
    ...alerts.map(alert=>{
      const receiptKey=mentorAttentionReceiptKey(alert);
      return {id:alert.key,source:"ATTENTION" as const,title:alert.title,
        description:alert.description,occurredAt:alert.occurredAt,
        actionHref:alert.href,read:ownSourceReceipts?
          sourceRead(receiptKey):null,receiptKey};
    }),
    ...announcements.map(notice=>{
      const receiptKey=mentorAnnouncementReceiptKey(notice);
      return {id:notice.id,source:"ANNOUNCEMENT" as const,title:notice.title,
        description:notice.message,occurredAt:notice.createdAt.toISOString(),
        actionHref:null,read:ownSourceReceipts?
          sourceRead(receiptKey):null,receiptKey};
    }),
  ]);
  const mergedShown=selectedPill==="unread"?
    unifiedRows.filter(row=>row.read===false):unifiedRows;
  const nextHref = inbox?.page.nextCursor
    ? mentorInboxPageHref(inbox.query.view,inbox.page.nextCursor)+
      (selectedPill==="unread"?"&pill=unread":"") : null;
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
      description="Announcements, final submissions, task approvals, sprint sign-offs, blockers and meetings." />
    <nav className="prototype-mentor-notification-pills" aria-label="Notification categories">
      {([
        ["all","All"],["unread","Unread · "+unifiedUnreadCount],
        ["subs","Submissions"],["meet","Meetings"],
        ["tasks","Tasks and teams"],["ann","From the college"],
      ] as const).map(([value,label])=><Link key={value}
        href={value==="all"?MENTOR_INBOX:value==="unread"?MENTOR_INBOX+"?pill=unread&view=unread":MENTOR_INBOX+"?pill="+value}
        aria-current={selectedPill===value?"page":undefined}
        className={selectedPill===value?"is-active":undefined}>{label}</Link>)}
    </nav>
    {(selectedPill==="all"||selectedPill==="unread")&&ownSourceReceipts?
      <MentorUnifiedReadAll loadedUnread={unifiedUnreadCount}
        moreNoticesPossible={announcementsEnabled&&announcements.length>=100}/>:null}
    {selectedPill!=="all"&&selectedPill!=="unread"&&
      ownSourceReceipts&&(projectUnread+announcementUnread)>0?
      <MentorSourceReadAll unread={projectUnread+announcementUnread}/>:null}
    {selectedPill==="unread"?<p className="prototype-mentor-unread-note">
      Unread shows the loaded personal, project-attention and college-announcement sources with a saved recipient read state. Older paginated sources may have additional items.
    </p>:null}
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
    {(selectedPill==="all"||selectedPill==="unread")&&!allRelevantFailed?
      <MentorUnifiedNotificationFeed items={mergedShown}
        unreadOnly={selectedPill==="unread"}
        announcementNextCursor={announcementPage.nextCursor?{
          beforePinned:announcementPage.nextCursor.isPinned?"1":"0",
          beforeCreatedAt:announcementPage.nextCursor.createdAt.toISOString(),
          beforeId:announcementPage.nextCursor.id,
        }:null}/>:null}
    {(selectedPill==="all"||selectedPill==="unread")&&inbox?.cursor.invalid?
      <Alert tone="error" role="alert">
        Personal notification cursor is invalid.
        <Link href={MENTOR_INBOX} className="ml-2 text-link underline">
          Return to newest notifications</Link>
      </Alert>:null}
    {(selectedPill==="all"||selectedPill==="unread")&&nextHref?
      <Link href={nextHref} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm font-semibold text-link underline">
        Older personal notifications →
      </Link>:null}
    <div className="prototype-mentor-notifications-columns">
      <div className="prototype-mentor-notifications-feed">
    {selectedPill==="ann"&&!allSourcesEmpty&&!allRelevantFailed?<AnnouncementFeed enabled={announcementsEnabled}
      mentorReadStates={ownSourceReceipts?Object.fromEntries(
        announcements.map(item=>{
          const key=mentorAnnouncementReceiptKey(item);
          return [item.id,{key,read:sourceRead(key)}] as const;
        })):undefined}
      items={(selectedPill==="unread"?announcements.filter(item=>
        ownSourceReceipts!==null&&!sourceRead(mentorAnnouncementReceiptKey(item))):announcements).map(item=>({
        id:item.id,title:item.title,message:item.message,
        senderType:item.senderType,receiverType:item.receiverType,
        isPinned:item.isPinned,createdAt:item.createdAt,
      }))} />:null}
    {(selectedPill==="subs"||selectedPill==="meet"||selectedPill==="tasks")&&!allSourcesEmpty&&!allRelevantFailed?<section aria-labelledby="mentor-attention" className="min-w-0 space-y-3">
      <h2 id="mentor-attention" className="font-semibold text-lg leading-7 text-[var(--lms-heading)]">
        Project attention ({shownAlerts.length} of {alerts.length})
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
            <option value="TASK_REVIEW">Task approvals</option>
            <option value="TASK_BLOCKED">Blocked tasks</option>
            <option value="SPRINT_SIGN_OFF">Sprint sign-offs</option>
            <option value="UNASSIGNED_NEXT">Next sprint unassigned</option>
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
        : shownAlerts.length === 0
          ? <p className="border-b border-border pb-4 text-sm text-body leading-[22px]">
              {failedSources.length ? "No project alerts are visible, but some notification sources could not be checked." : "Nothing needs your attention right now."}
            </p>
          : <div className="min-w-0 divide-y divide-border border-b border-border">{shownAlerts.map(alert=>
              <article key={alert.key}
                className="block min-h-11 min-w-0 py-4 transition md:min-h-[var(--lms-control-height)]">
                <Link href={alert.href} className="block rounded focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="min-w-0 break-words font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[26px]">{alert.title}</h3>
                  <StatusBadge tone={alert.kind === "STALLED" ? "error" :
                    ["REVIEW","REQUESTED","TASK_REVIEW","TASK_BLOCKED",
                      "SPRINT_SIGN_OFF","UNASSIGNED_NEXT"].includes(alert.kind) ? "warning" : "info"}>
                    {alert.kind === "MEETING_SOON" ? "Upcoming meeting" :
                      alert.kind === "REQUESTED" ? "Meeting requested" :
                      alert.kind === "REVIEW" ? "Needs review" :
                      alert.kind === "TASK_REVIEW" ? "Task approval" :
                      alert.kind === "TASK_BLOCKED" ? "Task blocked" :
                      alert.kind === "SPRINT_SIGN_OFF" ? "Sprint sign-off" :
                      alert.kind === "UNASSIGNED_NEXT" ? "Unassigned next sprint" : "Stalled"}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-body leading-[22px]">{alert.description}</p>
                </Link>
                {ownSourceReceipts?<MentorSourceNotificationRead
                  receiptKey={mentorAttentionReceiptKey(alert)}
                  read={sourceRead(mentorAttentionReceiptKey(alert))}/>:null}
              </article>)}</div>}
    </section>:null}

      </div>
      <aside className="prototype-mentor-notifications-about" aria-label="What you are notified about">
        <h2>What you’re told about</h2>
        <dl>
          <div><dt>Final submissions</dt><dd>In-app; external email delivery not verified</dd></div>
          <div><dt>Meeting requests</dt><dd>In-app; external email delivery not verified</dd></div>
          <div><dt>Tasks waiting for you</dt><dd>Here</dd></div>
          <div><dt>Blocked or quiet teams</dt><dd>Here</dd></div>
          <div><dt>College announcements</dt><dd>Here</dd></div>
        </dl>
        <p>Personal, currently visible project-attention and college-announcement
          notifications now have recipient-specific saved read states. The older
          announcement window and any inaccessible sources are not falsely counted
          as read. Provider email delivery is not yet verified.</p>
      </aside>
    </div>
  </div>;
}
