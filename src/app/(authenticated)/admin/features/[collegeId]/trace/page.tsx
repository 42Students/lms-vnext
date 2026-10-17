import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import {CopyFindingForClaude} from "@/components/admin/copy-finding-for-claude";
import {strictTraceRouteParams} from "@/modules/module-access/admin-trace-route-params";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  collegeIdSchema,
} from "@/modules/colleges/validation";
import {
  MODULE_SCOPE_LABELS,
  describeStoredOverride,
} from "@/modules/module-access/admin-read-model";
import {
  adminModuleTraceHref,
  membershipOverrideSummary,
} from "@/modules/module-access/admin-trace-model";
import {
  adminModuleTraceQuerySchema,
  getSuperAdminLearnerAccessTrace,
} from "@/modules/module-access/admin-trace-service";

type SearchParams = Record<
  string,
  string | string[] | undefined
>;


function scopeLabel(level: string): string {
  if (level === "DEFAULT") {
    return "Source default";
  }

  return (
    MODULE_SCOPE_LABELS[
      level as keyof typeof MODULE_SCOPE_LABELS
    ] ?? level
  );
}

export default async function SuperAdminLearnerAccessTracePage({
  params,
  searchParams,
}: {
  params: Promise<{
    collegeId: string;
  }>;
  searchParams: Promise<SearchParams>;
}) {
  const { collegeId } = await params;

  if (
    !collegeIdSchema.safeParse(
      collegeId,
    ).success
  ) {
    notFound();
  }

  const paramsValue = await searchParams;
  const strictParams = strictTraceRouteParams(paramsValue);
  if (!strictParams) notFound();

  const membershipId =
    strictParams.membershipId;

  if (
    membershipId &&
    !z.string().uuid()
      .safeParse(membershipId).success
  ) {
    notFound();
  }

  const parsed =
    adminModuleTraceQuerySchema.safeParse({
      q: strictParams.q || undefined,
      overridesOnly: strictParams.overridesOnly || undefined,
      overridesModule: strictParams.overridesModule || undefined,
      storedValue: strictParams.storedValue || undefined,
      page:
        strictParams.page || undefined,
      membershipId:
        membershipId || undefined,
    });

  const basePath = adminModuleTraceHref(
    collegeId,
  );

  if (!parsed.success) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin · Module Access"
          title="Learner access trace"
          description="Read-only, college-scoped explanation of optional module access."
        />
        <ErrorState
          title="Invalid learner search"
          description="Check the search text and page number. No learner access data was loaded."
          action={
            <Link
              href={basePath}
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text"
            >
              Clear filters
            </Link>
          }
        />
      </div>
    );
  }

  const context =
    await getCurrentRequestContext();

  const result =
    await getSuperAdminLearnerAccessTrace(
      context,
      collegeId,
      parsed.data,
    );

  if (!result) {
    // Unknown college, cross-college membership,
    // non-learner or inactive membership.
    notFound();
  }

  const {
    college,
    learners,
    total,
    page,
    totalPages,
    query,
    selected,
  } = result;

  const first =
    total > 0 && learners.length > 0
      ? (page - 1) * result.pageSize + 1
      : 0;

  const last = Math.min(
    total,
    page * result.pageSize,
  );

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/features/${encodeURIComponent(college.id)}`}
        className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline"
      >
        ← {college.name} access hierarchy
      </Link>

      <PageHeader
        eyebrow="Super Admin · Module Access"
        title={`${college.name} · Learner access trace`}
        description={`Explain why an active learner's Projects, Placements and Electives module settings resolve to On or Off. The selected college is fixed to ${college.code}.`}
      />

      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Find a learner
          </h2>
          <p className="mt-1 text-sm leading-6 text-body">
            Search active learners in this college by
            display name or roll number. The directory
            displays neither email addresses nor phone
            numbers.
          </p>
        </div>

        <form
          action={basePath}
          method="get"
          className="flex flex-wrap items-end gap-3"
        >
          <label className="grid min-w-60 flex-1 gap-2 text-sm font-semibold text-body">
            Name or roll number
            <input
              type="search"
              name="q"
              maxLength={100}
              defaultValue={query.q}
              placeholder="Find learner"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-body">Learner scope
            <select name="overridesOnly" defaultValue={query.overridesOnly} className="min-h-11 rounded-md border border-border bg-background px-3 text-foreground">
              <option value="all">All active learners</option>
              <option value="only">Only students with stored overrides</option>
              <option value="locked">Only students with locked overrides</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">Stored override module
            <select name="overridesModule" defaultValue={query.overridesModule ?? ""} className="min-h-11 rounded-md border border-border bg-background px-3 text-foreground">
              <option value="">Any module</option><option value="projects">Projects</option><option value="electives">Electives</option><option value="placements">Placements (ignored below college)</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-body">Stored rule state
            <select name="storedValue" defaultValue={query.storedValue} className="min-h-11 rounded-md border border-border bg-background px-3 text-foreground">
              <option value="all">Stored On or Off</option><option value="on">Stored On only</option><option value="off">Stored Off only</option>
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
          >
            Search
          </button>

          <Link
            href={basePath}
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
          >
            Clear
          </Link>
        </form>

        <p className="m-0 text-sm text-muted-foreground">
          {total === 0
            ? "No matching active learners"
            : first === 0
              ? "No learners on this page"
              : `${first}–${last} of ${total} learners`}
          {" · "}
          Page {page} of {totalPages}
        </p>

        {learners.length === 0 ? (
          <EmptyState
            title="No matching learners"
            description="This college has no active learner memberships matching the search on this page."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-muted text-body">
                <tr>
                  <th
                    scope="col"
                    className="border-b border-border px-4 py-3"
                  >
                    Learner
                  </th>
                  <th
                    scope="col"
                    className="border-b border-border px-4 py-3"
                  >
                    Roll number
                  </th>
                  <th
                    scope="col"
                    className="border-b border-border px-4 py-3"
                  >
                    Access trace
                  </th>
                </tr>
              </thead>
              <tbody>
                {learners.map((learner) => {
                  const isSelected =
                    selected?.membershipId ===
                    learner.membershipId;

                  return (
                    <tr
                      key={learner.membershipId}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {learner.displayName ||
                          "Unnamed learner"}
                      </td>
                      <td className="px-4 py-3 text-body">
                        {learner.rollNumber || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={adminModuleTraceHref(
                            college.id,
                            {
                              q: query.q,
                              page,
                              overridesOnly: query.overridesOnly,
                              overridesModule: query.overridesModule,
                              storedValue: query.storedValue,
                              membershipId:
                                learner.membershipId,
                            },
                          )}
                          aria-current={
                            isSelected
                              ? "true"
                              : undefined
                          }
                          className="font-semibold text-primary-text hover:underline"
                        >
                          {isSelected
                            ? "Selected"
                            : "Explain access →"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <nav
          aria-label="Learner search pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="m-0 text-sm text-muted-foreground">
            Maximum {result.pageSize} learners per page
          </p>

          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={adminModuleTraceHref(
                  college.id,
                  {
                    q: query.q,
                    page: page - 1,
                    overridesOnly: query.overridesOnly,
                    membershipId:
                      query.membershipId,
                  },
                )}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text"
              >
                ← Previous
              </Link>
            ) : null}

            {page < totalPages ? (
              <Link
                href={adminModuleTraceHref(
                  college.id,
                  {
                    q: query.q,
                    page: page + 1,
                    overridesOnly: query.overridesOnly,
                    membershipId:
                      query.membershipId,
                  },
                )}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      </section>

      {selected ? (
        <section
          className="space-y-6"
          aria-label="Selected learner module access"
        >
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="m-0 text-xl font-semibold text-foreground">
              Why this learner sees these modules
            </h2>

            <p className="mt-2 text-sm text-body">
              {selected.displayName || "Unnamed learner"}
              {selected.rollNumber
                ? ` · Roll ${selected.rollNumber}`
                : ""}
            </p>

            <Link href={`/admin/features/${encodeURIComponent(college.id)}?scope=MEMBERSHIP&scopeId=${encodeURIComponent(selected.membershipId)}`}
              className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">Inspect this learner&apos;s stored rules in the hierarchy →</Link>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Resolution checks the current membership,
              section, cohort, program, department,
              college, organization and global rules,
              then the source default. A broader locked
              rule takes precedence over narrower ones.
              Missing academic scopes are shown rather
              than silently treated as configured rules.
            </p>
          </div>

          <section aria-label="Placement cell decision" className="rounded-xl border border-border bg-surface p-5">
            <h3 className="font-semibold">Placement cell decision</h3>
            <p className="mt-2 text-sm text-body">{
              selected.placementParticipation.status==="NOT_DECIDED"?"Not decided yet":
              selected.placementParticipation.status==="ELIGIBLE"?"Eligible":
              "Ineligible"+(selected.placementParticipation.reason?": "+selected.placementParticipation.reason:"")
            }</p>
            {selected.placementParticipation.level?<p className="mt-1 text-xs text-body">
              {selected.placementParticipation.level==="MEMBERSHIP"?"Student":
                selected.placementParticipation.level==="SECTION"?"Class":"Batch"} decision
            </p>:null}
            {selected.placementParticipation.decidedAt?<p className="mt-1 text-xs text-body">
              Decided by {selected.placementParticipation.actorName||"Unknown actor"} on {
                selected.placementParticipation.decidedAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})
              }
            </p>:null}
            <p className="mt-2 text-xs text-muted-foreground">
              This is the persisted placement-cell decision, not the optional-module setting.
              Placements access requires both an enabled module and an eligible participation decision.
            </p>
          </section>

          <CopyFindingForClaude finding={[
           "College: "+college.name,
           ...selected.modules.map(module=>[
            "Module: "+module.label,
            "Effective: "+(module.enabled?"On":"Off"),
            "Explanation: "+module.explanation,
            ...module.steps.filter(step=>step.winner||step.locked||step.ignored)
              .map(step=>"Scope "+scopeLabel(step.level)+": "+(step.value?"On":"Off")+
               (step.locked?" (locked)":"")+(step.ignored?" (ignored)":"")+
               (step.winner?" (winning)":"")),
           ].join(String.fromCharCode(10))),
           ].join(String.fromCharCode(10,10))}/>
          <Link href={"/admin/features/"+encodeURIComponent(college.id)+"/students/"+encodeURIComponent(selected.membershipId)}
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
            Inspect membership overrides and locks →
          </Link>
          <section className="min-w-0 rounded-xl border border-border bg-surface p-5" aria-label="Student overrides and locks">
            <h3 className="text-base font-semibold text-foreground">Student overrides and locks</h3>
            <p className="mt-2 text-sm text-body">Persisted member-specific rules for this active learner. An inherited or masked rule does not mean the learner&apos;s final access is enabled.</p>
            <dl className="mt-3 grid min-w-0 gap-3 sm:grid-cols-3">
              {membershipOverrideSummary(selected.modules).map(item => (
                <div key={item.module} className="min-w-0 rounded-lg border border-border p-3">
                  <dt className="break-words text-sm font-semibold">{item.label}</dt>
                  <dd className="mt-1 text-sm">{item.stored === null ? "Inherit" : item.stored ? "Stored On" : "Stored Off"}</dd>
                  <dd className="mt-1 text-xs text-muted-foreground">{item.ignored ? "Ignored for Placements" : item.stored === null ? "No membership override" : item.winner ? "Membership rule selected" : "Overridden by another rule"}</dd>
                  {item.locked ? <dd className="mt-1 text-xs font-semibold">Locked at membership</dd> : null}
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">Read-only inspection. Student-level edits require a separately approved, audit-logged workflow; the existing production resolver remains authoritative.</p>
          </section>

          {selected.modules.map((module) => (
            <article
              key={module.module}
              className="space-y-4 rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="m-0 text-lg font-semibold text-foreground">
                    {module.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-body">
                    {module.explanation}
                  </p>
                </div>

                <StatusBadge
                  tone={
                    module.enabled
                      ? "success"
                      : "neutral"
                  }
                >
                  Effective module rule:{" "}
                  {module.enabled ? "On" : "Off"}
                </StatusBadge>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
                  <thead className="bg-muted text-body">
                    <tr>
                      <th
                        scope="col"
                        className="border-b border-border px-4 py-3"
                      >
                        Resolution level
                      </th>
                      <th
                        scope="col"
                        className="border-b border-border px-4 py-3"
                      >
                        Stored rule / fallback
                      </th>
                      <th
                        scope="col"
                        className="border-b border-border px-4 py-3"
                      >
                        Result
                      </th>
                      <th
                        scope="col"
                        className="border-b border-border px-4 py-3"
                      >
                        Why
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {module.steps.map((step) => (
                      <tr
                        key={step.level}
                        className={
                          step.winner
                            ? "border-b border-border bg-primary-subtle last:border-b-0"
                            : "border-b border-border last:border-b-0"
                        }
                      >
                        <th
                          scope="row"
                          className="px-4 py-3 text-left align-top font-semibold text-foreground"
                        >
                          {scopeLabel(step.level)}
                          {step.scopeId ? (
                            <span className="mt-1 block text-xs font-normal text-muted-foreground">
                              Scope ID ending{" "}
                              {step.scopeId.slice(-8)}
                            </span>
                          ) : null}
                        </th>

                        <td className="px-4 py-3 align-top text-body">
                          {step.source === "SOURCE_DEFAULT"
                            ? `Source default · ${
                                step.value ? "On" : "Off"
                              }`
                            : step.source === "PERSISTED"
                              ? describeStoredOverride({
                                  enabled:
                                    step.value === true,
                                  locked:
                                    step.locked,
                                })
                              : step.inChain
                                ? "Inherit · no stored rule"
                                : "Not in current chain"}
                        </td>

                        <td className="px-4 py-3 align-top">
                          {step.winner ? (
                            <StatusBadge tone="success">
                              Winner
                            </StatusBadge>
                          ) : step.ignored ? (
                            <StatusBadge tone="warning">
                              Ignored
                            </StatusBadge>
                          ) : step.source === "PERSISTED" ? (
                            <StatusBadge tone="neutral">
                              Not selected
                            </StatusBadge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 align-top text-xs leading-5 text-body">
                          {step.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}

          <p className="text-xs leading-5 text-muted-foreground">
            These results explain the persisted and
            source-default module-access resolver only.
            They do not prove that a learner can open
            every route or perform every action.
            Placements also requires an eligible
            participation decision; other modules
            may have their own role and content checks.
            The trace does not alter access or impersonate
            the learner.
          </p>
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Select a learner to explain access
          </h2>
          <p className="mt-2 text-sm leading-6 text-body">
            Use “Explain access” beside a learner to
            display all three module resolution chains,
            the persisted values at each available scope,
            and the winning decision.
          </p>
        </section>
      )}
    </div>
  );
}
