import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import { notFound } from "next/navigation";
import { z } from "zod";
import {CopyFindingForClaude} from "@/components/admin/copy-finding-for-claude";
import {strictTraceRouteParams} from "@/modules/module-access/admin-trace-route-params";

import { getCurrentRequestContext } from "@/auth/request-context";
import { requirePermission } from "@/modules/permissions/policy";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { Disclosure } from "@/components/ui/disclosure";
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
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";
import { formatDateTimeIst } from "@/lib/format-date";

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
  const context = await getCurrentRequestContext();
  requirePermission(context,"admin-scope.select");
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
  if (!strictParams) return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Learner access trace" description="Read-only, selected-college module access explanation." />
    <ErrorState title="Invalid learner search link" description="This link has unsupported or repeated search filters. No learner data was loaded." action={<ButtonLink variant="secondary" href={adminModuleTraceHref(collegeId)}>Clear filters</ButtonLink>} />
  </div>;

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
      <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
        <PageHeader
          title="Learner access trace"
          description="Read-only, college-scoped explanation of optional module access."
        />
        <ErrorState
          title="Invalid learner search"
          description="Check the search text and page number. No learner access data was loaded."
          action={
            <ButtonLink variant="secondary"
              href={basePath}
              className="w-full md:w-auto"
            >
              Clear filters
            </ButtonLink>
          }
        />
      </div>
    );
  }

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
    <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
      <PageHeader
        title={`${college.name} · Learner access trace`}
        description={`Explain why an active learner's Projects, Placements and Electives module settings resolve to On or Off. The selected college is fixed to ${college.code}.`}
        actions={<TextLink href={`/admin/features/${encodeURIComponent(college.id)}`} className="inline-flex min-h-11 items-center text-sm md:min-h-9">← {college.name} access hierarchy</TextLink>}
      />

      <nav className="flex min-w-0 flex-wrap gap-2" aria-label="Module access trace sections">
        <ButtonLink variant="secondary" href={adminModuleTraceHref(college.id,{overridesOnly:"only"})}
         aria-current={query.overridesOnly==="only"?"page":undefined}>
         Stored learner overrides
        </ButtonLink>
        <ButtonLink variant="secondary" href={adminModuleTraceHref(college.id,{overridesOnly:"locked"})}
         aria-current={query.overridesOnly==="locked"?"page":undefined}>
         Locked learner overrides
        </ButtonLink>
        <ButtonLink variant="secondary" href={"/admin/features/"+encodeURIComponent(college.id)+"/history"}>
         Recent module changes
        </ButtonLink>
      </nav>
      <section className="min-w-0 space-y-4 border-t border-border pt-4">
        <div>
          <Heading level={2} size="lg" className="m-0 leading-6 text-foreground">
            Find a learner
          </Heading>
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
          className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:flex-row sm:flex-wrap sm:items-end"
        >
          <Label stack className="min-w-0 w-full flex-1 md:min-w-60">
            Name or roll number
            <Input
              type="search"
              name="q"
              maxLength={100}
              defaultValue={query.q}
              placeholder="Find learner"
              className="w-full"
            />
          </Label>

          <Label stack>Learner scope
            <Select name="overridesOnly" defaultValue={query.overridesOnly} className="min-h-11 md:min-h-9">
              <option value="all">All active learners</option>
              <option value="only">Only students with stored overrides</option>
              <option value="locked">Only students with locked overrides</option>
            </Select>
          </Label>
          <Label stack>Stored override module
            <Select name="overridesModule" defaultValue={query.overridesModule ?? ""} className="min-h-11 md:min-h-9">
              <option value="">Any module</option><option value="projects">Projects</option><option value="electives">Electives</option><option value="placements">Placements (ignored below college)</option>
            </Select>
          </Label>
          <Label stack>Stored rule state
            <Select name="storedValue" defaultValue={query.storedValue} className="min-h-11 md:min-h-9">
              <option value="all">Stored On or Off</option><option value="on">Stored On only</option><option value="off">Stored Off only</option>
            </Select>
          </Label>
          <Button
            type="submit"
            className="min-h-11 w-full justify-center sm:w-auto md:min-h-9"
          >
            Search
          </Button>

          <ButtonLink variant="secondary"
            href={basePath}
          >
            Clear
          </ButtonLink>
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

        {query.overridesOnly!=="all"?<p role="status" className="text-sm text-body">
          {query.overridesOnly==="locked"?"Locked membership override register":"Membership override register"} ·
          Each row links to its complete inherited rule chain and all stored membership decisions.
        </p>:null}
        <DataTable<(typeof learners)[number]> caption={query.overridesOnly==="all"?"Learner access trace":"Learner override register"}
          rows={learners} getRowKey={learner=>learner.membershipId}
          empty={<EmptyState title="No matching learners"
            description="This college has no active learner memberships matching the search on this page."/>}
          columns={[
            {key:"learner",header:"Learner",mobilePriority:"primary",cell:learner=><strong>{learner.displayName||"Unnamed learner"}</strong>},
            {key:"roll",header:"Roll number",mobilePriority:"secondary",cell:learner=>learner.rollNumber||"—"},
            {key:"trace",header:"Access trace",mobilePriority:"action",cell:learner=><TextLink
              href={adminModuleTraceHref(college.id,{
                q:query.q,page,overridesOnly:query.overridesOnly,
                ...(query.overridesModule !== undefined ? {overridesModule: query.overridesModule} : {}),storedValue:query.storedValue,
                membershipId:learner.membershipId,
              })}
              aria-current={selected?.membershipId===learner.membershipId?"true":undefined}
              className="inline-flex min-h-11 items-center md:min-h-9">
              {selected?.membershipId===learner.membershipId?"Selected":"Explain access →"}
            </TextLink>},
          ]}/>

        <nav
          aria-label="Learner search pagination"
          className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="m-0 text-sm text-muted-foreground">
            Maximum {result.pageSize} learners per page
          </p>

          <div className="flex min-w-0 flex-wrap gap-2">
            {page > 1 ? (
              <ButtonLink variant="secondary"
                href={adminModuleTraceHref(
                  college.id,
                  {
                    q: query.q,
                    page: page - 1,
                    overridesOnly: query.overridesOnly,
                    overridesModule:query.overridesModule,
                    storedValue: query.storedValue,
                    ...(query.membershipId !== undefined ? {membershipId: query.membershipId} : {}),
                  },
                )}
              >
                ← Previous
              </ButtonLink>
            ) : null}

            {page < totalPages ? (
              <ButtonLink variant="secondary"
                href={adminModuleTraceHref(
                  college.id,
                  {
                    q: query.q,
                    page: page + 1,
                    overridesOnly: query.overridesOnly,
                    overridesModule:query.overridesModule,
                    storedValue: query.storedValue,
                    ...(query.membershipId !== undefined ? {membershipId: query.membershipId} : {}),
                  },
                )}
              >
                Next →
              </ButtonLink>
            ) : null}
          </div>
        </nav>
      </section>

      {selected ? (
        <section
          className="min-w-0 space-y-6 scroll-mt-24"
          aria-label="Selected learner module access"
        >
          <div className="border-b border-border pb-6">
            <Heading level={2} className="m-0 text-[var(--lms-heading)] text-[length:var(--lms-font-lg)] leading-[26px] md:text-[length:var(--lms-font-xl)] md:leading-[28px]">
              Why this learner sees these modules
            </Heading>

            <p className="mt-2 text-sm text-body">
              {selected.displayName || "Unnamed learner"}
              {selected.rollNumber
                ? ` · Roll ${selected.rollNumber}`
                : ""}
            </p>

            <TextLink href={`/admin/features/${encodeURIComponent(college.id)}?scope=MEMBERSHIP&scopeId=${encodeURIComponent(selected.membershipId)}`}
              className="mt-3 inline-flex min-h-11 items-center text-sm md:min-h-9">Inspect this learner&apos;s stored rules in the hierarchy →</TextLink>
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

          <section aria-label="Placement cell decision" className="border-t border-border pt-6">
            <Heading level={3} className="text-[var(--lms-heading)] text-[length:var(--lms-font-md)] leading-[24px] md:text-[length:var(--lms-font-lg)] md:leading-[26px]">Placement cell decision</Heading>
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
                formatDateTimeIst(selected.placementParticipation.decidedAt)
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
          <ButtonLink variant="secondary" href={"/admin/features/"+encodeURIComponent(college.id)+"/students/"+encodeURIComponent(selected.membershipId)}>
            Inspect membership overrides and locks →
          </ButtonLink>
          <nav aria-label="Selected learner access actions" className="flex min-w-0 flex-wrap gap-3">
           <TextLink href={"/admin/features/"+encodeURIComponent(college.id)+"/history"}
            className="inline-flex min-h-11 items-center text-sm md:min-h-9">
            View audited module changes
           </TextLink>
           <TextLink href={adminModuleTraceHref(college.id,{overridesOnly:"only",membershipId:selected.membershipId})}
            className="inline-flex min-h-11 items-center text-sm md:min-h-9">
            See learner in override register
           </TextLink>
          </nav>
          <section className="min-w-0 border-t border-border pt-6" aria-label="Student overrides and locks">
            <Heading level={3} className="text-[var(--lms-heading)] text-[length:var(--lms-font-md)] leading-[24px] md:text-[length:var(--lms-font-lg)] md:leading-[26px]">Student overrides and locks</Heading>
            <p className="mt-2 text-sm text-body">Persisted member-specific rules for this active learner. An inherited or masked rule does not mean the learner&apos;s final access is enabled.</p>
            <dl className="mt-3 grid min-w-0 gap-3 md:grid-cols-3">
              {membershipOverrideSummary(selected.modules).map(item => (
                <div key={item.module} className="min-w-0 border-b border-border py-3">
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
              className="min-w-0 space-y-3 border-t border-border pt-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Heading level={3} className="m-0 text-[var(--lms-heading)] text-[length:var(--lms-font-md)] leading-[24px] md:text-[length:var(--lms-font-lg)] md:leading-[26px]">
                    {module.label}
                  </Heading>
                  <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-body">
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

              <Disclosure title={"View "+module.label+" resolution chain (all scopes)"} defaultOpen={module.module==="projects"}
                className="min-w-0"
                contentClassName="min-w-0 pt-3 pb-2">
              <DataTable<(typeof module.steps)[number]>
                caption={module.label+" access resolution chain"}
                rows={module.steps}
                getRowKey={step=>step.level}
                columns={[
                  {key:"level",header:"Resolution level",mobilePriority:"primary",cell:step=><>
                    <span className="font-semibold text-foreground">{scopeLabel(step.level)}</span>
                    {step.locked?<span aria-label="Locked scope" className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-warning-text">
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                       <rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>
                      </svg>Locked
                    </span>:null}
                    {step.scopeId?<span className="mt-1 block text-xs text-muted-foreground">Scope ID ending {step.scopeId.slice(-8)}</span>:null}
                  </>},
                  {key:"stored",header:"Stored rule / fallback",mobilePriority:"secondary",cell:step=>
                    step.source==="SOURCE_DEFAULT"?`Source default · ${step.value?"On":"Off"}`:
                    step.source==="PERSISTED"?describeStoredOverride({enabled:step.value===true,locked:step.locked}):
                    step.inChain?"Inherit · no stored rule":"Not in current chain"},
                  {key:"result",header:"Result",mobilePriority:"secondary",cell:step=>
                    step.winner?<StatusBadge tone="success">Decided here</StatusBadge>:
                    step.ignored?<StatusBadge tone="warning">Ignored</StatusBadge>:
                    step.source==="PERSISTED"?<StatusBadge tone="neutral">Overridden</StatusBadge>:
                    step.inChain?<StatusBadge tone="neutral">Inherited</StatusBadge>:"—"},
                  {key:"reason",header:"Why",mobilePriority:"secondary",cell:step=><span className="text-xs text-body">{step.reason}</span>},
                ]}
                empty={<EmptyState title="No resolution steps" description="No stored rules or fallback steps were found for this module."/>}
              />
              </Disclosure>
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
        <section className="border-t border-border pt-6">
          <Heading level={2} className="m-0 text-[var(--lms-heading)] text-[length:var(--lms-font-lg)] leading-[26px] md:text-[length:var(--lms-font-xl)] md:leading-[28px]">
            Select a learner to explain access
          </Heading>
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
