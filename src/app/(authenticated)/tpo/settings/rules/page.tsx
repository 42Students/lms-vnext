import { Disclosure } from "@/components/ui/disclosure";
import type {ReactNode} from "react";
import { PageHeader } from "@/components/ui/page-header";
import { redirect } from "next/navigation";
import {Alert} from "@/components/ui/alert";
import {TpoCgpaRuleControl} from "@/components/placements/tpo-cgpa-rule-control";
import {getTpoPlacementTeam} from "@/modules/placements/tpo-settings-people-service";
import {getCollegeCgpaConversionRule} from "@/modules/profile-verification/settings-service";

import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { TpoCollegeRulesControl } from "@/components/placements/tpo-college-rules-control";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  TPO_FIXED_PLACEMENT_RULE_NOTES,
  formatTpoEligibilityThreshold,
  parseTpoRulesPageParams,
} from "@/modules/placements/tpo-settings-model";
import { getCollegePlacementRules } from "@/modules/placements/tpo-policy-service";
import { getTpoPlacementRulesSettings } from "@/modules/placements/tpo-settings-read-service";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";

import { ROLE } from "@/modules/identity/roles";
type SearchParams = Record<string,string|string[]|undefined>;
function SettingsLayout({children}:{children:ReactNode}){
 return <div className="min-w-0 space-y-5">
  <PageHeader title="Settings" description="How your placement cell runs"/>
  <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-6">
   <TpoSettingsNav active="rules"/>
   <section className="min-w-0 space-y-5" aria-label="Placement rules settings">
    <Heading level={2} size="xl" className="text-[var(--lms-heading)]">Placement rules</Heading>
    {children}
   </section>
  </div>
 </div>;
}


function settingSourceLabel(
  source: "PERSISTED" | "SOURCE_DEFAULT",
) {
  return source === "PERSISTED"
    ? "Saved for your college"
    : "Standard college settings";
}

function placedTriggerLabel(value: string) {
  switch (value) {
    case "SELECTED":
      return "Selected";
    case "OFFER_RELEASED":
      return "Offer released";
    case "OFFER_ACCEPTED":
      return "Offer accepted";
    default:
      return value;
  }
}

function RuleValue({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-body">
        {value}
      </dd>
    </div>
  );
}

function optionalMaximum(value: number | null) {
  return value === null
    ? "No maximum"
    : String(value);
}

export default async function TpoPlacementRulesSettingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (
    !context.membership ||
    !hasMembershipRole(context, ROLE.TPO)
  ) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const selectedPage = parseTpoRulesPageParams(params);
  if (selectedPage === null) {
    return (
      <SettingsLayout>
        <ErrorState
          title="Invalid placement rules filters"
          description="The requested job page is invalid. No placement job records were loaded."
          action={
            <ButtonLink variant="secondary" href="/tpo/settings/rules">
              Clear filters
            </ButtonLink>
          }
        />
      </SettingsLayout>
    );
  }

  let team:Awaited<ReturnType<typeof getTpoPlacementTeam>>;
  try{
    team=await getTpoPlacementTeam(context,context.membership.collegeId);
  }catch{
    return <SettingsLayout>
      <ErrorState title="Could not verify your placement-settings access"
        description="Could not verify your placement-settings access. Please try again."
        action={<TextLink href="/tpo/settings/rules">Retry</TextLink>}/>
    </SettingsLayout>;
  }
  const actor=team.members.find(item=>item.membershipId===context.membership?.id);
  const canEdit=Boolean(actor?.roles.includes("TPO_ADMIN")||actor?.roles.includes(ROLE.COLLEGE_ADMIN));
  if(!canEdit)return <SettingsLayout>
    <Alert tone="info">College settings are managed by the TPO admins. Ask a TPO admin if something here needs to change.</Alert>
  </SettingsLayout>;

  let result:Awaited<ReturnType<typeof getTpoPlacementRulesSettings>>;
  let cgpaRule:Awaited<ReturnType<typeof getCollegeCgpaConversionRule>>;
  let rulesVersion:number;
  try{
    [result,cgpaRule]=await Promise.all([
      getTpoPlacementRulesSettings(context,{page:selectedPage}),
      getCollegeCgpaConversionRule(context,context.membership.collegeId),
    ]);
    rulesVersion=(await getCollegePlacementRules(context,context.membership.collegeId)).version;
  }catch{
    return <SettingsLayout>
      <ErrorState title="Could not load placement rules"
        description="Your saved settings have not been changed. Retry to reload the current rules and job eligibility."
        action={<TextLink href="/tpo/settings/rules" className="inline-flex min-h-11 items-center md:min-h-9">Retry</TextLink>}/>
    </SettingsLayout>;
  }
  const rules = result.collegeRules;

  return (
    <SettingsLayout>
      <section className="space-y-2">
        <p className="text-sm leading-6 text-body">
          The college-wide offer policy and
          job-specific eligibility criteria.
          Default values are supplied
          by the existing placement services, not by
          an inferred database record.
        </p>
      </section>
      <TpoCollegeRulesControl rules={{
        countsAsPlacedAt: rules.countsAsPlacedAt,
        maxHeldOffers: rules.maxHeldOffers,
        upliftPct: rules.upliftPct,
        minResponseHours: rules.minResponseHours,
        version: rulesVersion,
      }} />

      <Disclosure title="Current college-wide offer policy" className="min-w-0 border-t border-border pt-3" contentClassName="min-w-0 pt-3">
      <section className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading level={3} size="base" className="m-0 leading-[26px] text-foreground md:text-[18px] md:leading-7 lg:text-[20px] lg:leading-[30px]">
            College-wide offer policy
          </Heading>
          <StatusBadge
            tone={
              rules.source === "PERSISTED"
                ? "success"
                : "info"
            }
          >
            {settingSourceLabel(rules.source)}
          </StatusBadge>
        </div>

        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          <RuleValue
            label="Count learner as placed at"
            value={placedTriggerLabel(
              rules.countsAsPlacedAt,
            )}
          />
          <RuleValue
            label="Maximum held offers"
            value={rules.maxHeldOffers}
          />
          <RuleValue
            label="Offer uplift threshold"
            value={`${rules.upliftPct}%`}
          />
          <RuleValue
            label="Minimum response period"
            value={`${rules.minResponseHours} hours`}
          />
        </dl>

        <p className="mb-0 mt-5 text-xs leading-5 text-muted-foreground">
          {rules.source === "PERSISTED"
            ? "These are your saved college placement rules."
            : "No custom rules are saved yet. Current defaults count released offers, allow one held offer, require a 40% uplift and at least 48 hours to respond."}
        </p>
      </section>
      </Disclosure>

      <Disclosure title="CGPA to percentage conversion" className="min-w-0 border-t border-border pt-3" contentClassName="min-w-0 pt-3">
       <TpoCgpaRuleControl initialRule={cgpaRule}/>
      </Disclosure>


      <Disclosure title="Fixed eligibility and participation behavior" className="min-w-0 border-t border-border pt-3" contentClassName="min-w-0 pt-3">
      <section className="space-y-4">
        <div>
          <Heading level={3} className="sr-only">
            Fixed eligibility and participation behavior
          </Heading>
          <p className="mt-1 text-sm text-muted-foreground">
            These are source-defined rules and fallback
            behavior. They are not independently persisted
            college settings.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
          {TPO_FIXED_PLACEMENT_RULE_NOTES.map((note) => (
            <article
              key={note.title}
              className="border-b border-border py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Heading level={4} size="sm" className="m-0 text-foreground">
                  {note.title}
                </Heading>
                <StatusBadge tone="info">
                  Fixed
                </StatusBadge>
              </div>
              <p className="mt-3 text-sm font-semibold text-body">
                {note.value}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {note.detail}
              </p>
              <p className="mt-2 text-xs font-semibold text-link">
                {note.source}
              </p>
            </article>
          ))}
        </div>
      </section>
      </Disclosure>

      <Disclosure title="Job-specific academic eligibility" className="min-w-0 border-t border-border pt-3" contentClassName="min-w-0 pt-3">
      <section className="space-y-4">
        <div>
          <Heading level={3} size="base" className="m-0 leading-[26px] text-foreground md:text-[18px] md:leading-7 lg:text-[20px] lg:leading-[30px]">
            Job-specific academic eligibility
          </Heading>
          <p className="mt-1 text-sm leading-6 text-body">
            The latest placement jobs in this college,
            with their persisted eligibility thresholds
            or the source fallback when no job policy
            record exists. A job policy does not replace
            the separate learner/class/batch
            participation gate.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {result.totalJobs} college jobs · page{" "}
            {result.page} of {result.totalPages}
            {" "}· {result.pageSize} per page
          </p>
        </div>

        {result.jobs.length === 0 ? (
          <EmptyState
            title={
              result.totalJobs === 0
                ? "No placement jobs"
                : "No jobs on this page"
            }
            description={
              result.totalJobs === 0
                ? "There are no job-level eligibility policies to show because this college has no recorded placement jobs."
                : "This page is outside the currently available job results."
            }
          />
        ) : (
          <div className="space-y-3">
            {result.jobs.map((job) => (
              <article
                key={job.id}
                className="border-b border-border py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Heading level={4} size="base" className="m-0 text-foreground">
                      {job.title}
                    </Heading>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Job status: {job.status}
                    </p>
                  </div>

                  <StatusBadge
                    tone={
                      job.source === "PERSISTED"
                        ? "success"
                        : "info"
                    }
                  >
                    {settingSourceLabel(job.source)}
                  </StatusBadge>
                </div>

                <Disclosure title="Eligibility details" className="mt-3 min-w-0" contentClassName="min-w-0 pt-3">
                <dl className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <RuleValue
                    label="Minimum CGPA"
                    value={formatTpoEligibilityThreshold(
                      job.minCgpaHundredths,
                    )}
                  />
                  <RuleValue
                    label="Maximum active backlogs"
                    value={optionalMaximum(
                      job.maxActiveBacklogs,
                    )}
                  />
                  <RuleValue
                    label="Maximum past backlogs"
                    value={optionalMaximum(
                      job.maxPastBacklogs,
                    )}
                  />
                  <RuleValue
                    label="Minimum Class 10 percentage"
                    value={formatTpoEligibilityThreshold(
                      job.minTenthPctBasisPoints,
                    )}
                  />
                  <RuleValue
                    label="Minimum Class 12 percentage"
                    value={formatTpoEligibilityThreshold(
                      job.minTwelfthPctBasisPoints,
                    )}
                  />
                  <RuleValue
                    label="Minimum diploma percentage"
                    value={formatTpoEligibilityThreshold(
                      job.minDiplomaPctBasisPoints,
                    )}
                  />
                  <RuleValue
                    label="Minimum undergraduate percentage"
                    value={formatTpoEligibilityThreshold(
                      job.minUndergraduatePctBasisPoints,
                    )}
                  />
                  <RuleValue
                    label="Maximum gap years"
                    value={optionalMaximum(
                      job.maxGapYears,
                    )}
                  />
                  <RuleValue
                    label="Restricted program count"
                    value={job.allowedProgramCount}
                  />
                  <RuleValue
                    label="Restricted cohort count"
                    value={job.allowedCohortCount}
                  />
                  <RuleValue
                    label="Allowed passing years"
                    value={
                      job.allowedPassingYears.length
                        ? job.allowedPassingYears.join(", ")
                        : "No year restriction"
                    }
                  />
                  <RuleValue
                    label="Missing evidence handling"
                    value={job.missingEvidencePolicy}
                  />
                </dl>
                </Disclosure>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <p className="m-0 text-xs leading-5 text-muted-foreground">
                    {job.source === "PERSISTED"
                      ? "Thresholds are from this job's stored eligibility policy."
                      : "No stored job eligibility policy; numeric thresholds and academic target lists are unset, with ALLOW_WITH_FLAG as the source default."}
                  </p>
                  <TextLink
                    href={
                      "/tpo/placements/jobs/" +
                      encodeURIComponent(job.id)
                    }
                    className="text-sm"
                  >
                    View job →
                  </TextLink>
                </div>
              </article>
            ))}
          </div>
        )}

        <nav
          aria-label="Job eligibility rules pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="m-0 text-sm text-muted-foreground">
            Page {result.page} of {result.totalPages}
          </p>

          <div className="flex gap-2">
            {result.page > 1 ? (
              <ButtonLink variant="secondary"
                href={
                  result.page === 2
                    ? "/tpo/settings/rules"
                    : `/tpo/settings/rules?page=${result.page - 1}`
                }
              >
                ← Previous
              </ButtonLink>
            ) : null}
            {result.page < result.totalPages ? (
              <ButtonLink variant="secondary"
                href={`/tpo/settings/rules?page=${result.page + 1}`}
              >
                Next →
              </ButtonLink>
            ) : null}
          </div>
        </nav>
      </section>
      </Disclosure>

      <Disclosure title="Rules data sources" className="min-w-0" contentClassName="pt-2">
      <p className="text-xs leading-5 text-muted-foreground">
        Sources: placement_college_rules,
        placement_job_eligibility_policies,
        placement_jobs, and existing
        source-configured eligibility/participation
        policies. This view makes no changes to
        placement rules, academic thresholds,
        eligibility decisions, or registration.
      </p>
      </Disclosure>
    </SettingsLayout>
  );
}
