import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
import Link from "next/link";
import {Suspense} from "react";
import {TpoStudentsSpreadsheet} from "@/components/tpo/tpo-students-spreadsheet";
import {TpoStudentSavedViews} from "@/components/tpo/tpo-student-saved-views";
import { TpoAcademicImportWorkspace } from "@/components/tpo/tpo-academic-import-workspace";
import {TpoStudentNudgePanel} from "@/components/tpo/tpo-student-nudge-panel";
import {getTpoAfterCollegeForRoster} from "@/modules/placements/tpo-after-college-roster-service";
import { redirect } from "next/navigation";
import {tpoStudentUrlError,tpoStudentFilterMessage} from "@/modules/placements/tpo-students-url-guard";
import {TpoBulkActionPanel} from "@/components/tpo/tpo-bulk-action-panel";

import { getCurrentRequestContext } from "@/auth/request-context";
import {listTpoBatches} from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TpoStudentsBulkAdd } from "@/components/tpo/tpo-students-bulk-add";
import { listPlacementJobs } from "@/modules/placements/job-service";
import {tpoJourneyDrillFilters,tpoBranchDrillFilters} from "@/modules/placements/tpo-student-drill-filters-model";
import {tpoStudentRosterClearHref} from "@/modules/placements/tpo-student-roster-clear-model";
import { can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  getTpoStudentsIntelligence,
  tpoStudentsQuerySchema,
} from "@/modules/placements/tpo-students-service";
import {
  TPO_STUDENT_JOURNEY_STATES,
  type TpoStudentJourneyState,
} from "@/modules/placements/tpo-students-model";

type SearchParams = {
  journeyState?: string | string[];
  branchId?: string | string[];
  batchId?: string | string[];
  search?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
  columns?: string | string[];
  student?: string | string[];
};

