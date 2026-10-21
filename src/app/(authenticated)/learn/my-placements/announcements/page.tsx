import { Banner } from "@/components/ui/banner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { LEARNER_LEGACY_NOTICES_TITLE } from "@/modules/placements/learner-placement-copy-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import { learnerPlacementNoticeFeed } from "@/modules/placements/learner-placement-announcement-model";
import { learnerPlacementNoticeView } from "@/modules/placements/learner-placement-notice-view-model";
import {getOwnLearnerPlacementAlerts,getUnreadOwnLearnerPlacementAlertCount} from "@/modules/placements/learner-placement-alerts-service";
import {LearnerPlacementAlerts} from "@/components/placements/learner-placement-alerts";
import {searchLearnerAlertPreview} from "@/modules/placements/learner-alert-preview-search-model";
import {readLearnerNoticeFilters} from "@/modules/placements/learner-notices-query-model";
import {searchLearnerNotices} from "@/modules/placements/learner-notices-search-model";
import {filterLearnerRecentNotices} from "@/modules/placements/learner-notices-recent-model";
import {paginateOwnOffers} from "@/modules/placements/learner-offers-pagination-model";
import {learnerNoticeFilterHref,learnerNoticePageHref} from "@/modules/placements/learner-notices-navigation-model";
import {readOptionalLearnerAlertSource} from "@/modules/placements/learner-optional-alert-source-model";
import {sortLearnerNotices} from "@/modules/placements/learner-notices-sort-model";
import {learnerNoticePageWasClamped} from "@/modules/placements/learner-notice-page-recovery-model";
import {filterLearnerNoticesBySource} from "@/modules/placements/learner-notice-source-filter-model";
import {learnerNoticeEmptyLabel} from "@/modules/placements/learner-notice-empty-label-model";
import { learnerNoticeFocusPage, learnerNoticeAnchor, learnerNoticeHref, learnerNoticeMissing, learnerNoticeRecoveryHref } from "@/modules/placements/learner-notice-deep-link-model";
import {TpoNoticeAcknowledge} from "@/components/tpo/tpo-notice-acknowledge";

// Old LMS learner filter pills: legacy-styles/components___learn-notifications.scss:82-121
const placementFilterPillClass = "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[var(--lms-neutral-200)] bg-transparent px-4 py-2 text-sm font-medium leading-[1.3] text-[var(--lms-neutral-500)] transition-[color,background,border-color] duration-150 hover:border-[rgba(38,186,199,0.4)] hover:bg-[rgba(38,186,199,0.05)] hover:text-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] aria-[current=page]:border-[var(--lms-primary)] aria-[current=page]:bg-[var(--lms-primary)] aria-[current=page]:text-[var(--lms-on-primary)] aria-[current=page]:hover:border-[var(--lms-primary-hover)] aria-[current=page]:hover:bg-[var(--lms-primary-hover)] aria-[current=page]:hover:text-[var(--lms-on-primary)]";
// Legacy mobile (<768px): single-line horizontal strip; desktop wraps (SCSS:56-74).
const placementFilterNavClass = "min-w-0 max-w-full flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:max-w-full md:flex-wrap md:overflow-visible md:pb-0";

