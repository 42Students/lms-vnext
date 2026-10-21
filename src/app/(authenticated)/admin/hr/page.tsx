import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { SuperAdminHrAccounts } from "@/components/admin/super-admin-hr-accounts";
import type {
  HrAccount,
  HrAccountsPageData,
  HrListFilters,
} from "@/components/admin/super-admin-hr-types";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/modules/permissions/policy";
import {
  listSuperAdminHrAccounts,
  getSuperAdminHrStatusSummary,
} from "@/modules/placements/super-admin-hr-service";
import {
  parseSuperAdminHrPageParams,
} from "@/modules/placements/super-admin-hr-validation";

type SearchParams = Record<
  string,
  string | string[] | undefined
>;

export default async function SuperAdminHrPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context =
    await getCurrentRequestContext();

  requirePermission(
    context,
    "admin-scope.select",
  );

  const params = await searchParams;

  // Legacy recruiter list used zero-based page + size=25. Accept that
  // bookmark shape, but retain the vNext one-based canonical URLs.
  if(typeof params.size==="string" && params.size==="25" &&
     (params.page===undefined || (typeof params.page==="string" && /^[0-9]{1,5}$/.test(params.page)))) {
    const oldPage=Number(params.page??"0");
    if(Number.isSafeInteger(oldPage)&&oldPage>=0&&oldPage<10000) {
      const target=new URLSearchParams();
      if(typeof params.q==="string"&&params.q.trim())target.set("q",params.q.slice(0,120));
      if(typeof params.status==="string"&&params.status)target.set("status",params.status);
      if(oldPage)target.set("page",String(oldPage+1));
      redirect("/admin/recruiters"+(target.size?"?"+target.toString():""));
    }
  }
  const parsed = parseSuperAdminHrPageParams(params);

  if (!parsed) {
    return (
      <div className="min-w-0 space-y-4 md:space-y-6">
        <PageHeader
          title="Recruiter accounts"
          description="Employer recruiter administration."
        />
        <ErrorState
          title="Invalid account filters"
          description="The supplied search, status or pagination values are invalid. Return to Recruiter Accounts and retry."
          action={
            <Link
              href="/admin/recruiters"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-primary-text sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white"
            >
              Reset filters
            </Link>
          }
        />
      </div>
    );
  }

  const query = parsed;

  let list: HrAccountsPageData | null = null;
  let loadError: string | null = null;

  try {
    const result =
      await listSuperAdminHrAccounts(
        context,
        query,
      );

    const items: HrAccount[] =
      result.items.map((account) => ({
        userId: account.userId,
        displayName: account.displayName,
        phoneE164: account.phoneE164,
        email: account.email,
        companyId: account.companyId,
        companyName: account.companyName,
        title: account.title,
        status: account.status,
        accountManageable:account.accountManageable,
        grants: account.grants.map(
          (grant) => ({
            id: grant.id,
            recruiterUserId:
              grant.recruiterUserId,
            companyRelationshipId:
              grant.companyRelationshipId,
            companyId: grant.companyId,
            collegeId: grant.collegeId,
            collegeName: grant.collegeName,
            organizationId:
              grant.organizationId,
            status: grant.status,
            validUntil: grant.validUntil?.toISOString()??null,
            verificationStatus: grant.verificationStatus,
          }),
        ),
      }));

    list = {
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  } catch {
    loadError =
      "The recruiter directory could not be loaded. Retry the request or check the selected administrative scope.";
  }

  // Recruiter list remains usable if its independent summary query fails.
  // Do not invent zero accounts for unknown totals.
  let statusSummary:Awaited<ReturnType<typeof getSuperAdminHrStatusSummary>>|null=null;
  try{
    statusSummary=await getSuperAdminHrStatusSummary(context);
  }catch{
    // The status panel shows Unavailable with a reload affordance.
  }
  const scopeDescription=context.adminScope?.collegeId?"Viewing selected college.":context.adminScope?.organizationId?"Viewing selected organization.":"Viewing platform-wide accounts.";
  const filters: HrListFilters = {
    q: query.q ?? "",
    status: query.status ?? "",
    page: query.page,
    pageSize: query.pageSize,
  };

  if (
    list &&
    list.total > 0 &&
    query.page > list.totalPages
  ) {
    const nextParams = new URLSearchParams();

    if (filters.q) {
      nextParams.set("q", filters.q);
    }
    if (filters.status) {
      nextParams.set(
        "status",
        filters.status,
      );
    }
    if (filters.pageSize !== 25) {
      nextParams.set(
        "pageSize",
        String(filters.pageSize),
      );
    }
    if (list.totalPages > 1) {
      nextParams.set(
        "page",
        String(list.totalPages),
      );
    }

    const nextQuery = nextParams.toString();

    redirect(
      nextQuery
        ? `/admin/recruiters?${nextQuery}`
        : "/admin/recruiters",
    );
  }

  // These are counts for the visible page, not platform-wide totals.
  // The old Deleted state is a migration-only provenance field and must not
  // be inferred from a DISABLED platform identity.
  const pageLifecycle = list ? {
    active: list.items.filter(item=>item.status==="ACTIVE").length,
    suspended: list.items.filter(item=>item.status==="ARCHIVED").length,
    disabled: list.items.filter(item=>item.status==="DISABLED").length,
    deleted: list.items.filter(item=>item.legacyStatus==="DELETED").length,
    hasLegacyProvenance: list.items.some(item=>item.legacyStatus!=null),
  } : null;

  const scopeKey = [
    context.adminScope?.organizationId ?? "",
    context.adminScope?.collegeId ?? "",
  ].join(":");

  return (
    <div className="min-w-0 space-y-3">
      <nav aria-label="Recruiter administration location" className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link href="/admin/placements" className="min-h-9 content-center font-semibold text-link underline">
          Placements</Link>
        <span aria-hidden="true">›</span><span>Recruiter accounts</span>
        <span className="text-body">· {scopeDescription}</span>
      </nav>
      {pageLifecycle ? <section aria-label="Recruiter lifecycle counts on this page"
        className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">On this page · {list?.items.length??0} recruiters</p>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><dt className="text-muted-foreground">Active</dt>
            <dd className="font-semibold tabular-nums">{pageLifecycle.active}</dd></div>
          <div><dt className="text-muted-foreground">Suspended</dt>
            <dd className="font-semibold tabular-nums">{pageLifecycle.suspended}</dd></div>
          <div><dt className="text-muted-foreground">Disabled</dt>
            <dd className="font-semibold tabular-nums">{pageLifecycle.disabled}</dd></div>
          <div><dt className="text-muted-foreground">Deleted (legacy)</dt>
            <dd className="font-semibold tabular-nums">
              {pageLifecycle.hasLegacyProvenance?pageLifecycle.deleted:"Not available"}</dd></div>
        </dl>
      </section> : null}
      <p role="note" className="max-w-3xl text-xs text-muted-foreground">
        Changing the selected college or organization reloads this directory and closes unsaved
        recruiter forms. Save or discard your edits before switching. Search and pagination use
        the selected scope; <Link href="/admin/recruiters" className="font-semibold text-link underline">
          reset filters</Link> after switching if the previous search no longer applies.
      </p>
      <p role="note" className="max-w-3xl text-xs leading-5 text-muted-foreground">
        Recruiter college access is now time-limited and verified. New grants expire
        after three months unless an explicit future expiry (up to five years) is
        provided. Legacy indefinite grants must be reviewed rather than silently
        converted to a new permanent grant. Recruiter accounts and college access
        options load independently; retry an unavailable section without creating
        or renewing any grant.
      </p>
      <SuperAdminHrAccounts
      key={scopeKey}
      list={list}
      filters={filters}
      loadError={loadError}
      statusSummary={statusSummary}
      scopeDescription={scopeDescription}
      selectedCollegeId={context.adminScope?.collegeId??null}
      />
    </div>
  );
}
