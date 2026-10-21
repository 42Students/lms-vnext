import {TpoCompaniesSpreadsheet} from "@/components/tpo/tpo-companies-spreadsheet";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { TpoCompanyMemoryWorkspace } from "@/components/tpo/tpo-company-memory-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TpoCompanyCreateForm } from "@/components/tpo/tpo-company-create-form";
import { can } from "@/modules/permissions/policy";
import {
  getTpoCompaniesView,
  searchTpoCompanyCandidates,
  tpoCompaniesQuerySchema,
} from "@/modules/placements/tpo-companies-view-service";
import {tpoCompanyFiltersShapeValid} from "@/modules/placements/tpo-company-url-validation";

type PageProps = {
  searchParams: Promise<{
    name?: string | string[];
    discover?: string | string[];
    q?: string | string[];
    directory?: string | string[];
    search?: string | string[];
    page?: string | string[];
    pageSize?: string | string[];
    sort?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function companiesHref(
  filters: {
    search?: string;
    page?: number;
    pageSize?: number;
    sort?: "NAME"|"CONTACTS"|"DRIVES"|"JOINS";
  },
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.sort && filters.sort !== "NAME") params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }
  if (filters.pageSize && filters.pageSize !== 25) {
    params.set("pageSize", String(filters.pageSize));
  }

  const query = params.toString();
  return query ? `/tpo/companies?${query}` : "/tpo/companies?directory=1";
}


/** Reject ambiguous multi-valued deep-links without silently choosing one. */
function invalidCompanyFilters(){
 return <section role="alert" className="space-y-3">
  <PageHeader title="Invalid companies filters" />
  <p className="mt-2 text-sm text-body leading-[22px]">
   The requested search or pagination values are invalid. No company data was loaded.
  </p>
  <Link href="/tpo/companies?directory=1" className="lms-inline-link mt-4 inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
   Clear filters
  </Link>
 </section>;
}

