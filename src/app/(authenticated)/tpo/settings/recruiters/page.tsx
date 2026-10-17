import Link from "next/link";
import {TpoRecruiterDurationEditor} from "@/components/tpo/tpo-communication-settings-editors";
import {getTpoCommunicationSettings} from "@/modules/placements/tpo-communication-settings-service";
import { redirect } from "next/navigation";

import { TpoRecruiterGrantForm, TpoRecruiterRevoke, TpoRecruiterExtend } from "@/components/placements/tpo-recruiter-grant-controls";
import { TpoPublicJoinLinkCard } from "@/components/tpo/tpo-public-join-link-card";
import { getTpoPublicJoinLinkStatus } from "@/modules/placements/tpo-public-join-link-service";
import { getTpoTrustedCompanies } from "@/modules/placements/tpo-settings-people-service";
import {
  getCurrentRequestContext,
} from "@/auth/request-context";
import {
  TpoSettingsNav,
} from "@/components/placements/tpo-settings-nav";
import {
  EmptyState,
} from "@/components/ui/empty-state";
import {
  ErrorState,
} from "@/components/ui/error-state";
import {
  PageHeader,
} from "@/components/ui/page-header";
import {
  StatusBadge,
} from "@/components/ui/status-badge";
import {
  hasMembershipRole,
} from "@/modules/identity/context";
import {
  TPO_RECRUITER_ACCESS_FILTERS,
  tpoRecruiterAccessHref,
  nextTpoRecruiterGrantPage,
  tpoRecruiterAccessQuerySchema,
} from "@/modules/placements/tpo-recruiter-access-model";
import {
  listTpoRecruiterAccess,
} from "@/modules/placements/tpo-recruiter-access-service";
import {tpoRecruiterGrantExportHref} from "@/modules/placements/tpo-recruiter-grant-export-model";

type SearchParams = {
  status?: string | string[];
  page?: string | string[];
  q?: string | string[];
};

