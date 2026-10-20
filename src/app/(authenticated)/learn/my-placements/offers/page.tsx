import { Banner } from "@/components/ui/banner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { learnerOffersQueryHasInvalidFields } from "@/modules/placements/learner-offers-query-feedback-model";
import {learnerOfferStatusTabLabel} from "@/modules/placements/learner-offer-status-label-model";
import {learnerExpiredIssuedOffers} from "@/modules/placements/learner-offer-issued-expired-model";
import { learnerOffersEmptyState } from "@/modules/placements/learner-offers-empty-state-model";
import Link from "next/link";
import {learnerOfferPageSchema,paginateOwnOffers} from "@/modules/placements/learner-offers-pagination-model";
import {learnerOfferSortSchema,sortOwnOfferRows} from "@/modules/placements/learner-offers-sort-model";
import {learnerOfferStatusHref,learnerOfferClearFiltersHref,learnerOfferHasActiveFacets} from "@/modules/placements/learner-offers-navigation-model";
import { resolveLearnerOfferFocus, learnerOfferFocusMissing, learnerOfferRecoveryHref } from "@/modules/placements/learner-offer-deep-link-model";
import {learnerOfferKindSchema,filterOwnOffersByKind} from "@/modules/placements/learner-offer-kind-model";
import {learnerJoiningFilterSchema,filterOwnOffersByJoining} from "@/modules/placements/learner-offer-joining-filter-model";
import { learnerOffersSearchSchema, searchOwnOffers } from "@/modules/placements/learner-offers-search-model";
import {learnerOfferExpirySchema,filterOwnOffersByExpiry} from "@/modules/placements/learner-offer-expiry-filter-model";
import { ownOffersDueWithinWeek } from "@/modules/placements/learner-offers-due-model";
import { learnerOffersExpiringSoon } from "@/modules/placements/learner-offers-expiring-soon-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerPlacementOffers } from "@/components/placements/learner-placement-offers";
import {learnerOfferCountsAsPlaced,safeLearnerOfferLetterHref} from "@/modules/placements/learner-offer-letter-model";
import { getOwnLearnerOfferBrowse } from "@/modules/placements/learner-offers-browse-service";
import {listOwnPlacementRequests} from "@/modules/placements/request-service";
import {readOptionalLearnerAlertSource} from "@/modules/placements/learner-optional-alert-source-model";
import {
  learnerOfferViewSchema,
  type LearnerOfferView,
} from "@/modules/placements/learner-offers-browse-model";

const expiryTabs = [{id:"all",label:"All expiry states"},{id:"expired",label:"Issued, deadline passed"},{id:"undated",label:"Issued, no deadline recorded"}] as const;
const joiningTabs = [
  {id:"all",label:"All joining outcomes"},
  {id:"joined",label:"Confirmed joined"},
  {id:"pending",label:"Joining pending"},
  {id:"deferred",label:"Joining deferred"},
  {id:"did-not-join",label:"Did not join"},
  {id:"not-recorded",label:"No joining record"},
] as const;
const kindTabs = [{id:"all",label:"All documents"},{id:"offer",label:"Offer letters"},{id:"loi",label:"Letters of intent"}] as const;
const tabs: readonly { id: LearnerOfferView; label: string }[] = [
  { id: "all", label: learnerOfferStatusTabLabel("all") },
  { id: "pending", label: learnerOfferStatusTabLabel("pending") },
  { id: "accepted", label: learnerOfferStatusTabLabel("accepted") },
  { id: "closed", label: learnerOfferStatusTabLabel("closed") },
  { id: "declined", label: learnerOfferStatusTabLabel("declined") },
  { id: "withdrawn", label: learnerOfferStatusTabLabel("withdrawn") },
];

