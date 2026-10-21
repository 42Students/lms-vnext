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

  const scopeKey = [
    context.adminScope?.organizationId ?? "",
    context.adminScope?.collegeId ?? "",
  ].join(":");

  return (
    <SuperAdminHrAccounts
      key={scopeKey}
      list={list}
      filters={filters}
      loadError={loadError}
      statusSummary={statusSummary}
      scopeDescription={scopeDescription}
      selectedCollegeId={context.adminScope?.collegeId??null}
    />
  );
}
