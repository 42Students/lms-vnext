import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TpoStudentsBulkAdd } from "@/components/tpo/tpo-students-bulk-add";
import {TpoAfterCollegeEditor} from "@/components/tpo/tpo-after-college-editor";
import {afterCollegeOptions,AFTER_COLLEGE_LABELS} from "@/modules/placements/tpo-after-college-model";
import { listPlacementJobs } from "@/modules/placements/job-service";
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
  afterCollege?: string | string[];
  branchId?: string | string[];
  search?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
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
    afterCollege?: string;
    branchId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  },
  exportCsv = false,
) {
  const params = new URLSearchParams();

  if (filters.journeyState) {
    params.set("journeyState", filters.journeyState);
  }

  if (filters.afterCollege) params.set("afterCollege",filters.afterCollege);

  if (filters.branchId) {
    params.set("branchId", filters.branchId);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

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

function displayNumber(value: number | null) {
  return value === null ? "—" : String(value);
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
  const parsed = tpoStudentsQuerySchema.safeParse({
    collegeId: context.membership.collegeId,
    journeyState: first(raw.journeyState) || undefined,
    afterCollege: first(raw.afterCollege) || undefined,
    branchId: first(raw.branchId) || undefined,
    search: first(raw.search) || undefined,
    page: first(raw.page) || undefined,
    pageSize: first(raw.pageSize) || undefined,
  });

  if (!parsed.success) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="TPO · Students"
          title="Students intelligence"
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
            One or more filters are invalid. No student data was loaded.
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
  const [data, managedJobs] = await Promise.all([
    getTpoStudentsIntelligence(context, query),
    manageAllowed ? listPlacementJobs(context, collegeId) : Promise.resolve([]),
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

  const counts: Record<TpoStudentJourneyState, number> = {
    NOT_REGISTERED: summary.notRegistered,
    NEEDS_READINESS_SUPPORT: summary.needsReadinessSupport,
    READY_NOT_APPLYING: summary.readyNotApplying,
    APPLYING: summary.applying,
    PLACED: summary.placed,
  };

  const exportHref = studentsHref(
    {
      journeyState: query.journeyState,
      afterCollege: query.afterCollege,
      branchId: query.branchId,
      search: query.search,
    },
    true,
  );

  const currentFilters = {
    journeyState: query.journeyState,
    afterCollege: query.afterCollege,
    branchId: query.branchId,
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
        title="Students intelligence"
        description="Read-only college-wide placement participation, branch performance and student journeys. Counts are based on active learner enrollments."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/tpo/students/requests"
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
            >
              Student Requests
            </Link>
            <a
              href={exportHref}
              className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              Export filtered CSV
            </a>
          </div>
        }
      />

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
                href={studentsHref({
                  journeyState: state,
                  pageSize: query.pageSize,
                })}
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
              Active enrolled learners
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
            No active learner enrollments are available for
            branch intelligence.
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
                        href={studentsHref({
                          branchId: branch.branchId,
                          pageSize: query.pageSize,
                        })}
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
            href="/tpo/students"
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
            After college
            <select name="afterCollege" defaultValue={query.afterCollege??""} disabled={!data.definitions.afterCollegeAvailable}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground">
              <option value="">All outcomes</option>
              {afterCollegeOptions().map(item=><option key={item.value} value={item.value}>{item.label}</option>)}
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
                href={studentsHref({
                  ...currentFilters,
                  page: 1,
                })}
                className="font-semibold text-primary-text hover:underline"
              >
                First page
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[80rem] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Student</th>
                  <th scope="col" className="px-4 py-3">Branch / batch</th>
                  <th scope="col" className="px-4 py-3">CGPA / backlogs</th>
                  <th scope="col" className="px-4 py-3">Readiness evidence</th>
                  <th scope="col" className="px-4 py-3">Registration</th>
                  <th scope="col" className="px-4 py-3">Best so far</th>
                  <th scope="col" className="px-4 py-3">Applications</th>
                  <th scope="col" className="px-4 py-3">Offers</th>
                  <th scope="col" className="px-4 py-3">Journey</th>
                  <th scope="col" className="px-4 py-3">After college</th>
                </tr>
              </thead>
              <tbody>
                {roster.items.map((student) => (
                  <tr
                    key={student.membershipId}
                    className="border-t border-border align-top"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-foreground">
                        {student.displayName}
                      </p>
                      <p className="mt-1 text-xs text-body">
                        {student.rollNumber ??
                          student.registrationNumber ??
                          "No student number"}
                      </p>
                      {student.email ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {student.email}
                        </p>
                      ) : null}
                      <Link
                        href={"/tpo/students/" + encodeURIComponent(student.membershipId) + "/history"}
                        className="mt-2 inline-flex min-h-9 items-center text-xs font-semibold text-primary-text hover:underline"
                      >
                        View placement history →
                      </Link>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground">
                        {student.branchName}
                      </p>
                      <p className="mt-1 text-xs text-body">
                        {student.programName} · {student.cohortName}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p>CGPA: {displayNumber(student.cgpa)}</p>
                      <p className="mt-1 text-xs text-body">
                        Active: {displayNumber(student.activeBacklogs)}
                        {" · "}Past: {displayNumber(student.pastBacklogs)}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge
                        tone={
                          student.readinessSignal ===
                          "PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT"
                            ? "info"
                            : "warning"
                        }
                      >
                        {student.readinessSignal ===
                        "PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT"
                          ? "Evidence present"
                          : student.readinessSignal ===
                              "ACADEMIC_EVIDENCE_MISSING"
                            ? "Academic data missing"
                            : "Participation not eligible"}
                      </StatusBadge>
                      {student.ambiguousSection ? (
                        <p className="mt-2 text-xs text-warning">
                          Ambiguous section assignment
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground">
                        {student.registrationChoice?.replaceAll("_", " ") ??
                          (data.definitions.registrationsAvailable
                            ? "Not registered"
                            : "Unavailable")}
                      </p>
                      <p className="mt-1 text-xs text-body">
                        {student.participationStatus.replaceAll("_", " ")}
                      </p>
                      <Link
                        href={`/tpo/students/${encodeURIComponent(student.membershipId)}/participation`}
                        className="mt-2 inline-flex min-h-9 items-center text-xs font-semibold text-primary-text hover:underline"
                      >
                        Change participation →
                      </Link>
                    </td>

                    <td className="px-4 py-4 text-body">
                      {student.bestSoFar}
                    </td>

                    <td className="px-4 py-4 tabular-nums">
                      {student.applicationCount}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {student.activeApplicationCount} active
                      </p>
                    </td>

                    <td className="px-4 py-4 tabular-nums">
                      {student.offerCount}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {student.acceptedOfferCount} accepted
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge tone={metricTone(student.journeyState)}>
                        {JOURNEY_LABELS[student.journeyState]}
                      </StatusBadge>
                    </td>
                    <td className="min-w-44 px-4 py-4">
                      {data.definitions.afterCollegeAvailable?
                        manageAllowed?<TpoAfterCollegeEditor key={student.membershipId+":"+(student.afterCollegeUpdatedAt??"none")}
                          membershipId={student.membershipId} outcome={student.afterCollegeOutcome??null}
                          expectedVersion={student.afterCollegeUpdatedAt??"none"}/>:
                        <span className="text-sm">{AFTER_COLLEGE_LABELS[student.afterCollegeOutcome??"NOT_DECIDED"]}</span>:
                        <span className="text-xs text-muted-foreground">Unavailable</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {manageAllowed ? (
          <TpoStudentsBulkAdd
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
                href={studentsHref({
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
                href={studentsHref({
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