// Old LMS learner filter pills: legacy-styles/components___learn-notifications.scss:82-121
const placementFilterPillClass = "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[var(--lms-neutral-200)] bg-transparent px-4 py-2 text-sm font-medium leading-5 text-[var(--lms-neutral-500)] transition-[color,background,border-color] duration-150 hover:border-[rgba(38,186,199,0.4)] hover:bg-[rgba(38,186,199,0.05)] hover:text-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] aria-[current=page]:border-[var(--lms-primary)] aria-[current=page]:bg-[var(--lms-primary)] aria-[current=page]:text-[var(--lms-on-primary)] aria-[current=page]:hover:border-[var(--lms-primary-hover)] aria-[current=page]:hover:bg-[var(--lms-primary-hover)] aria-[current=page]:hover:text-[var(--lms-on-primary)]";
// Legacy mobile (<768px): one-line horizontally scrolling filter strip (SCSS:56-74).
const placementFilterNavClass = "min-w-0 max-w-full flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:max-w-full md:flex-wrap md:overflow-visible md:pb-0";

export default async function LearnerOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; q?: string | string[]; due?: string | string[]; page?: string | string[]; sort?: string | string[]; kind?: string | string[]; joining?:string | string[]; expiry?:string | string[]; focus?:string | string[] }>;
}) {
  const query = await searchParams;
  const invalidQuery=learnerOffersQueryHasInvalidFields(query);
  const requested = typeof query.status === "string" ? query.status : "all";
  const validView = learnerOfferViewSchema.safeParse(requested);
  const view = validView.success ? validView.data : "all";
  const parsedSearch = learnerOffersSearchSchema.safeParse(query.q ?? "");
  const searchTerm = parsedSearch.success ? parsedSearch.data : "";
  const expiryParsed=learnerOfferExpirySchema.safeParse(query.expiry??"all");
  const expiry=expiryParsed.success?expiryParsed.data:"all";
  const dueOnly=expiry==="all"&&query.due==="1";
  const conflictingDeadlines=expiry!=="all"&&query.due==="1";
  const context = await getCurrentRequestContext();
  const [offers,requestRead] = await Promise.all([
    getOwnLearnerOfferBrowse(context,view),
    readOptionalLearnerAlertSource(()=>listOwnPlacementRequests(context)),
  ]);
  const requests = requestRead.items;
  const snapshotNowIso = new Date().toISOString();
  const expiredIssuedCount=learnerExpiredIssuedOffers(offers.items,Date.parse(snapshotNowIso));
  const kindInput=learnerOfferKindSchema.safeParse(query.kind ?? "all");
  const kind=kindInput.success?kindInput.data:"all";
  const joiningInput=learnerJoiningFilterSchema.safeParse(query.joining ?? "all");
  const joiningFilter=joiningInput.success?joiningInput.data:"all";
  const searchedOffers = filterOwnOffersByJoining(filterOwnOffersByKind(searchOwnOffers(offers.items, searchTerm),kind),joiningFilter);
  const visibleOffers = dueOnly ? ownOffersDueWithinWeek(searchedOffers,Date.parse(snapshotNowIso)) : filterOwnOffersByExpiry(searchedOffers,expiry,Date.parse(snapshotNowIso));
  const pageResult = learnerOfferPageSchema.safeParse(query.page ?? "1");
  const requestedPage = pageResult.success ? pageResult.data : 1;
  const sortParsed=learnerOfferSortSchema.safeParse(query.sort ?? "priority");
  const order=sortParsed.success?sortParsed.data:"priority";
  const sorted=sortOwnOfferRows(visibleOffers,order,Date.parse(snapshotNowIso));
  const focused = resolveLearnerOfferFocus(sorted,requestedPage,query.focus);
  const paginated = paginateOwnOffers(sorted,focused.page,15);
  const pageClamped=!focused.found && sorted.length>0 && requestedPage>paginated.page;
  const hasActiveFacets = learnerOfferHasActiveFacets({searchTerm,dueOnly,sort:order,kind,joining:joiningFilter,expiry});
  const emptyState = learnerOffersEmptyState(offers.counts.all, Boolean(searchTerm) || dueOnly || kind !== "all" || joiningFilter !== "all" || expiry !== "all");
  const pageUrl=(page:number)=>"/learn/my-placements/offers?"+new URLSearchParams({
    ...(view!=="all"?{status:view}:{}),...(searchTerm?{q:searchTerm}:{}),
    ...(dueOnly?{due:"1"}:{}),...(order!=="priority"?{sort:order}:{}),...(kind!=="all"?{kind}:{}),...(joiningFilter!=="all"?{joining:joiningFilter}:{}),...(expiry!=="all"?{expiry}:{}),page:String(page),
  }).toString();
  const kindHref=(nextKind:"all"|"offer"|"loi")=>learnerOfferStatusHref(view,{searchTerm,dueOnly,sort:order,kind:nextKind,joining:joiningFilter,expiry});
  const expiringSoon = learnerOffersExpiringSoon(visibleOffers.map(row => ({
    status: row.offer.status, expiresAt: row.offer.expiresAt?.toISOString() ?? null,
  })), Date.parse(snapshotNowIso));

  return (
    <div className="min-w-0 space-y-6">
      <Link
        href="/learn/my-placements/applications"
        className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text hover:underline"
      >
        ← Applications
      </Link>

      <PageHeader title="My offers" description="Your official placement offers and recorded joining outcomes." />

      {conflictingDeadlines ? <Banner tone="warning">
        The due-soon and historical expiry filters cannot be combined. Showing the selected expiry state instead.
      </Banner> : null}
      {invalidQuery ? <Banner tone="warning">Invalid offer filters were ignored. Check the selected status, search and dates before continuing.</Banner> : null}
      <Tabs ariaLabel="Offer status" renderPanel={false} value={view} items={tabs.map(tab=>({value:tab.id,label:tab.label,count:offers.counts[tab.id],href:learnerOfferStatusHref(tab.id,{searchTerm,dueOnly,sort:order,kind,joining:joiningFilter,expiry})}))}/>
      {view==="pending"&&expiredIssuedCount>0 ? (
        <p role="status" className="min-w-0 border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm leading-[1.5] text-body">
          {expiredIssuedCount} issued {expiredIssuedCount===1?"offer has":"offers have"} passed the recorded response deadline. They remain in issued history but cannot be accepted or declined after expiry.
          <Link href="/learn/my-placements/offers?status=pending&expiry=expired" className="ml-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
            View expired issued offers
          </Link>
        </p>
      ) : null}
      <form method="GET" action="/learn/my-placements/offers" className="flex min-w-0 flex-wrap items-end gap-3">
        {view !== "all" ? <Input type="hidden" name="status" value={view} /> : null}
        {dueOnly ? <Input type="hidden" name="due" value="1" /> : null}
        {order !== "priority" ? <Input type="hidden" name="sort" value={order} /> : null}
        {kind !== "all" ? <Input type="hidden" name="kind" value={kind} /> : null}
        {joiningFilter!=="all"?<Input type="hidden" name="joining" value={joiningFilter}/>:null}
        {expiry!=="all"?<Input type="hidden" name="expiry" value={expiry}/>:null}
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-foreground">
          Search my offers
          <Input name="q" type="search" maxLength={80} defaultValue={searchTerm}
            placeholder="Employer or role" className="min-h-11 min-w-0" />
        </label>
        <Button type="submit" className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">Search</Button>
        {searchTerm ? <Link href={learnerOfferStatusHref(view,{searchTerm:"",dueOnly,sort:order,kind,joining:joiningFilter,expiry})}
          className="inline-flex min-h-11 md:min-h-9 items-center text-sm text-primary-text underline">Clear search</Link> : null}
      </form>
      <form method="GET" action="/learn/my-placements/offers" className="flex flex-wrap items-end gap-3">
        {view!=="all"?<Input type="hidden" name="status" value={view}/>:null}
        {searchTerm?<Input type="hidden" name="q" value={searchTerm}/>:null}
        {dueOnly?<Input type="hidden" name="due" value="1"/>:null}
        {kind!=="all"?<Input type="hidden" name="kind" value={kind}/>:null}
        {joiningFilter!=="all"?<Input type="hidden" name="joining" value={joiningFilter}/>:null}
        {expiry!=="all"?<Input type="hidden" name="expiry" value={expiry}/>:null}
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Sort my offers
          <Select name="sort" defaultValue={order} className="min-h-11">
            <option value="priority">Needs response first</option>
            <option value="newest">Newest issued</option>
            <option value="company">Company A–Z</option>
          </Select>
        </label>
        <Button type="submit" className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">Apply sort</Button>
      </form>
      {hasActiveFacets ? (
        <Link href={learnerOfferClearFiltersHref(view)}
          className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text underline">
          Clear offer filters (keep selected status)
        </Link>
      ) : null}
      <nav aria-label="Recorded joining outcome" className={placementFilterNavClass}>
        {joiningTabs.map(tab => (
          <Link key={tab.id}
            href={learnerOfferStatusHref(view,{searchTerm,dueOnly,sort:order,kind,joining:tab.id,expiry})}
            aria-current={joiningFilter===tab.id?"page":undefined}
            className={placementFilterPillClass}>
            {tab.label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Offer document kind" className={placementFilterNavClass}>
        {kindTabs.map(({id:value,label})=><Link key={value} href={kindHref(value)}
          aria-current={kind===value?"page":undefined}
          className={placementFilterPillClass}>
          {label}
        </Link>)}
      </nav>
      <nav aria-label="Offer deadline filter" className={placementFilterNavClass}>
        <Link href={learnerOfferStatusHref(view,{searchTerm,dueOnly:false,sort:order,kind,joining:joiningFilter,expiry:"all"})}
          aria-current={!dueOnly?"page":undefined}
          className={placementFilterPillClass}>All deadlines</Link>
        <Link href={learnerOfferStatusHref(view,{searchTerm,dueOnly:true,sort:order,kind,joining:joiningFilter,expiry:"all"})}
          aria-current={dueOnly?"page":undefined}
          className={placementFilterPillClass}>Awaiting response · next 7 days</Link>
      </nav>
      <nav aria-label="Issued offer expiry state" className={placementFilterNavClass}>
        {expiryTabs.map(tab=>(
          <Link key={tab.id}
            href={learnerOfferStatusHref(view,{searchTerm,dueOnly:false,sort:order,kind,joining:joiningFilter,expiry:tab.id})}
            aria-current={expiry===tab.id?"page":undefined}
            className={placementFilterPillClass}>
            {tab.label}
          </Link>
        ))}
      </nav>
      {pageClamped ? (
        <p role="status" className="min-w-0 border-b border-border bg-[var(--lms-neutral-50)] px-4 py-3 text-sm leading-[1.5] text-body">
          The requested offer page no longer exists in your filtered results. Showing page {paginated.page} of {paginated.pages}.
          <Link href={pageUrl(paginated.page)} className="ml-2 inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text underline">Use this page link</Link>
        </p>
      ) : null}
      {learnerOfferFocusMissing(query.focus,focused.found) ? (
        <p role="status" className="min-w-0 border-b border-border bg-[var(--lms-neutral-50)] px-4 py-3 text-sm leading-[1.5] text-body">
          The linked offer is not displayed in these results. It may be outside the selected filters or no longer accessible.
          <Link href={learnerOfferRecoveryHref(query.focus)} className="ml-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Find this offer in all my offers</Link>
        </p>
      ) : null}
      {expiringSoon > 0 && view !== "pending" ? (
        <Link href={learnerOfferStatusHref("pending",{searchTerm,dueOnly,sort:order,kind,joining:joiningFilter,expiry})}
          className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
          Review {expiringSoon} awaiting-response {expiringSoon===1?"offer":"offers"} with a deadline in 24 hours →
        </Link>
      ) : null}
      {expiringSoon > 0 ? (
        <div role="status" className="min-w-0 border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm leading-[1.5] text-body">
          <strong>{expiringSoon} {expiringSoon === 1 ? "offer" : "offers"} awaiting response</strong> in this view have a recorded expiry within 24 hours. Check the official offer deadline before acting.
        </div>
      ) : null}
      {!requestRead.available ? <p role="alert" className="min-w-0 border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm leading-[1.5] text-body">Offer extension-request history is temporarily unavailable. Review your recorded offers below; requesting a new extension is disabled until history can be loaded safely.</p> : null}
      {visibleOffers.length === 0 ? (
        <section role="status" className="flex min-h-44 min-w-0 flex-col items-center justify-center rounded-xl border border-border bg-[var(--lms-neutral-50)] px-6 py-12 text-center text-sm leading-[1.5] text-body">
          <h2 className="text-base font-semibold text-foreground">{emptyState.title}</h2>
          <p className="mt-2 text-sm text-body">{emptyState.description}</p>
          {offers.counts.all > 0 ? (
            <Link href="/learn/my-placements/offers"
              className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text hover:underline">
              See all offers →
            </Link>
          ) : null}
        </section>
      ) : (
        <LearnerPlacementOffers
          extensionsAvailable={requestRead.available}
          preserveOrder
          extensionRequests={requests.map(row=>({
            offerId:row.request.offerId,status:row.request.status,
            requestType:row.request.requestType,
          }))}
          snapshotNowIso={snapshotNowIso}
          offers={paginated.items.map((row) => ({
            offerId: row.offer.id,
            applicationId: row.offer.applicationId,
            companyName: row.company.name,
            jobTitle: row.job.title,
            roleTitle: row.offer.roleTitle,
            kind: row.offer.kind === "LOI" ? "LOI" as const : "OFFER" as const,
            status: row.offer.status as "ISSUED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN",
            annualCtcInr: row.offer.annualCtcInr,
            letterHref: safeLearnerOfferLetterHref(row.offer.offerLetterUrl),
            countsAsPlaced: learnerOfferCountsAsPlaced({kind:row.offer.kind==="LOI"?"LOI":"OFFER",
              jobEmploymentType:row.job.employmentType,roleEmploymentType:row.role.employmentType}),
            joiningDate: row.offer.joiningDate,
            expiresAt: row.offer.expiresAt?.toISOString() ?? null,
            issuedAt: row.offer.issuedAt.toISOString(),
            acceptanceChannel: row.offer.acceptanceChannel,
            acceptedDisputableUntil: row.offer.acceptedDisputableUntil?.toISOString()??null,
            joining: row.joining
              ? {
                  status: row.joining.status as
                    "PENDING" | "JOINED" | "DID_NOT_JOIN" | "DEFERRED",
                  joiningDate: row.joining.joiningDate,
                  reason: row.joining.reason,
                }
              : null,
          }))}
        />
      )}
      {paginated.total>0 ? <nav aria-label="Offer results pagination" className="flex flex-wrap items-center gap-3 text-sm">
        <p className="text-muted-foreground">{paginated.from}–{paginated.to} of {paginated.total} matching offers</p>
        {paginated.page>1 ? <Link href={pageUrl(paginated.page-1)} className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-primary-text">Previous</Link> : null}
        <span aria-current="page">Page {paginated.page} of {paginated.pages}</span>
        {paginated.page<paginated.pages ? <Link href={pageUrl(paginated.page+1)} className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-primary-text">Next</Link> : null}
      </nav> : null}
      <section aria-label="How offers work at your college" className="min-w-0 border-b border-border py-4 md:py-6">
        <h2 className="font-semibold text-foreground">How offers work at your college</h2>
        <p className="mt-2 text-sm text-body">Check the offer response deadline and official terms before replying. Accepting a letter of intent is not the same as confirmed joining. College rules may affect how many offers you can hold.</p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link href="/learn/my-placements/rules?from=offers"
            className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline">Read placement rules</Link>
          <Link href="/learn/my-placements/placement"
            className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline">Need more time? Send a request to the placement cell</Link>
        </div>
      </section>
      <p className="text-xs text-muted-foreground">
        Offer actions reuse the existing authorized offer-response endpoint.
        This page does not issue an offer or infer joining from acceptance.
      </p>
    </div>
  );
}
