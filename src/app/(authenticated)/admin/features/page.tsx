import Link from "next/link";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ADMIN_MODULE_LABELS,
  adminFeaturesHref,
  describeModuleDecision,
  collegeModuleCardSummary,
  type AdminModuleDecision,
} from "@/modules/module-access/admin-read-model";
import {
  adminFeatureQuerySchema,
  listSuperAdminFeatureControls,
} from "@/modules/module-access/admin-read-service";
import { OPTIONAL_MODULE_KEYS } from "@/modules/module-access/service";

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

function ModuleState({
  decision,
}: {
  decision: AdminModuleDecision;
}) {
  return (
    <div className="space-y-1.5">
      <StatusBadge
        tone={
          decision.enabled
            ? "success"
            : "neutral"
        }
      >
        {decision.enabled
          ? "Enabled"
          : "Disabled"}
      </StatusBadge>
      <p className="m-0 text-xs leading-5 text-muted-foreground">
        {describeModuleDecision(decision)}
      </p>
    </div>
  );
}

export default async function SuperAdminFeaturesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context =
    await getCurrentRequestContext();

  const params = await searchParams;
  const parsed =
    adminFeatureQuerySchema.safeParse({
      q: one(params.q) || undefined,
      page: one(params.page) || undefined,
    });

  if (!parsed.success) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin · Tenant Controls"
          title="Feature Controls"
          description="Read-only college module access."
        />
        <ErrorState
          title="Invalid feature filters"
          description="The search or page number is invalid. No college module settings were loaded."
          action={
            <Link
              href="/admin/features"
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text"
            >
              Clear filters
            </Link>
          }
        />
      </div>
    );
  }

  const result =
    await listSuperAdminFeatureControls(
      context,
      parsed.data,
    );

  const firstItem =
    result.total === 0
      ? 0
      : (result.page - 1) *
          result.pageSize +
        1;

  const lastItem = Math.min(
    result.total,
    result.page * result.pageSize,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · Tenant Controls"
        title="Feature Controls"
        description="Effective college-level access for the three optional modules configured in vNext: Projects, Placements and Electives. Values are resolved using the existing persisted-rule inheritance and source defaults."
      />

      <section className="rounded-xl border border-border bg-surface p-5">
        <form
          action="/admin/features"
          method="get"
          className="flex flex-wrap items-end gap-3"
        >
          <label className="grid min-w-60 flex-1 gap-2 text-sm font-semibold text-body">
            Find college
            <input
              name="q"
              type="search"
              maxLength={100}
              defaultValue={result.q}
              placeholder="College name or code"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
          >
            Search
          </button>
          <Link
            href="/admin/features"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
          >
            Clear
          </Link>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="m-0 text-lg font-semibold text-foreground">
            College module matrix
          </h2>
          <p className="m-0 text-sm text-muted-foreground">
            {result.total === 0
              ? "No matching active colleges"
              : firstItem > result.total
                ? "Page outside the result range"
                : `${firstItem}–${lastItem} of ${result.total} active colleges`}
          </p>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            title="No colleges on this page"
            description="No active colleges match the current search and selected Super Admin scope. Check the filters or return to the first page."
          />
        ) : (
          <>
          <div className="grid gap-3 lg:hidden" aria-label="College module cards">
            {result.items.map(college => {
              const summary = collegeModuleCardSummary(college.modules);
              return <article key={college.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="m-0 break-words font-semibold text-foreground">{college.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{college.code}</p>
                  </div>
                  <StatusBadge>{summary.enabled} of {college.modules.length} enabled</StatusBadge>
                </div>
                <dl className="mt-4 space-y-3">
                  {college.modules.map(decision => (
                    <div key={decision.module} className="flex flex-wrap items-start justify-between gap-2 border-t border-border pt-3">
                      <dt className="text-sm font-semibold text-foreground">{decision.label}</dt>
                      <dd className="m-0 text-right"><ModuleState decision={decision}/></dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  {summary.locked} locked · {summary.persisted} rules with persisted source
                </p>
                <Link href={`/admin/features/${encodeURIComponent(college.id)}`}
                  className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text">
                  View access hierarchy →
                </Link>
              </article>;
            })}
          </div>
          <div className="hidden rounded-xl border border-border bg-surface lg:block">

            <table className="w-full min-w-[50rem] border-collapse text-left text-sm">
              <thead className="bg-muted text-body">
                <tr>
                  <th
                    scope="col"
                    className="border-b border-border px-4 py-3"
                  >
                    College
                  </th>
                  {OPTIONAL_MODULE_KEYS.map(
                    (module) => (
                      <th
                        key={module}
                        scope="col"
                        className="border-b border-border px-4 py-3"
                      >
                        {ADMIN_MODULE_LABELS[module]}
                      </th>
                    ),
                  )}
                  <th
                    scope="col"
                    className="border-b border-border px-4 py-3"
                  >
                    Module Access
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.items.map(
                  (college) => (
                    <tr
                      key={college.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-4 align-top">
                        <p className="m-0 font-semibold text-foreground">
                          {college.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {college.code}
                        </p>
                      </td>

                      {college.modules.map(
                        (decision) => (
                          <td
                            key={decision.module}
                            className="px-4 py-4 align-top"
                          >
                            <ModuleState
                              decision={decision}
                            />
                          </td>
                        ),
                      )}

                      <td className="px-4 py-4 align-top">
                        <Link
                          href={`/admin/features/${encodeURIComponent(college.id)}`}
                          className="font-semibold text-primary-text hover:underline"
                        >
                          View hierarchy →
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          </>
        )}

        <nav
          aria-label="Feature Controls pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="m-0 text-sm text-muted-foreground">
            Page {result.page} of {result.totalPages}
          </p>
          <div className="flex gap-2">
            {result.page > 1 ? (
              <Link
                href={adminFeaturesHref({
                  q: result.q,
                  page: result.page - 1,
                })}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                ← Previous
              </Link>
            ) : null}
            {result.page < result.totalPages ? (
              <Link
                href={adminFeaturesHref({
                  q: result.q,
                  page: result.page + 1,
                })}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Source: module_access_rules and the existing
        optional-module resolver. A persisted global,
        organization or college rule can override the
        source defaults. This matrix shows college-level
        access, not the access of every individual learner.
        Lower-level Projects/Electives overrides,
        placement participation decisions, and other
        authorization gates may affect a learner&apos;s
        actual experience. No toggles or policy writes
        are available here.
      </p>
    </div>
  );
}
