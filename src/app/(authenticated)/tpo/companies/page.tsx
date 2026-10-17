import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoCompanyMemoryWorkspace } from "@/components/tpo/tpo-company-memory-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { TpoCompanyCreateForm } from "@/components/tpo/tpo-company-create-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  getTpoCompaniesView,
  tpoCompaniesQuerySchema,
} from "@/modules/placements/tpo-companies-view-service";
import type { TpoCompanyRow } from "@/modules/placements/tpo-companies-view-model";

type PageProps = {
  searchParams: Promise<{
    name?: string | string[];
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
  return query ? `/tpo/companies?${query}` : "/tpo/companies";
}

function companyHref(company: TpoCompanyRow) {
  return company.companyId
    ? `/tpo/companies/${encodeURIComponent(company.companyId)}`
    : `/tpo/companies?name=${encodeURIComponent(company.name)}`;
}

export default async function TpoCompanyMemoryPage({
  searchParams,
}: PageProps) {
  const context = await getCurrentRequestContext();

  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }

  const raw = await searchParams;
  const name = first(raw.name)?.trim() ?? "";

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

  if (!parsed.success) {
    return (
      <section role="alert" className="rounded-xl border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold text-foreground">
          Invalid companies filters
        </h1>
        <p className="mt-2 text-sm text-body">
          The requested search or pagination values are invalid.
          No company data was loaded.
        </p>
        <Link
          href="/tpo/companies"
          className="mt-4 inline-block font-semibold text-primary-text hover:underline"
        >
          Clear filters
        </Link>
      </section>
    );
  }

  const query = parsed.data;
  const data = await getTpoCompaniesView(context, query);
  const page = data.page;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Recruiter relationships"
        title="Companies"
        description="Explore college-linked employers, recruiter contacts, drives, offers and confirmed joining outcomes. Company records and activity are read-only here; authorized TPOs may create or link an employer."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <TpoCompanyCreateForm />
            <Link
              href="/tpo/companies/archived"
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
            >
              Archived relationships
            </Link>
            <Link
              href="/tpo/recruiters"
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
            >
              Recruiter leads
            </Link>
          </div>
        }
      />

      {!data.contactsAvailable ? (
        <section
          role="status"
          className="rounded-xl border border-border bg-surface p-4 text-sm leading-6 text-body"
        >
          Recruiter CRM tables are not available in the registered
          database. Contact counts and companies known only from
          recruiter leads are unavailable; zero is not inferred.
          Existing employer relationships and placement outcomes
          remain visible.
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Company records", data.totalCompanies],
          ["Linked employers", data.canonicalCompanies],
          ["Unlinked lead groups", data.unlinkedLeadGroups],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-sm font-semibold text-body">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
              {value}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <form
          action="/tpo/companies"
          method="get"
          className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
        >
          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Search companies
            <input
              type="search"
              name="search"
              maxLength={150}
              defaultValue={query.search ?? ""}
              placeholder="Company name or website"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Sort by
            <select name="sort" defaultValue={query.sort}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground">
              <option value="NAME">Company name</option>
              <option value="CONTACTS">Most contacts</option>
              <option value="DRIVES">Most drives</option>
              <option value="JOINS">Most confirmed joins</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Page size
            <select
              name="pageSize"
              defaultValue={String(query.pageSize)}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>

          <button
            type="submit"
            className="self-end inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {page.total<=2000?<Link
            href={"/api/placements/tpo/companies/export?"+new URLSearchParams({
              ...(query.search?{search:query.search}:{}),sort:query.sort,
            }).toString()}
            className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
            Export companies CSV ({page.total})
          </Link>:<p role="status" className="text-xs text-muted-foreground">
            Narrow your search to 2,000 companies to export all matching rows.
          </p>}
        </div>
        <div className="flex flex-wrap justify-between gap-3">
          <p className="text-sm text-body">
            {page.total} matching company
            {page.total === 1 ? "" : " records"}
          </p>
          <Link
            href="/tpo/companies"
            className="text-sm font-semibold text-primary-text hover:underline"
          >
            Clear filters
          </Link>
        </div>

        {page.items.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8">
            <p className="text-sm text-body">
              {page.total > 0
                ? "This page is outside the available results."
                : "No companies match these filters."}
            </p>
            <Link
              href={companiesHref({
                search: query.search,
                pageSize: query.pageSize,
                sort: query.sort,
              })}
              className="mt-3 inline-block font-semibold text-primary-text hover:underline"
            >
              First page
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[58rem] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Company</th>
                  <th scope="col" className="px-4 py-3">Contacts</th>
                  <th scope="col" className="px-4 py-3">Drives</th>
                  <th scope="col" className="px-4 py-3">Offers</th>
                  <th scope="col" className="px-4 py-3">Accepted</th>
                  <th scope="col" className="px-4 py-3">Confirmed joins</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((company) => (
                  <tr
                    key={
                      company.companyId ??
                      `unlinked:${company.name}`
                    }
                    className="border-t border-border align-top"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={companyHref(company)}
                        className="font-semibold text-primary-text hover:underline"
                      >
                        {company.name}
                      </Link>

                      {company.unlinkedLeadGroup ? (
                        <div className="mt-2">
                          <StatusBadge tone="warning">
                            CRM name only · not linked
                          </StatusBadge>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Linked employer
                        </p>
                      )}

                      {company.websiteUrl ? (
                        <p className="mt-1 max-w-xs truncate text-xs text-body">
                          {company.websiteUrl}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4 tabular-nums">
                      {company.contacts ?? "Unavailable"}
                    </td>
                    <td className="px-4 py-4 tabular-nums">
                      {company.drives}
                    </td>
                    <td className="px-4 py-4 tabular-nums">
                      {company.offers}
                    </td>
                    <td className="px-4 py-4 tabular-nums">
                      {company.acceptedOffers}
                    </td>
                    <td className="px-4 py-4 tabular-nums">
                      {company.confirmedJoinedLearners}
                    </td>
                    <td className="px-4 py-4">
                      {company.companyId?<Link
                        href={"/tpo/placements/new?company="+encodeURIComponent(company.name)}
                        className="whitespace-nowrap font-semibold text-primary-text underline">Create drive</Link>:
                        <span className="text-xs text-muted-foreground">Link company first</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <nav
          aria-label="Companies pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-body">
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
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
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
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav>

        <p className="text-xs leading-5 text-muted-foreground">
          Offer counts represent persisted offer records, including
          historical declined and withdrawn statuses. Confirmed joins
          count distinct learners with accepted offers and recorded
          JOINED outcomes. Free-text recruiter company names are
          deliberately not merged into canonical employer IDs.
        </p>
      </section>
    </div>
  );
}