export default async function TpoCompanyMemoryPage({
  searchParams,
}: PageProps) {
  const context = await getCurrentRequestContext();

  if (
    !context.membership ||
    !can(context,"placements.manage",{collegeId:context.membership.collegeId})
  ) {
    redirect("/dashboard");
  }
  await requireTpoBatchActor(context);

  const raw = await searchParams;
  if(!tpoCompanyFiltersShapeValid(raw))return invalidCompanyFilters();
  const name = first(raw.name)?.trim() ?? "";
  const discoveryRequested=first(raw.discover)==="1"||first(raw.q)!==undefined;
  const q=first(raw.q)?.trim()??"";
  if(discoveryRequested&&!name){
   if(q.length>120 || (q.length>0&&q.length<2))return invalidCompanyFilters();
   const results=q?await searchTpoCompanyCandidates(context,{
    collegeId:context.membership.collegeId,q,
   }):null;
   return <div className="min-w-0 space-y-4">
    <PageHeader title="Find a company"
     description="Search verified global employer names and domains. Private contacts and other colleges' relationships are never shown."/>
    <form method="get" action="/tpo/companies" role="search" aria-label="Find a company"
      className="flex min-w-0 flex-wrap items-end gap-3 border-b border-border pb-4">
     <input type="hidden" name="discover" value="1"/>
     <label className="grid min-w-0 flex-1 gap-2 text-sm font-semibold">Company name or domain
      <Input type="search" name="q" minLength={2} maxLength={120} defaultValue={q}
       placeholder="At least two characters" className="min-h-11"/>
     </label>
     <Button type="submit">Search companies</Button>
    </form>
    <p className="text-sm text-body">{results?
      results.items.length+" matching global employer"+(results.items.length===1?"":"s")+
      " (up to "+results.limit+" shown)":
      "Enter a company name or domain to search."}</p>
    {results?.items.length?<ul className="divide-y divide-border border-y border-border">
     {results.items.map(item=><li key={item.companyId} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0"><p className="font-semibold">{item.name}</p>
       <p className="break-all text-sm text-body">{item.primaryDomain??"No verified primary domain"}</p>
      </div>
      <span className="text-sm text-muted-foreground">{item.linkedToCollege?
       "Linked to your college":"Not linked to your college"}</span>
     </li>)}
    </ul>:q?<EmptyState title="No matching companies" description="Try another name or verified domain."/>:null}
    <Link href="/tpo/companies?directory=1" className="inline-flex min-h-11 items-center text-link underline md:min-h-9">
     Back to college companies
    </Link>
   </div>;
  }

  // Preserve named Company Memory deep links, but keep the legacy Engage
  // Companies view as the default without losing bookmarked directory filters.
  if (!name && first(raw.directory)!=="1" && !first(raw.search) &&
      !first(raw.sort) && !first(raw.page) && !first(raw.pageSize)) {
    redirect("/tpo/recruiters?view=companies");
  }

  // Preserve the existing Company Memory URL and its behavior.
  if (name) {
    return (
      <TpoCompanyMemoryWorkspace
        collegeId={context.membership.collegeId}
        companyName={name}
        actorMembershipId={context.membership.id}
      />
    );
  }

  const parsed = tpoCompaniesQuerySchema.safeParse({
    collegeId: context.membership.collegeId,
    search: first(raw.search) || undefined,
    page: first(raw.page) || undefined,
    pageSize: first(raw.pageSize) || undefined,
    sort: first(raw.sort) || undefined,
  });

  if (!parsed.success) return invalidCompanyFilters();

  const query = parsed.data;
  const data = await getTpoCompaniesView(context, query);
  const page = data.page;

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader
        eyebrow="TPO · Recruiter relationships"
        title="Companies"
        description="Explore college-linked employers, recruiter contacts, drives, offers and confirmed joining outcomes. Company records and activity are read-only here; authorized TPOs may create or link an employer."
        actions={
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-end">
            <TpoCompanyCreateForm />
            <Link href="/tpo/companies?discover=1" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">Find global company</Link>
            <details className="group min-w-0 sm:relative">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link marker:hidden focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 [&::-webkit-details-marker]:hidden">
                Company links
              </summary>
              <nav aria-label="Other company destinations" className="mt-2 flex min-w-0 flex-col gap-1 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 sm:absolute sm:right-0 sm:z-20 sm:w-52 sm:shadow-sm">
                <Link href="/tpo/companies/archived" className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] px-3 text-sm font-semibold text-link underline hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                  Archived relationships
                </Link>
                <Link href="/tpo/recruiters" className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] px-3 text-sm font-semibold text-link underline hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                  Recruiter leads
                </Link>
              </nav>
            </details>
          </div>
        }
      />

      {!data.contactsAvailable ? (
        <section
          role="status"
          className="border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm leading-6 text-body"
        >
          Recruiter CRM tables are not available in the registered
          database. Contact counts and companies known only from
          recruiter leads are unavailable; zero is not inferred.
          Existing employer relationships and placement outcomes
          remain visible.
        </section>
      ) : null}

      <div className="grid min-w-0 grid-cols-1 gap-0 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border md:grid-cols-3">
        {[
          ["Company records", data.totalCompanies],
          ["Linked employers", data.canonicalCompanies],
          ["Unlinked lead groups", data.unlinkedLeadGroups],
        ].map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 border-b border-border bg-surface px-4 py-3 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
          >
            <p className="text-sm font-semibold text-body leading-[22px]">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
              {value}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <form role="search" aria-label="tpo companies filters"
          action="/tpo/companies"
          method="get"
          className="grid min-w-0 grid-cols-1 gap-[8px] border-b border-border py-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
        >
          <label className="flex flex-col gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Search companies
            <Input
              type="search"
              name="search"
              maxLength={150}
              defaultValue={query.search ?? ""}
              placeholder="Company name or website"
              className="min-h-11 md:min-h-9"
            />
          </label>

          <label className="flex flex-col gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Sort by
            <Select name="sort" defaultValue={query.sort}
              className="min-h-11 md:min-h-9">
              <option value="NAME">Company name</option>
              <option value="CONTACTS">Most contacts</option>
              <option value="DRIVES">Most drives</option>
              <option value="JOINS">Most confirmed joins</option>
            </Select>
          </label>
          <label className="flex flex-col gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Page size
            <Select
              name="pageSize"
              defaultValue={String(query.pageSize)}
              className="min-h-11 md:min-h-9"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </label>

          <Button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center self-end rounded-[var(--lms-control-radius)] bg-primary px-6 text-sm font-[650] text-on-primary hover:bg-primary-hover md:min-h-9 xl:w-auto"
          >
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {page.total<=2000?<Link
            href={"/api/placements/tpo/companies/export?"+new URLSearchParams({
              ...(query.search?{search:query.search}:{}),sort:query.sort,
            }).toString()}
            className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link">
            Export companies CSV ({page.total})
          </Link>:<p role="status" className="text-xs text-muted-foreground leading-5">
            Narrow your search to 2,000 companies to export all matching rows.
          </p>}
        </div>
        <div className="flex flex-wrap justify-between gap-3">
          <p className="text-sm text-body leading-[22px]">
            {page.total} matching company
            {page.total === 1 ? "" : " records"}
          </p>
          <Link
            href="/tpo/companies?directory=1"
            className="text-sm font-semibold text-link hover:underline"
          >
            Clear filters
          </Link>
        </div>

        {page.items.length === 0 ? (
          <div className="border-y border-border py-3">
            <EmptyState
              title={page.total > 0
                ? "This page is outside the available results."
                : "No companies match these filters."}
              action={
                <Link href={companiesHref({
                  search: query.search,
                  pageSize: query.pageSize,
                  sort: query.sort,
                })} className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                  First page
                </Link>
              }
            />
          </div>
        ) : (
          <TpoCompaniesSpreadsheet rows={page.items}/>
        )}

        {page.totalPages > 1 ? <nav
          aria-label="Companies pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-body leading-[22px]">
            Page {page.page} of {Math.max(1, page.totalPages)}
          </p>
          <div className="flex gap-2">
            {page.page > 1 ? (
              <Link
                href={companiesHref({
                  search: query.search,
                  pageSize: query.pageSize,
                sort: query.sort,
                  page: page.page - 1,
                })}
                className="lms-inline-link inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)]"
              >
                Previous
              </Link>
            ) : null}

            {page.page < page.totalPages ? (
              <Link
                href={companiesHref({
                  search: query.search,
                  pageSize: query.pageSize,
                sort: query.sort,
                  page: page.page + 1,
                })}
                className="lms-inline-link inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)]"
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav> : null}

        <details className="border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
          <summary className="min-h-11 cursor-pointer font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">About company counts</summary>
          <p className="max-w-3xl pb-2 leading-5">
          Offer counts represent persisted offer records, including
          historical declined and withdrawn statuses. Confirmed joins
          count distinct learners with accepted offers and recorded
          JOINED outcomes. Free-text recruiter company names are
          deliberately not merged into canonical employer IDs.
          </p>
        </details>
      </section>
    </div>
  );
}
