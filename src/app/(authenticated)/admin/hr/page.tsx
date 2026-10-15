import { redirect } from "next/navigation";
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
} from "@/modules/placements/super-admin-hr-service";
import {
  superAdminHrListQuerySchema,
} from "@/modules/placements/super-admin-hr-validation";

type SearchParams = Record<
  string,
  string | string[] | undefined
>;

function one(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

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

  const parsed =
    superAdminHrListQuerySchema.safeParse({
      q: one(params.q),
      status: one(params.status),
      page: one(params.page),
      pageSize: one(params.pageSize),
    });

  if (!parsed.success) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Recruiter Accounts"
          description="Employer recruiter administration."
        />
        <ErrorState
          title="Invalid account filters"
          description="The supplied search, status or pagination values are invalid. Return to Recruiter Accounts and retry."
          action={
            <a
              href="/admin/recruiters"
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body"
            >
              Reset filters
            </a>
          }
        />
      </div>
    );
  }

  const query = parsed.data;

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
    />
  );
}
