import { learnerOffersEmptyState } from "@/modules/placements/learner-offers-empty-state-model";
import Link from "next/link";
import {learnerOfferPageSchema,paginateOwnOffers} from "@/modules/placements/learner-offers-pagination-model";
import {learnerOfferSortSchema,sortOwnOfferRows} from "@/modules/placements/learner-offers-sort-model";
import {learnerOfferStatusHref} from "@/modules/placements/learner-offers-navigation-model";
import {learnerOfferKindSchema,filterOwnOffersByKind} from "@/modules/placements/learner-offer-kind-model";
import {learnerJoiningFilterSchema,filterOwnOffersByJoining} from "@/modules/placements/learner-offer-joining-filter-model";
import { learnerOffersSearchSchema, searchOwnOffers } from "@/modules/placements/learner-offers-search-model";
import { ownOffersDueWithinWeek } from "@/modules/placements/learner-offers-due-model";
import { learnerOffersExpiringSoon } from "@/modules/placements/learner-offers-expiring-soon-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerPlacementOffers } from "@/components/placements/learner-placement-offers";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnLearnerOfferBrowse } from "@/modules/placements/learner-offers-browse-service";
import {listOwnPlacementRequests} from "@/modules/placements/request-service";
import {
  learnerOfferViewSchema,
  type LearnerOfferView,
} from "@/modules/placements/learner-offers-browse-model";

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
  { id: "all", label: "All offers" },
  { id: "pending", label: "Awaiting response" },
  { id: "accepted", label: "Accepted" },
  { id: "closed", label: "Declined / withdrawn" },
];