function first(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

export default async function TpoRecruiterAccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context =
    await getCurrentRequestContext();

  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const parsed =
    tpoRecruiterAccessQuerySchema.safeParse({
      status:
        first(params.status) || undefined,
      q: first(params.q) || "",
      page:
        first(params.page) || undefined,
    });

  if (!parsed.success) {
    return (
      <div className="space-y-6">
        <TpoSettingsNav active="recruiters" />

        <PageHeader
          eyebrow="TPO · Settings"
          title="Recruiter access"
          description="Read-only recruiter college-grant history."
        />

        <ErrorState
          title="Invalid recruiter access filters"
          description="The grant status or requested page is invalid. No recruiter access records were loaded."
          action={
            <Link
              href="/tpo/settings/recruiters"
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text"
            >
              Clear filters
            </Link>
          }
        />
      </div>
    );
  }

  const [data, linkedCompanies, publicLink,communication] = await Promise.all([
    listTpoRecruiterAccess(context, parsed.data),
    getTpoTrustedCompanies(context, context.membership.collegeId),
    getTpoPublicJoinLinkStatus(context, "COLLEGE"),
    getTpoCommunicationSettings(context),
  ]);

  const {
    query,
    items,
    total,
    page,
    pageSize,
    totalPages,
  } = data;

  const firstRecord =
    total > 0 &&
    items.length > 0
      ? (page - 1) * pageSize + 1
      : 0;

  const lastRecord =
    items.length > 0
      ? Math.min(
          total,
          page * pageSize,
        )
      : 0;

  return (
    <div className="space-y-6">
      <TpoSettingsNav active="recruiters" />

      <PageHeader
        eyebrow="TPO · Settings"
        title="Recruiter access"
        description="Review active and revoked recruiter college-access grants for your current college. This is historical grant data, not a live recruiter-session or login-status check."
      />

      {communication.ready?<TpoRecruiterDurationEditor initial={communication.recruiterAccessMonths} version={communication.version}/>:
       <p role="status" className="rounded border border-border p-4 text-sm">Recruiter access duration settings are not available yet.</p>}
      <TpoPublicJoinLinkCard initial={publicLink} scope="COLLEGE" />

      <TpoRecruiterGrantForm companies={linkedCompanies.companies.map((company) => ({
        relationshipId: company.relationshipId,
        name: company.name,
      }))} />

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">
          College recruiter grants
        </h2>

        <p className="mt-1 text-sm leading-6 text-body">
          Each row represents one persisted
          recruiter-to-college-company grant.
          A recruiter can have more than one
          historical grant. Revoked records
          remain visible for access review.
        </p>

        <form
          action="/tpo/settings/recruiters"
          method="get"
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <label className="grid min-w-44 gap-2 text-sm font-semibold text-body">
            Grant status
            <select
              name="status"
              defaultValue={query.status}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            >
              {TPO_RECRUITER_ACCESS_FILTERS.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status === "ALL"
                      ? "All grants"
                      : status === "ACTIVE"
                        ? "Active grants"
                        : status==="REVOKED"?"Revoked grants":status==="ENDING_SOON"?"Ending in 30 days":"Ended or removed"}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="grid min-w-44 gap-2 text-sm font-semibold text-body">
            Search recruiter or company
            <input type="search" name="q" defaultValue={query.q} maxLength={80}
              placeholder="Name contains..."
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground" />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
          >
            Apply
          </button>

          <Link
            href="/tpo/settings/recruiters"
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
          >
            Clear
          </Link>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Grant records
          </h2>
          <a href={tpoRecruiterGrantExportHref(query)}
            className="inline-flex min-h-10 items-center rounded border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
            Export filtered grants CSV
          </a>

          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "No matching grants"
              : firstRecord === 0
                ? "No grants on this page"
                : `${firstRecord}–${lastRecord} of ${total} grants`}
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title={
              total === 0
                ? "No recruiter grants found"
                : "No grants on this page"
            }
            description={
              total === 0
                ? "No recruiter access grants with the selected status were recorded for your college."
                : "This page is outside the available result range. Use Previous or clear the filters."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3"
                  >
                    Recruiter
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3"
                  >
                    Company
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3"
                  >
                    Grant status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3"
                  >
                    Granted
                  </th>
                  <th scope="col" className="px-4 py-3">Valid through (IST)</th>
                  <th scope="col" className="px-4 py-3">Access & verification</th>
                  <th scope="col" className="px-4 py-3">Revoked</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={`${page}:${index}`}
                    className="border-t border-border align-top"
                  >
                    <td className="px-4 py-4 font-semibold text-foreground">
                      {item.displayName}
                    </td>

                    <td className="px-4 py-4 text-body">
                      {item.companyName}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge
                        tone={
                          item.status === "ACTIVE"
                            ? "success"
                            : "neutral"
                        }
                      >
                        {item.ended?"Ended or removed":item.status === "ACTIVE"?"Active":"Revoked"}
                      </StatusBadge>
                      {item.status === "ACTIVE" && item.grantId && item.expectedUpdatedAt ? (
                        <><TpoRecruiterExtend grantId={item.grantId}
                           expectedUpdatedAt={item.expectedUpdatedAt} displayName={item.displayName}/>
                        <TpoRecruiterRevoke
                          grantId={item.grantId}
                          expectedUpdatedAt={item.expectedUpdatedAt}
                          displayName={item.displayName}
                        /></>
                      ) : null}
                    </td>

                    <td className="px-4 py-4 text-body">
                      {item.grantedDate}
                    </td>

                    <td className="px-4 py-4 text-body">{item.validUntilDate??"No expiry on record"}</td>
                    <td className="px-4 py-4 text-body">{item.capabilities.join(", ")||"No capabilities"} · {item.verificationStatus}</td>
                    <td className="px-4 py-4 text-body">
                      {item.revokedDate ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <nav
          aria-label="Recruiter grant pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="m-0 text-sm text-muted-foreground">
            Page {page} of {totalPages} ·
            maximum {pageSize} grants per page
          </p>

          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={tpoRecruiterAccessHref({
                  status: query.status,
                  q:query.q,
                  page: page - 1,
                })}
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
              >
                ← Previous
              </Link>
            ) : null}

            {page < totalPages ? (
              <Link
                href={nextTpoRecruiterGrantPage(query,page)}
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Dates are displayed in IST. “Active” and
        “Revoked” refer to the persisted grant status
        only. Current recruiter account status,
        platform-user status, and the company
        relationship may separately restrict access.
        This page does not expose recruiter emails,
        telephone numbers or internal identifiers,
        and can grant or revoke an existing user access through explicit
        confirmation and immutable audit. Full legacy recruiter invites,
        exact modal UX and browser parity remain open.
      </p>
    </div>
  );
}