const JOURNEY_LABELS: Record<TpoStudentJourneyState, string> = {
  NOT_REGISTERED: "Not registered",
  NEEDS_READINESS_SUPPORT: "Needs readiness support",
  READY_NOT_APPLYING: "Ready, not applying",
  APPLYING: "Already applying",
  PLACED: "Placed",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function studentsHref(
  filters: {
    journeyState?: string;
    branchId?: string;
    batchId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    columns?: string;
  },
  exportCsv = false,
) {
  const params = new URLSearchParams();

  if (filters.journeyState) {
    params.set("journeyState", filters.journeyState);
  }

  if (filters.branchId) {
    params.set("branchId", filters.branchId);
  }
  if(filters.batchId)params.set("batchId",filters.batchId);

  if (filters.search) {
    params.set("search", filters.search);
  }
  if(!exportCsv&&filters.columns)params.set("columns",filters.columns);

  if (!exportCsv) {
    if (filters.page && filters.page > 1) {
      params.set("page", String(filters.page));
    }

    if (filters.pageSize && filters.pageSize !== 25) {
      params.set("pageSize", String(filters.pageSize));
    }
  }

  const base = exportCsv
    ? "/api/placements/tpo/students/export"
    : "/tpo/students";

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function metricTone(
  state: TpoStudentJourneyState,
): "neutral" | "warning" | "info" | "success" {
  if (state === "PLACED") return "success";

  if (
    state === "NEEDS_READINESS_SUPPORT" ||
    state === "NOT_REGISTERED"
  ) {
    return "warning";
  }

  if (state === "APPLYING") return "info";

  return "neutral";
}

function percentage(value: number | null) {
  return value === null ? "—" : `${value.toFixed(2)}%`;
}

export default async function TpoStudentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  const raw = await searchParams;
  const urlError = tpoStudentUrlError(raw);
  const parsed = tpoStudentsQuerySchema.safeParse({
    collegeId: context.membership.collegeId,
    journeyState: first(raw.journeyState) || undefined,
    branchId: first(raw.branchId) || undefined,
    batchId: first(raw.batchId) || undefined,
    search: first(raw.search) || undefined,
    page: first(raw.page) || undefined,
    pageSize: first(raw.pageSize) || undefined,
  });

  if (urlError || !parsed.success) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="TPO · Students"
          title={TPO_OWNER_PAGE_COPY.students}
          description="College-wide placement participation and journey oversight."
        />
        <section
          role="alert"
          className="rounded-xl border border-border bg-surface p-6"
        >
          <h2 className="text-lg font-semibold text-foreground">
            Invalid Students filters
          </h2>
          <p className="mt-2 text-sm text-body">
            {urlError ?? tpoStudentFilterMessage(raw)}
          </p>
          <Link
            href="/tpo/students"
            className="mt-4 inline-flex min-h-10 items-center font-semibold text-primary-text hover:underline"
          >
            Clear filters
          </Link>
        </section>
      </div>
    );
  }

  const query = parsed.data;
  const collegeId = context.membership.collegeId;
  const manageAllowed = can(context, "placements.manage", { collegeId });
  if (manageAllowed) {
    requirePermission(context, "placements.manage", { collegeId });
    await requirePlacementManageScope(context, collegeId);
  }
  const [data, managedJobs, batchDirectory] = await Promise.all([
    getTpoStudentsIntelligence(context, query, {includeExportRows:true}),
    manageAllowed ? listPlacementJobs(context, collegeId) : Promise.resolve([]),
    listTpoBatches(context),
  ]);
  const bulkDriveChoices = managedJobs.filter((item) =>
    item.job.status === "PUBLISHED" &&
    item.season.status === "ACTIVE" &&
    item.job.applicationMode !== "EXTERNAL_ONLY"
  ).map((item) => ({
    id: item.job.id,
    title: item.job.title,
    companyName: item.company.name,
  }));
  const summary = data.summary;
  const roster = data.roster;
  const afterCollege = await getTpoAfterCollegeForRoster(context, roster.items.map(row=>row.membershipId));

  const counts: Record<TpoStudentJourneyState, number> = {
    NOT_REGISTERED: summary.notRegistered,
    NEEDS_READINESS_SUPPORT: summary.needsReadinessSupport,
    READY_NOT_APPLYING: summary.readyNotApplying,
    APPLYING: summary.applying,
    PLACED: summary.placed,
  };

  const scopedHref=(filters:Parameters<typeof studentsHref>[0],exportCsv=false)=>
    studentsHref({...filters,batchId:query.batchId},exportCsv);
  const exportHref = scopedHref(
    {
      journeyState: query.journeyState,
      branchId: query.branchId,
      search: query.search,
    },
    true,
  );

  const currentFilters = {
    columns:first(raw.columns)?.slice(0,800),
    journeyState: query.journeyState,
    branchId: query.branchId,
    batchId: query.batchId,
    search: query.search,
    pageSize: query.pageSize,
  };

  const firstItem =
    roster.total === 0
      ? 0
      : (roster.page - 1) * roster.pageSize + 1;

  const lastItem = Math.min(
    roster.total,
    roster.page * roster.pageSize,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Students"
        title={TPO_OWNER_PAGE_COPY.students}
        description={query.batchId?
          "Batch student journeys, including completed learners from a finished batch.":
          "Read-only college-wide placement participation, branch performance and student journeys."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {manageAllowed ? <TpoStudentSavedViews /> : null}
            {manageAllowed ? <TpoAcademicImportWorkspace /> : null}
            <Link
              href="/tpo/students/requests"
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
            >
              Student Requests
            </Link>
            <Link href="/tpo/students/preparation-prep" className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body">Preparation support</Link>
            <a
              href={exportHref}
              className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              Export filtered CSV
            </a>
          </div>
        }
      />

      <form action="/tpo/students" method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
        <label className="text-sm font-semibold">Batch
          <select name="batchId" defaultValue={query.batchId??""}
            className="mt-1 block min-h-11 rounded border border-border bg-surface px-3">
            <option value="">Current students</option>
            {batchDirectory.batches.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <button className="min-h-11 rounded border border-border px-4">Show students</button>
      </form>
      {query.batchId?<p className="text-sm text-muted-foreground">
        Students from a finished batch include completed enrollments for follow-up and reporting.
      </p>:null}
      <nav
        aria-label="Students workspace tabs"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        <Link
          href="/tpo/students"
          aria-current="page"
          className="rounded-md bg-primary-subtle px-4 py-2 text-sm font-semibold text-primary-text"
        >
          Students roster
        </Link>
        <Link
          href="/tpo/students/requests"
          className="rounded-md px-4 py-2 text-sm font-semibold text-body hover:bg-muted"
        >
          Requests
        </Link>
      </nav>

      {!data.definitions.registrationsAvailable ? (
        <section
          role="status"
          className="rounded-xl border border-border bg-surface p-5"
        >
          <h2 className="text-base font-semibold text-warning">
            Placement registration data unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-body">
            The placement registration table has not yet been
            registered in the database. The registered placement
            pool therefore shows 0, and learners without a
            provisional placed outcome appear as Not registered.
            This is missing source data, not proof that learners
            declined registration. Placed learners retain their
            separately evidenced Placed journey state.
          </p>
        </section>
      ) : null}

      {!data.definitions.externalOffersAvailable ? (
        <section
          role="status"
          className="rounded-xl border border-border bg-surface p-4 text-sm leading-6 text-body"
        >
          External-offer data is not available in the registered
          database. Provisional placed and branch figures can
          omit externally placed learners.
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Placement intelligence
            </h2>
            <p className="mt-1 text-sm text-body">
              {data.season
                ? `Active placement season: ${data.season.name}`
                : "No active placement season is configured. Season-scoped applications and offers are not included."}
            </p>
          </div>
          <StatusBadge tone="warning">
            Readiness unverified
          </StatusBadge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {TPO_STUDENT_JOURNEY_STATES.map((state) => {
            const selected = query.journeyState === state;

            return (
              <Link
                key={state}
                href={scopedHref(tpoJourneyDrillFilters({
                  branchId:query.branchId,
                  search:query.search,
                  columns:first(raw.columns)?.slice(0,800),
                  pageSize:query.pageSize,
                },state))}
                aria-current={selected ? "page" : undefined}
                className={
                  "rounded-lg border p-4 transition hover:border-primary hover:bg-primary-subtle " +
                  (selected
                    ? "border-primary bg-primary-subtle"
                    : "border-border bg-surface")
                }
              >
                <p className="text-sm font-semibold text-body">
                  {JOURNEY_LABELS[state]}
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
                  {counts[state]}
                </p>
                <div className="mt-2">
                  <StatusBadge tone={metricTone(state)}>
                    View roster
                  </StatusBadge>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">
              {query.batchId?"Students in selected batch":"Active enrolled learners"}
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {summary.activeLearners}
            </p>
          </div>
          <div className="rounded-lg bg-muted px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">
              Registered placement pool
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {summary.placementPool}
            </p>
          </div>
          <div className="rounded-lg bg-muted px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">
              Placed outside registered pool
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {summary.placedOutsidePool}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Readiness is a provisional signal derived from placement
          participation and available academic evidence, not a
          verified employability assessment. Placed counts use
          accepted offers and available verified external offers;
          they are not confirmed joining counts.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Branch intelligence
          </h2>
          <p className="mt-1 text-sm text-body">
            Placement rates use registered placement-pool learners
            as the denominator, not every enrolled learner.
          </p>
        </div>

        {data.branches.length === 0 ? (
          <p className="p-5 text-sm text-body">
            No learners are available for this selection.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Branch</th>
                  <th scope="col" className="px-4 py-3">Learners</th>
                  <th scope="col" className="px-4 py-3">Registered</th>
                  <th scope="col" className="px-4 py-3">Applying</th>
                  <th scope="col" className="px-4 py-3">Placed in pool</th>
                  <th scope="col" className="px-4 py-3">Placed overall</th>
                  <th scope="col" className="px-4 py-3">Rate*</th>
                </tr>
              </thead>
              <tbody>
                {data.branches.map((branch) => (
                  <tr
                    key={branch.branchId}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={scopedHref(tpoBranchDrillFilters({
                          journeyState:query.journeyState,
                          search:query.search,
                          columns:first(raw.columns)?.slice(0,800),
                          pageSize:query.pageSize,
                        },branch.branchId))}
                        className="font-semibold text-primary-text hover:underline"
                      >
                        {branch.branchName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {branch.activeLearners}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {branch.placementPool}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {branch.applying}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {branch.placedInPool}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {branch.placed}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {percentage(branch.placementRatePercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="px-5 py-3 text-xs leading-5 text-muted-foreground">
          *Provisional rate. An unavailable registration table
          produces no usable denominator; — means the registered
          pool is zero. Browser and legacy parity remain unverified.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Students roster
            </h2>
            <p className="mt-1 text-sm text-body">
              {roster.total} matching learner
              {roster.total === 1 ? "" : "s"}
              {" · "}showing {firstItem}–{lastItem}
            </p>
          </div>
          <Link
            href={tpoStudentRosterClearHref(query.pageSize,first(raw.columns))}
            className="text-sm font-semibold text-primary-text hover:underline"
          >
            Clear filters
          </Link>
        </div>

        <form
          action="/tpo/students"
          method="get"
          className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {first(raw.columns)&&<input type="hidden" name="columns" value={first(raw.columns)?.slice(0,800)}/>}
          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Journey
            <select
              name="journeyState"
              defaultValue={query.journeyState ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="">All journeys</option>
              {TPO_STUDENT_JOURNEY_STATES.map((state) => (
                <option key={state} value={state}>
                  {JOURNEY_LABELS[state]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Branch
            <select
              name="branchId"
              defaultValue={query.branchId ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="">All branches</option>
              {data.branches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Search
            <input
              type="search"
              name="search"
              defaultValue={query.search ?? ""}
              maxLength={150}
              placeholder="Name, roll, email or batch"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold text-body">
            Page size
            <select
              name="pageSize"
              defaultValue={String(query.pageSize)}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="25">25 students</option>
              <option value="50">50 students</option>
              <option value="100">100 students</option>
            </select>
          </label>

          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              Apply filters
            </button>
          </div>
        </form>

        {roster.items.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-sm text-body">
            {roster.total > 0
              ? "This page is outside the matching result range. Return to the first page."
              : "No students match these filters. Try another journey, branch or search term."}
            <div className="mt-3">
              <Link
                href={roster.total>0?scopedHref({
                  ...currentFilters,
                  page: 1,
                }):tpoStudentRosterClearHref(query.pageSize,first(raw.columns))}
                className="font-semibold text-primary-text hover:underline"
              >
                {roster.total>0?"First matching page":"Clear roster filters"}
              </Link>
            </div>
          </div>
        ) : null}
        <Suspense fallback={<p role="status">Loading spreadsheet grid…</p>}>
          <TpoStudentsSpreadsheet rows={roster.items} branches={data.branches}
            afterCollege={afterCollege.entries} afterCollegeAvailable={afterCollege.available && manageAllowed}/>
        </Suspense>

        {manageAllowed?<TpoStudentNudgePanel
          key={"nudge:"+query.batchId+":"+query.branchId+":"+roster.page+":"+query.search}
          rows={roster.items.map(student=>({
            id:student.membershipId,
            label:student.displayName+" · "+(student.rollNumber??student.branchName),
            registered:student.registeredForPlacements,
          }))} />:null}
        <TpoBulkActionPanel key={"students:"+query.batchId+":"+query.branchId+":"+roster.page+":"+query.pageSize+":"+query.search+":"+query.journeyState}
          target="STUDENTS"
          rows={roster.items.map(student=>({id:student.membershipId,
            label:student.displayName+" · "+student.branchName}))}
          viewCount={roster.total}
          allRows={roster.total<=5000?data.exportRows?.map(student=>({
            id:student.membershipId,label:student.displayName+" · "+student.branchName
          }))??undefined:undefined}/>

        {manageAllowed ? (
          <TpoStudentsBulkAdd
            key={"bulk-add:"+query.batchId+":"+query.branchId+":"+roster.page+":"+query.pageSize+":"+query.search+":"+query.journeyState}
            learners={roster.items.map((student) => ({
              membershipId: student.membershipId,
              displayName: student.displayName,
              branchName: student.branchName,
              readinessSignal: student.readinessSignal,
            }))}
            drives={bulkDriveChoices}
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-body">
            Page {roster.page} of {Math.max(1, roster.totalPages)}
          </p>

          <nav
            aria-label="Students roster pagination"
            className="flex flex-wrap items-center gap-2"
          >
            {roster.page > 1 ? (
              <Link
                href={scopedHref({
                  ...currentFilters,
                  page: roster.page - 1,
                })}
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                Previous
              </Link>
            ) : null}

            {roster.page < roster.totalPages ? (
              <Link
                href={scopedHref({
                  ...currentFilters,
                  page: roster.page + 1,
                })}
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                Next
              </Link>
            ) : null}
          </nav>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          CSV exports all students matching the active roster filters,
          not just the visible page. The export uses the same authorized
          college read and CSV formula-escaping helper.
        </p>
      </section>
    </div>
  );
}
