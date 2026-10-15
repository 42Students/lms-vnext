import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import { learnerPlacementNoticeFeed } from "@/modules/placements/learner-placement-announcement-model";
import { learnerPlacementNoticeView } from "@/modules/placements/learner-placement-notice-view-model";
import {getOwnLearnerPlacementAlerts} from "@/modules/placements/learner-placement-alerts-service";
import {LearnerPlacementAlerts} from "@/components/placements/learner-placement-alerts";
import {searchLearnerAlertPreview} from "@/modules/placements/learner-alert-preview-search-model";
import {readLearnerNoticeFilters} from "@/modules/placements/learner-notices-query-model";
import {searchLearnerNotices} from "@/modules/placements/learner-notices-search-model";
import {filterLearnerRecentNotices} from "@/modules/placements/learner-notices-recent-model";
import {paginateOwnOffers} from "@/modules/placements/learner-offers-pagination-model";
import {learnerNoticeFilterHref} from "@/modules/placements/learner-notices-navigation-model";
import {readOptionalLearnerAlertSource} from "@/modules/placements/learner-optional-alert-source-model";
import {sortLearnerNotices} from "@/modules/placements/learner-notices-sort-model";

export default async function LearnerPlacementAnnouncementsPage({ searchParams }: {
  searchParams: Promise<{ pinned?: string | string[]; unread?: string | string[]; q?: string | string[]; recent?: string | string[]; page?: string | string[]; sort?: string | string[]; alertQ?:string | string[] }>;
}) {
  const query = await searchParams;
  const filters=readLearnerNoticeFilters(query);
  const pinnedOnly=filters.pinned;
  const unreadOnly=filters.unread;
  const queryText=filters.q;
  const recentOnly=filters.recent;
  const sortKey=filters.sort;
  const alertQ=filters.alertQ;
  const hadInvalidNoticeFilters=filters.invalid;
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context, "LEARNER")) throw new AuthorizationError("placements.read");
  const own = await requireLearnerPlacementAccess(context);
  requirePermission(context, "placements.read", {
    collegeId: own.collegeId, organizationId: own.organizationId,
  });
  // DB10 is an optional registered migration. Never query staged tables when disabled.
  const ready = announcementsRuntimeEnabled();
  const collegeNoticesRead = ready
    ? await readOptionalLearnerAlertSource(() => listVisibleAnnouncementsForMembership(context))
    : { available: false as const, items: [] };
  const allNotices = collegeNoticesRead.available
    ? learnerPlacementNoticeFeed(collegeNoticesRead.items)
    : [];
  const searchedNotices=searchLearnerNotices(learnerPlacementNoticeView(allNotices,pinnedOnly),queryText);
  const notices=recentOnly ? filterLearnerRecentNotices(searchedNotices,new Date().getTime()) : searchedNotices;
  const noticePage = filters.page;
  const pages = paginateOwnOffers(sortLearnerNotices(notices,sortKey),noticePage,15);
  const noticePageUrl=(page:number)=>"/learn/my-placements/announcements?"+new URLSearchParams({
    ...(pinnedOnly?{pinned:"1"}:{}),...(unreadOnly?{unread:"1"}:{}),
    ...(queryText?{q:queryText}:{}),...(alertQ?{alertQ}:{}),...(recentOnly?{recent:"1"}:{}),...(sortKey!=="pinned"?{sort:sortKey,alertQ}:{}),page:String(page),
  }).toString();
  const personalAlerts = await readOptionalLearnerAlertSource(
    ()=>getOwnLearnerPlacementAlerts(context,{unreadOnly,limit:20}));
  const searchedAlerts=searchLearnerAlertPreview(personalAlerts.items,alertQ);
  return (
    <main className="min-w-0 space-y-6">
      <div>
        <Link href="/learn/my-placements" className="text-sm text-primary-text underline">Back to My Placements</Link>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Announcements</h1>
        <p className="mt-2 text-sm text-body">Read-only notices visible to your own college membership.</p>
        {hadInvalidNoticeFilters ? <p role="status" className="mt-2 text-sm text-warning">Some notice filters were invalid and have been reset to safe defaults.</p> : null}
      </div>
      <form method="GET" action="/learn/my-placements/announcements" className="flex min-w-0 flex-wrap items-end gap-3">
        {pinnedOnly ? <input type="hidden" name="pinned" value="1" /> : null}
        {recentOnly ? <input type="hidden" name="recent" value="1" /> : null}
        {unreadOnly ? <input type="hidden" name="unread" value="1" /> : null}
        {sortKey!=="pinned"?<input type="hidden" name="sort" value={sortKey}/>:null}
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-foreground">
          Search college notices
          <input type="search" name="q" maxLength={100} defaultValue={queryText}
            placeholder="Title or message" className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3" />
        </label>
        <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Search</button>
        {queryText ? <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:unreadOnly,recent:recentOnly,q:"",sort:sortKey,alertQ})}
          className="inline-flex min-h-11 items-center text-sm text-primary-text underline">Clear search</Link> : null}
      </form>
      <form method="GET" action="/learn/my-placements/announcements" className="flex min-w-0 flex-wrap items-end gap-3">
        {pinnedOnly?<input type="hidden" name="pinned" value="1"/>:null}
        {unreadOnly?<input type="hidden" name="unread" value="1"/>:null}
        {recentOnly?<input type="hidden" name="recent" value="1"/>:null}
        {queryText?<input type="hidden" name="q" value={queryText}/>:null}
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">Sort college notices
          <select name="sort" defaultValue={sortKey} className="min-h-11 rounded-md border border-border bg-surface px-3">
            <option value="pinned">Pinned then newest</option>
            <option value="latest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Apply sort</button>
      </form>
      <nav aria-label="Notice filter" className="flex flex-wrap gap-3 text-sm">
        <Link href={learnerNoticeFilterHref({pinned:false,unread:unreadOnly,recent:recentOnly,q:queryText,sort:sortKey,alertQ})} aria-current={!pinnedOnly ? "page" : undefined} className="min-h-11 rounded-md border border-border px-4 py-3 text-primary-text">All notices</Link>
        <Link href={learnerNoticeFilterHref({pinned:true,unread:unreadOnly,recent:recentOnly,q:queryText,sort:sortKey,alertQ})} aria-current={pinnedOnly ? "page" : undefined} className="min-h-11 rounded-md border border-border px-4 py-3 text-primary-text">Pinned only</Link>
      </nav>
      <nav aria-label="Notice recency filter" className="flex flex-wrap gap-3 text-sm">
        <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:unreadOnly,recent:false,q:queryText,sort:sortKey,alertQ})} aria-current={!recentOnly ? "page" : undefined}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-primary-text">All available dates</Link>
        <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:unreadOnly,recent:true,q:queryText,sort:sortKey,alertQ})} aria-current={recentOnly?"page":undefined}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-primary-text">Last 30 days</Link>
      </nav>
      <p className="text-xs text-muted-foreground">These are college-targeted notices from the registered announcement service. Some may be general college notices; a dedicated placement-only publisher is not yet registered.</p>
      {!ready ? (
        <div role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          College announcements are not available until the announcements database is enabled.
        </div>
      ) : !collegeNoticesRead.available ? (
        <div role="alert" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          College notices are temporarily unavailable. Your personal placement alerts are still accessible below.
          <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:unreadOnly,recent:recentOnly,q:queryText,sort:sortKey,alertQ})}
            className="ml-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline">
            Retry college notices
          </Link>
        </div>
      ) : notices.length === 0 ? (
        <p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          {pinnedOnly && allNotices.length > 0 ? "No pinned notices match this filter." : "No current notices match these filters or are visible to your membership."}
        </p>
      ) : (
        <ul className="min-w-0 space-y-3">
          {pages.items.map((notice) => (
            <li key={notice.id} className="min-w-0 rounded-xl border border-border bg-surface p-5">
              {notice.isPinned ? <p className="text-xs font-semibold text-primary-text">Pinned</p> : null}
              <h2 className="break-words text-lg font-semibold text-foreground">{notice.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {notice.senderLabel ? "Issued by "+notice.senderLabel : "College announcement"}
                {notice.audienceLabel ? " · Audience: "+notice.audienceLabel : ""}
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{notice.message}</p>
              <time dateTime={notice.createdAt} className="mt-3 block text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" }).format(new Date(notice.createdAt))}
              </time>
            </li>
          ))}
        </ul>
      )}
      {pages.total > 0 ? <nav aria-label="College notice pages" className="flex flex-wrap items-center gap-3 text-sm">
        <p className="text-muted-foreground">{pages.from}–{pages.to} of {pages.total} loaded matching notices</p>
        {pages.page>1 ? <Link href={noticePageUrl(pages.page-1)} className="inline-flex min-h-11 items-center border border-border rounded-md px-3 text-primary-text">Previous</Link> : null}
        <span aria-current="page">Page {pages.page} of {pages.pages}</span>
        {pages.page<pages.pages ? <Link href={noticePageUrl(pages.page+1)} className="inline-flex min-h-11 items-center border border-border rounded-md px-3 text-primary-text">Next</Link> : null}
      </nav> : null}
      <nav aria-label="Personal alert filter" className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:false,recent:recentOnly,q:queryText,sort:sortKey,alertQ})} className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-primary-text" aria-current={!unreadOnly?"page":undefined}>All personal alerts</Link>
        <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:true,recent:recentOnly,q:queryText,sort:sortKey,alertQ})} className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-primary-text" aria-current={unreadOnly?"page":undefined}>Unread personal alerts</Link>
      </nav>
      <form method="GET" action="/learn/my-placements/announcements" className="flex min-w-0 flex-wrap items-end gap-3">
        {pinnedOnly?<input type="hidden" name="pinned" value="1"/>:null}
        {recentOnly?<input type="hidden" name="recent" value="1"/>:null}
        {unreadOnly?<input type="hidden" name="unread" value="1"/>:null}
        {queryText?<input type="hidden" name="q" value={queryText}/>:null}
        {sortKey!=="pinned"?<input type="hidden" name="sort" value={sortKey}/>:null}
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-semibold text-foreground">
          Search loaded personal alerts
          <input type="search" name="alertQ" defaultValue={alertQ} maxLength={80}
            placeholder="Title or message" className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3"/>
        </label>
        <button className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold text-primary-text" type="submit">Search alerts</button>
      </form>
      {alertQ ? <p className="text-xs text-muted-foreground">This search covers the latest 20 loaded personal alerts, not your full notification history.</p> : null}
      {personalAlerts.available ?
        <LearnerPlacementAlerts alerts={searchedAlerts} filtered={Boolean(alertQ)} /> :
        <div role="alert" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          Personal placement alerts are temporarily unavailable; the college notice results above remain accessible.
          <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:unreadOnly,recent:recentOnly,q:queryText,sort:sortKey,alertQ})}
            className="ml-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline">Retry personal alerts</Link>
        </div>}

    </main>
  );
}