export default async function LearnerPlacementAnnouncementsPage({ searchParams }: {
  searchParams: Promise<{ show?:string|string[]; pinned?: string | string[]; unread?: string | string[]; q?: string | string[]; recent?: string | string[]; page?: string | string[]; sort?: string | string[]; alertQ?:string | string[]; focus?:string | string[]; source?:string | string[] }>;
}) {
  const query = await searchParams;
  const {show:rawShow,...visibleQuery}=query;
  const show=Array.isArray(rawShow)?rawShow[0]:rawShow;
  const activeView=show==="updates"?"updates":"announcements";
  const filters=readLearnerNoticeFilters(visibleQuery);
  const pinnedOnly=filters.pinned;
  const unreadOnly=filters.unread;
  const queryText=filters.q;
  const recentOnly=filters.recent;
  const sortKey=filters.sort;
  const alertQ=filters.alertQ;
  const source=filters.source;
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
  // College notices and personal updates have independent unread populations.
  // Unknown per-notice receipts must never be displayed as zero unread.
  const hasNoticeReceipts=allNotices.every(row=>row.unread!==null);
  const noticeUnread=hasNoticeReceipts?allNotices.filter(row=>row.unread===true).length:null;
  const tabHref=(target:"announcements"|"updates")=>{
    const params=new URLSearchParams();
    if(target==="updates")params.set("show","updates");
    if(filters.q)params.set("q",filters.q);
    if(filters.alertQ)params.set("alertQ",filters.alertQ);
    if(filters.pinned)params.set("pinned","1");
    if(filters.unread)params.set("unread","1");
    if(filters.source!=="all")params.set("source",filters.source);
    return "/learn/my-placements/announcements"+(params.size?"?"+params.toString():"");
  };
  const searchedNotices=searchLearnerNotices(filterLearnerNoticesBySource(learnerPlacementNoticeView(allNotices,pinnedOnly),source),queryText);
  const notices=recentOnly ? filterLearnerRecentNotices(searchedNotices,new Date().getTime()) : searchedNotices;
  const sortedNotices=sortLearnerNotices(notices,sortKey);
   const focused=learnerNoticeFocusPage(sortedNotices,filters.page,filters.focus);
  const pages = paginateOwnOffers(sortedNotices,focused.page,15);
  const pageClamped=learnerNoticePageWasClamped(filters.page,pages.page,sortedNotices.length,focused.found);
  const noticePageUrl=(page:number)=>learnerNoticePageHref({
    pinned:pinnedOnly,unread:unreadOnly,recent:recentOnly,q:queryText,alertQ,sort:sortKey,source,page,
  });
  const personalAlerts = await readOptionalLearnerAlertSource(
    ()=>getOwnLearnerPlacementAlerts(context,{unreadOnly,limit:20}));
  const searchedAlerts=searchLearnerAlertPreview(personalAlerts.items,alertQ);
  const unreadCount=await readOptionalLearnerAlertSource(async()=>[await getUnreadOwnLearnerPlacementAlertCount(context)]);
  return (
    <div className="min-w-0 space-y-6">
      <div>
        <Link href="/learn/my-placements" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Back to My Placements</Link>
        <PageHeader title={LEARNER_LEGACY_NOTICES_TITLE}
          description="Read-only notices visible to your own college membership. Notices without a valid saved publication date are not shown." />
        {hadInvalidNoticeFilters ? <Banner tone="warning" className="mt-2">Some notice filters were invalid and have been reset to safe defaults.</Banner> : null}
        {ready && (!collegeNoticesRead.available || !personalAlerts.available) ? (
          <Banner tone="error" role="alert" className="mt-2" action={
            <Link href="/learn/my-placements/announcements"
              className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">Retry</Link>
          }>Couldn&apos;t load everything. The available notices are shown below.</Banner>
        ) : null}
      </div>
      <nav aria-label="Placement notice views" className="flex min-w-0 gap-2 overflow-x-auto border-b border-border pb-0">
        <Link href={tabHref("announcements")} aria-current={activeView==="announcements"?"page":undefined}
          className={"inline-flex min-h-11 shrink-0 items-center gap-2 border-b-[3px] px-4 text-sm font-semibold "+(activeView==="announcements"?"border-[var(--lms-primary)] text-primary-text":"border-transparent text-body hover:text-primary-text")}>
          Announcements <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-xs">{noticeUnread===null?"Unread ?":noticeUnread+" unread"}</span>
        </Link>
        <Link href={tabHref("updates")} aria-current={activeView==="updates"?"page":undefined}
          className={"inline-flex min-h-11 shrink-0 items-center gap-2 border-b-[3px] px-4 text-sm font-semibold "+(activeView==="updates"?"border-[var(--lms-primary)] text-primary-text":"border-transparent text-body hover:text-primary-text")}>
          Updates about you ({unreadCount.available?unreadCount.items[0]:"?"} unread)
        </Link>
      </nav>
      <section id="college-notices" aria-label="College placement announcements" hidden={activeView!=="announcements"} className="min-w-0 space-y-4 scroll-mt-24">
      <form method="GET" action="/learn/my-placements/announcements" role="search" aria-label="College notice search" className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-end sm:gap-3">
        {alertQ?<Input type="hidden" name="alertQ" value={alertQ}/>:null}
        {source==="placement-cell"?<Input type="hidden" name="source" value={source}/>:null}
        {pinnedOnly ? <Input type="hidden" name="pinned" value="1" /> : null}
        {recentOnly ? <Input type="hidden" name="recent" value="1" /> : null}
        {unreadOnly ? <Input type="hidden" name="unread" value="1" /> : null}
        {sortKey!=="pinned"?<Input type="hidden" name="sort" value={sortKey}/>:null}
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Search college notices
          <Input type="search" name="q" maxLength={100} defaultValue={queryText}
            placeholder="Title or message" className="min-h-11 min-w-0" />
        </label>
        <Button type="submit" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">Search</Button>
        {queryText ? <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:unreadOnly,recent:recentOnly,q:"",sort:sortKey,alertQ,source})}
          className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center text-sm text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear search</Link> : null}
      </form>
      <details className="border-t border-border pt-2" open={pinnedOnly || recentOnly || source !== "all" || sortKey !== "pinned" || undefined}>
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">More notice filters</summary>
        <div className="space-y-3 pt-3">
      <form method="GET" action="/learn/my-placements/announcements" role="search" aria-label="College notice sorting" className="flex min-w-0 flex-wrap items-end gap-3">
        {alertQ?<Input type="hidden" name="alertQ" value={alertQ}/>:null}
        {source==="placement-cell"?<Input type="hidden" name="source" value={source}/>:null}
        {pinnedOnly?<Input type="hidden" name="pinned" value="1"/>:null}
        {unreadOnly?<Input type="hidden" name="unread" value="1"/>:null}
        {recentOnly?<Input type="hidden" name="recent" value="1"/>:null}
        {queryText?<Input type="hidden" name="q" value={queryText}/>:null}
        <label className="flex flex-col gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sort college notices
          <Select name="sort" defaultValue={sortKey} className="min-h-11">
            <option value="pinned">Pinned then newest</option>
            <option value="latest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </Select>
        </label>
        <Button type="submit" variant="secondary" className="min-h-11 md:min-h-9">Apply sort</Button>
      </form>
      <nav aria-label="Notice filter" className={placementFilterNavClass}>
        <Link href={learnerNoticeFilterHref({pinned:false,unread:unreadOnly,recent:recentOnly,q:queryText,sort:sortKey,alertQ,source})} aria-current={!pinnedOnly ? "page" : undefined} className={placementFilterPillClass}>All notices</Link>
        <Link href={learnerNoticeFilterHref({pinned:true,unread:unreadOnly,recent:recentOnly,q:queryText,sort:sortKey,alertQ,source})} aria-current={pinnedOnly ? "page" : undefined} className={placementFilterPillClass}>Pinned only</Link>
      </nav>
      <nav aria-label="Notice author filter" className={placementFilterNavClass}>
        <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:unreadOnly,recent:recentOnly,q:queryText,sort:sortKey,alertQ,source:"all"})}
          aria-current={source==="all"?"page":undefined}
          className={placementFilterPillClass}>
          All college notice authors
        </Link>
        <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:unreadOnly,recent:recentOnly,q:queryText,sort:sortKey,alertQ,source:"placement-cell"})}
          aria-current={source==="placement-cell"?"page":undefined}
          className={placementFilterPillClass}>
          Placement-cell authored
        </Link>
      </nav>
      <nav aria-label="Notice recency filter" className={placementFilterNavClass}>
        <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:unreadOnly,recent:false,q:queryText,sort:sortKey,alertQ,source})} aria-current={!recentOnly ? "page" : undefined}
          className={placementFilterPillClass}>All available dates</Link>
        <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:unreadOnly,recent:true,q:queryText,sort:sortKey,alertQ,source})} aria-current={recentOnly?"page":undefined}
          className={placementFilterPillClass}>Last 30 days</Link>
      </nav>
        </div>
      </details>
      <p className="text-xs text-muted-foreground">These college-targeted announcements may include notices published by your placement cell. Only notices addressed to your membership are displayed.</p>
      {pageClamped && collegeNoticesRead.available ? (
        <p role="status" className="min-w-0 border-b border-border bg-[var(--lms-neutral-50)] px-4 py-3 text-sm leading-[1.5] text-body">
          The requested notice page no longer exists in the current filtered results. Showing page {pages.page} instead.
          <Link href={noticePageUrl(pages.page)} className="ml-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Update page link
          </Link>
        </p>
      ) : null}
      {ready && collegeNoticesRead.available && learnerNoticeMissing(filters.focus,focused.found) ? (
        <div role="status" className="min-w-0 border-b border-border bg-[var(--lms-neutral-50)] px-4 py-3 text-sm leading-[1.5] text-body">
          That notice is not among your currently visible college notices. It may have expired or become unavailable to your membership.
          <Link href={learnerNoticeRecoveryHref(filters.focus)}
            className="ml-2 inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Search all my visible notices
          </Link>
        </div>
      ) : null}
      {!ready ? (
        <div role="status" className="flex min-h-44 min-w-0 flex-col items-center justify-center border-b border-border bg-[var(--lms-neutral-50)] px-6 py-12 text-center text-sm leading-[1.5] text-body">
          College announcements are not available until the announcements database is enabled.
        </div>
      ) : !collegeNoticesRead.available ? (
        <Banner tone="warning" role="alert">
          College notices are temporarily unavailable. Your personal placement alerts are still accessible below.
          <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:unreadOnly,recent:recentOnly,q:queryText,sort:sortKey,alertQ,source})}
            className="ml-2 inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Retry college notices
          </Link>
        </Banner>
      ) : notices.length === 0 ? (
        <p role="status" className="flex min-h-[180px] min-w-0 flex-col items-center justify-center gap-4 px-6 py-12 text-center text-sm leading-[1.5] text-[var(--lms-neutral-500)]">
          {learnerNoticeEmptyLabel(allNotices.length,pinnedOnly,source,{
             search:queryText,recent:recentOnly,matchingTotal:notices.length,
           })}
        </p>
      ) : (
        <ul className="min-w-0 divide-y divide-border">
          {pages.items.map((notice) => (
            <li key={notice.id} id={learnerNoticeAnchor(notice.id)??undefined} className="min-w-0 scroll-mt-24 py-4 first:pt-0 last:pb-0 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary md:py-4">
              <div className="flex flex-wrap items-center gap-2">
                {notice.isPinned ? <Badge  tone="info">Pinned</Badge> : null}
                {notice.updatedAt ? <Badge tone="info">Updated</Badge> : null}
                {notice.unread===true ? <Badge tone="info">New</Badge> : null}
                {/* Never present a recent publication as unread without a receipt. */}
              </div>
              <h2 className="break-words text-lg font-semibold text-foreground">{notice.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {notice.senderLabel ?? "College announcement"}
                {notice.audienceLabel ? " · For "+notice.audienceLabel : ""}
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{notice.message}</p>
               {notice.bodyLinks.length ? <div className="mt-2 flex flex-wrap gap-2" aria-label="Links in notice">
                 {notice.bodyLinks.map(href => <ThirdPartyLink key={href} href={href} label={href+" ↗"} />)}
               </div> : null}
              {notice.driveHref?<Link href={notice.driveHref} className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline">Open the drive</Link>:null}
               {notice.buttonUrl && notice.buttonLabel ? (
                 <div className="mt-3 min-w-0">
                   <ThirdPartyLink href={notice.buttonUrl} label={`${notice.buttonLabel} ↗`} />
                 </div>
               ) : null}
              {notice.senderLabel==="Placement cell"?<TpoNoticeAcknowledge id={notice.id}/>:null}
              {learnerNoticeHref(notice.id) ? (
                <Link href={learnerNoticeHref(notice.id)!}
                  className="mt-2 inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                  Link to this notice
                </Link>
              ) : null}
              {notice.publicationDateUnavailable
                ? <span className="mt-3 block text-xs text-muted-foreground">Publication date unavailable</span>
                : <time dateTime={notice.createdAt} className="mt-3 block text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" }).format(new Date(notice.createdAt))}
                  </time>}
              {notice.updatedAt ? <time dateTime={notice.updatedAt} className="mt-1 block text-xs text-muted-foreground">
                Updated {new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" }).format(new Date(notice.updatedAt))}
              </time> : null}
            </li>
          ))}
        </ul>
      )}
      {pages.total > 0 ? <nav aria-label="College notice pages" className="flex flex-col items-start gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <p className="text-muted-foreground">{pages.from}–{pages.to} of {pages.total} loaded matching notices</p>
        {pages.page>1 ? <Link href={noticePageUrl(pages.page-1)} className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center border border-border rounded-[8px] md:rounded-[var(--lms-control-radius)] px-3 text-primary-text hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Previous</Link> : null}
        <span aria-current="page">Page {pages.page} of {pages.pages}</span>
        {pages.page<pages.pages ? <Link href={noticePageUrl(pages.page+1)} className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center border border-border rounded-[8px] md:rounded-[var(--lms-control-radius)] px-3 text-primary-text hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Next</Link> : null}
      </nav> : null}
      </section>
      <section hidden={activeView!=="updates"} aria-label="Personal placement updates" className="min-w-0 space-y-4">
      <div id="personal-updates" className="scroll-mt-24 border-t border-border pt-6"><h2 className="text-lg font-semibold text-foreground">Updates about you</h2></div>
      <nav aria-label="Personal alert filter" className={placementFilterNavClass}>
        <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:false,recent:recentOnly,q:queryText,sort:sortKey,alertQ,source})} className={placementFilterPillClass} aria-current={!unreadOnly?"page":undefined}>All personal alerts</Link>
        <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:true,recent:recentOnly,q:queryText,sort:sortKey,alertQ,source})} className={placementFilterPillClass} aria-current={unreadOnly?"page":undefined}>Unread personal alerts</Link>
      </nav>
      <form method="GET" action="/learn/my-placements/announcements" role="search" aria-label="Personal alert search" className="flex min-w-0 flex-wrap items-end gap-3">
        <Input type="hidden" name="show" value="updates"/>
        {pinnedOnly?<Input type="hidden" name="pinned" value="1"/>:null}
        {recentOnly?<Input type="hidden" name="recent" value="1"/>:null}
        {unreadOnly?<Input type="hidden" name="unread" value="1"/>:null}
        {queryText?<Input type="hidden" name="q" value={queryText}/>:null}
        {sortKey!=="pinned"?<Input type="hidden" name="sort" value={sortKey}/>:null}
        {source==="placement-cell"?<Input type="hidden" name="source" value={source}/>:null}
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Search loaded personal alerts
          <Input type="search" name="alertQ" defaultValue={alertQ} maxLength={80}
            placeholder="Title or message" className="min-h-11 min-w-0 md:min-h-9"/>
        </label>
        <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="submit">Search alerts</Button>
      </form>
      {alertQ ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">This search covers the latest 20 loaded personal alerts, not your full notification history.</p>
          <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:unreadOnly,recent:recentOnly,q:queryText,alertQ:"",sort:sortKey,source})}
            className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Clear personal alert search
          </Link>
        </div>
      ) : null}
      {personalAlerts.available ?
        <LearnerPlacementAlerts alerts={searchedAlerts} filtered={Boolean(alertQ)} unreadOnly={unreadOnly} /> :
        <Banner tone="warning" role="alert">
          Personal placement alerts are temporarily unavailable; the college notice results above remain accessible.
          <Link href={learnerNoticeFilterHref({pinned:pinnedOnly,unread:unreadOnly,recent:recentOnly,q:queryText,sort:sortKey,alertQ,source})}
            className="ml-2 inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Retry personal alerts</Link>
        </Banner>}

      </section>
    </div>
  );
}