export default async function LearnerOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; q?: string | string[]; due?: string | string[]; page?: string | string[]; sort?: string | string[]; kind?: string | string[]; joining?:string | string[] }>;
}) {
  const query = await searchParams;
  const requested = typeof query.status === "string" ? query.status : "all";
  const validView = learnerOfferViewSchema.safeParse(requested);
  const view = validView.success ? validView.data : "all";
  const parsedSearch = learnerOffersSearchSchema.safeParse(query.q ?? "");
  const searchTerm = parsedSearch.success ? parsedSearch.data : "";
  const dueOnly = query.due === "1";
  const context = await getCurrentRequestContext();
  const [offers,requests] = await Promise.all([
    getOwnLearnerOfferBrowse(context,view),listOwnPlacementRequests(context),
  ]);
  const snapshotNowIso = new Date().toISOString();
  const kindInput=learnerOfferKindSchema.safeParse(query.kind ?? "all");
  const kind=kindInput.success?kindInput.data:"all";
  const joiningInput=learnerJoiningFilterSchema.safeParse(query.joining ?? "all");
  const joiningFilter=joiningInput.success?joiningInput.data:"all";
  const searchedOffers = filterOwnOffersByJoining(filterOwnOffersByKind(searchOwnOffers(offers.items, searchTerm),kind),joiningFilter);
  const visibleOffers = dueOnly ? ownOffersDueWithinWeek(searchedOffers,Date.parse(snapshotNowIso)) : searchedOffers;
  const pageResult = learnerOfferPageSchema.safeParse(query.page ?? "1");
  const requestedPage = pageResult.success ? pageResult.data : 1;
  const sortParsed=learnerOfferSortSchema.safeParse(query.sort ?? "priority");
  const order=sortParsed.success?sortParsed.data:"priority";
  const sorted=sortOwnOfferRows(visibleOffers,order,Date.parse(snapshotNowIso));
  const paginated = paginateOwnOffers(sorted,requestedPage,15);
  const emptyState = learnerOffersEmptyState(offers.counts.all, Boolean(searchTerm) || dueOnly || kind !== "all" || joiningFilter !== "all");
  const pageUrl=(page:number)=>"/learn/my-placements/offers?"+new URLSearchParams({
    ...(view!=="all"?{status:view}:{}),...(searchTerm?{q:searchTerm}:{}),
    ...(dueOnly?{due:"1"}:{}),...(order!=="priority"?{sort:order}:{}),...(kind!=="all"?{kind}:{}),...(joiningFilter!=="all"?{joining:joiningFilter}:{}),page:String(page),
  }).toString();
  const kindHref=(nextKind:"all"|"offer"|"loi")=>learnerOfferStatusHref(view,{searchTerm,dueOnly,sort:order,kind:nextKind,joining:joiningFilter});
  const expiringSoon = learnerOffersExpiringSoon(visibleOffers.map(row => ({
    status: row.offer.status, expiresAt: row.offer.expiresAt?.toISOString() ?? null,
  })), Date.parse(snapshotNowIso));

  return (
    <div className="space-y-6">
      <Link
        href="/learn/my-placements/applications"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline"
      >
        ← Applications
      </Link>
      <PageHeader
        eyebrow="My Placements"
        title="My offers"
        description="Official persisted offers, current response status and recorded joining outcomes."
      />
      <nav aria-label="Offer status" className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={learnerOfferStatusHref(tab.id,{searchTerm,dueOnly,sort:order,kind,joining:joiningFilter})}
            aria-current={view === tab.id ? "page" : undefined}
            className={view === tab.id
              ? "inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-on-primary"
              : "inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold text-body hover:bg-primary-subtle"}
          >
            {tab.label} ({offers.counts[tab.id]})
          </Link>
        ))}
      </nav>
      <form method="GET" action="/learn/my-placements/offers" className="flex min-w-0 flex-wrap items-end gap-3">
        {view !== "all" ? <input type="hidden" name="status" value={view} /> : null}
        {dueOnly ? <input type="hidden" name="due" value="1" /> : null}
        {order !== "priority" ? <input type="hidden" name="sort" value={order} /> : null}
        {kind !== "all" ? <input type="hidden" name="kind" value={kind} /> : null}
        {joiningFilter!=="all"?<input type="hidden" name="joining" value={joiningFilter}/>:null}
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-foreground">
          Search my offers
          <input name="q" type="search" maxLength={80} defaultValue={searchTerm}
            placeholder="Employer or role" className="min-h-11 min-w-0 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Search</button>
        {searchTerm ? <Link href={learnerOfferStatusHref(view,{searchTerm:"",dueOnly,sort:order,kind,joining:joiningFilter})}
          className="inline-flex min-h-11 items-center text-sm text-primary-text underline">Clear search</Link> : null}
      </form>
      <form method="GET" action="/learn/my-placements/offers" className="flex flex-wrap items-end gap-3">
        {view!=="all"?<input type="hidden" name="status" value={view}/>:null}
        {searchTerm?<input type="hidden" name="q" value={searchTerm}/>:null}
        {dueOnly?<input type="hidden" name="due" value="1"/>:null}
        {kind!=="all"?<input type="hidden" name="kind" value={kind}/>:null}
        {joiningFilter!=="all"?<input type="hidden" name="joining" value={joiningFilter}/>:null}
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Sort my offers
          <select name="sort" defaultValue={order} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="priority">Needs response first</option>
            <option value="newest">Newest issued</option>
            <option value="company">Company A–Z</option>
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Apply sort</button>
      </form>
      <nav aria-label="Recorded joining outcome" className="flex flex-wrap gap-3 text-sm">
        {joiningTabs.map(tab => (
          <Link key={tab.id}
            href={learnerOfferStatusHref(view,{searchTerm,dueOnly,sort:order,kind,joining:tab.id})}
            aria-current={joiningFilter===tab.id?"page":undefined}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-primary-text">
            {tab.label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Offer document kind" className="flex flex-wrap gap-3 text-sm">
        {kindTabs.map(({id:value,label})=><Link key={value} href={kindHref(value)}
          aria-current={kind===value?"page":undefined}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-primary-text">
          {label}
        </Link>)}
      </nav>
      <nav aria-label="Offer deadline filter" className="flex flex-wrap gap-3 text-sm">
        <Link href={learnerOfferStatusHref(view,{searchTerm,dueOnly:false,sort:order,kind,joining:joiningFilter})}
          aria-current={!dueOnly?"page":undefined}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-primary-text">All deadlines</Link>
        <Link href={learnerOfferStatusHref(view,{searchTerm,dueOnly:true,sort:order,kind,joining:joiningFilter})}
          aria-current={dueOnly?"page":undefined}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-primary-text">Awaiting response · next 7 days</Link>
      </nav>
      {expiringSoon > 0 && view !== "pending" ? (
        <Link href={learnerOfferStatusHref("pending",{searchTerm,dueOnly,sort:order,kind,joining:joiningFilter})}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Review {expiringSoon} awaiting-response {expiringSoon===1?"offer":"offers"} with a deadline in 24 hours →
        </Link>
      ) : null}
      {expiringSoon > 0 ? (
        <div role="status" className="rounded-xl border border-warning bg-surface p-4 text-sm text-body">
          <strong>{expiringSoon} {expiringSoon === 1 ? "offer" : "offers"} awaiting response</strong> in this view have a recorded expiry within 24 hours. Check the official offer deadline before acting.
        </div>
      ) : null}
      {visibleOffers.length === 0 ? (
        <section role="status" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">{emptyState.title}</h2>
          <p className="mt-2 text-sm text-body">{emptyState.description}</p>
          {offers.counts.all > 0 ? (
            <Link href="/learn/my-placements/offers"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
              See all offers →
            </Link>
          ) : null}
        </section>
      ) : (
        <LearnerPlacementOffers
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
            joiningDate: row.offer.joiningDate,
            expiresAt: row.offer.expiresAt?.toISOString() ?? null,
            issuedAt: row.offer.issuedAt.toISOString(),
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
        {paginated.page>1 ? <Link href={pageUrl(paginated.page-1)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Previous</Link> : null}
        <span aria-current="page">Page {paginated.page} of {paginated.pages}</span>
        {paginated.page<paginated.pages ? <Link href={pageUrl(paginated.page+1)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Next</Link> : null}
      </nav> : null}
      <p className="text-xs text-muted-foreground">
        Offer actions reuse the existing authorized offer-response endpoint.
        This page does not issue an offer or infer joining from acceptance.
      </p>
    </div>
  );
}
