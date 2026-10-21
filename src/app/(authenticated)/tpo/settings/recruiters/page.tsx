import { Disclosure } from "@/components/ui/disclosure";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Alert } from "@/components/ui/alert";
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
  parseTpoRecruiterAccessParams,
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

  const parsed=parseTpoRecruiterAccessParams(params);

  if (!parsed) {
    return (
      <div className="min-w-0 space-y-4">
        <PageHeader
          title="Recruiter access"
          description="Read-only recruiter college-grant history."
        />
        <TpoSettingsNav active="recruiters" compact />

        <ErrorState
          title="Invalid recruiter access filters"
          description="The grant status or requested page is invalid. No recruiter access records were loaded."
          action={
            <Link
              href="/tpo/settings/recruiters"
              className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-link"
            >
              Clear filters
            </Link>
          }
        />
      </div>
    );
  }

  const [data, linkedCompanies, publicLink,communication] = await Promise.all([
    listTpoRecruiterAccess(context, parsed),
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
    <div className="min-w-0 space-y-4">
      <PageHeader
        title="Recruiter access"
        description="Review active and revoked recruiter college-access grants for your current college. This is historical grant data, not a live recruiter-session or login-status check."
      />
      <TpoSettingsNav active="recruiters" compact />

      <TpoRecruiterGrantForm companies={linkedCompanies.companies.map((company) => ({
        relationshipId: company.relationshipId,
        name: company.name,
      }))} />
      <Alert tone="info">
        Recruiter access lasts six months by default unless changed below. Legacy
        recruiter approval and AFTER_REVIEW visibility settings have not been
        migrated as a combined policy; verify individual grants before sharing details.
      </Alert>
      <Disclosure title="Recruiter link and duration" className="min-w-0 border-t border-border pt-3" contentClassName="min-w-0 space-y-4 pt-3">

      {communication.ready?<TpoRecruiterDurationEditor key={context.membership.collegeId} initial={communication.recruiterAccessMonths} version={communication.version}/>:
       <Alert tone="warning">Recruiter access duration settings are not available yet.</Alert>}
      <TpoPublicJoinLinkCard initial={publicLink} scope="COLLEGE" />
      </Disclosure>

      <section className="border-t border-border pt-4">
        <h2 className="text-base font-semibold leading-6 text-foreground md:text-lg md:leading-7 min-[992px]:text-xl">
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
          className="mt-4 grid min-w-0 gap-3 border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] xl:items-end"
        >
          <label className="grid min-w-0 md:min-w-55 flex-1 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Grant status
            <Select
              name="status"
              defaultValue={query.status}
              className="min-h-11 md:min-h-9"
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
            </Select>
          </label>

          <label className="grid min-w-0 md:min-w-55 flex-1 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Search name, designation or company
            <Input type="search" name="q" defaultValue={query.q} maxLength={80}
              placeholder="Recruiter, role or company"
              className="min-h-11 md:min-h-9" />
          </label>
          <Button
            type="submit"
            className="min-h-11 w-full sm:w-auto md:min-h-9"
          >
            Apply
          </Button>

          <Link
            href="/tpo/settings/recruiters"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-link sm:w-auto"
          >
            Clear
          </Link>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-base font-semibold leading-6 text-foreground md:text-lg md:leading-7 min-[992px]:text-xl">
            Grant records
          </h2>
          <Disclosure title="Export grants" className="min-w-0" contentClassName="flex min-w-0 flex-wrap gap-2 pt-2">
            <a href={tpoRecruiterGrantExportHref(query)}
              className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-link">
              Export filtered grants CSV
            </a>
            <a href={tpoRecruiterGrantExportHref(query,"xlsx")}
              className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-link">
              Export filtered grants Excel
            </a>
          </Disclosure>

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
          <DataTable
            rows={items}
            getRowKey={item=>item.grantId??item.companyName+":"+item.displayName+":"+item.grantedDate}
            caption="Recruiter grants"
            empty={<p>No recruiter access grants with the selected status were recorded for your college.</p>}
            columns={[
              {key:"recruiter",header:"Recruiter",mobilePriority:"primary",cell:item=>
                <div className="min-w-0 break-words font-semibold text-foreground">
                  {item.displayName}
                  <p className="mt-1 text-xs font-normal text-muted-foreground">
                    {item.designation??"Designation not recorded"}
                  </p>
                </div>},
              {key:"company",header:"Company",mobilePriority:"secondary",cell:item=>item.companyName},
              {key:"grant",header:"Grant status",mobilePriority:"secondary",cell:item=>
                <div className="space-y-2">
                  <StatusBadge tone={item.status==="ACTIVE"?"success":"neutral"}>
                    {item.ended?"Ended or removed":item.status==="ACTIVE"?"Active":"Revoked"}
                  </StatusBadge>
                  {item.status==="ACTIVE"&&item.grantId&&item.expectedUpdatedAt?
                    <Disclosure title="Manage access" className="min-w-0" contentClassName="flex min-w-0 flex-wrap gap-2 pt-2">
                      <TpoRecruiterExtend grantId={item.grantId}
                        expectedUpdatedAt={item.expectedUpdatedAt} displayName={item.displayName} ended={item.ended}/>
                      <TpoRecruiterRevoke grantId={item.grantId}
                        expectedUpdatedAt={item.expectedUpdatedAt} displayName={item.displayName}/>
                    </Disclosure>:null}
                </div>},
              {key:"granted",header:"Granted",mobilePriority:"secondary",cell:item=>item.grantedDate},
              {key:"valid",header:"Valid through (IST)",mobilePriority:"secondary",cell:item=>item.validUntilDate??"No expiry on record"},
              {key:"access",header:"Access & verification",mobilePriority:"secondary",cell:item=><span>{item.capabilities.join(", ")||"No capabilities"}{" · "}{item.verificationStatus}</span>},
              {key:"revoked",header:"Revoked",mobilePriority:"secondary",cell:item=>item.revokedDate??"—"},
            ]}
          />
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
                className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:bg-primary-subtle"
              >
                ← Previous
              </Link>
            ) : null}

            {page < totalPages ? (
              <Link
                href={nextTpoRecruiterGrantPage(query,page)}
                className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:bg-primary-subtle"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      </section>

      <Disclosure title="About recruiter access records" className="min-w-0" contentClassName="pt-2">
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
      </Disclosure>
    </div>
  );
}
