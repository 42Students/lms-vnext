import { Disclosure } from "@/components/ui/disclosure";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoParticipationDecisionForm } from "@/components/tpo/tpo-participation-decision-form";
import { TpoDebarControl } from "@/components/tpo/tpo-debar-control";
import {TpoTimedDebarControl} from "@/components/tpo/tpo-timed-debar-control";
import {listTpoMemberDebarments} from "@/modules/placements/debarment-service";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import { getTpoLearnerParticipation } from "@/modules/placements/tpo-participation-service";
import {tpoStudentJourneyLinks} from "@/modules/placements/tpo-student-journey-links-model";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";

export default async function TpoLearnerParticipationPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const { membershipId } = await params;
  const learner = await getTpoLearnerParticipation(context, membershipId);
  const journey=tpoStudentJourneyLinks(learner.membershipId);
  const timedDebarments=await listTpoMemberDebarments(context,learner.membershipId);

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader
         title="Placement participation decision"
        description={
          learner.displayName +
          " · Member-level eligibility override for the current college."
        }
        actions={
          <ButtonLink variant="secondary"
            href="/tpo/students"
          >
            Back to Students
          </ButtonLink>
        }
      />

      <section className="border-b border-border py-4">
        <Heading level={2} size="lg" className="text-[var(--lms-heading)]">
          Current participation
        </Heading>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-body">Effective decision:</span>
          <StatusBadge
            tone={learner.effective.status === "ELIGIBLE"
              ? "success"
              : learner.effective.status === "INELIGIBLE"
                ? "warning"
                : "neutral"}
          >
            {learner.effective.status.replaceAll("_", " ")}
          </StatusBadge>
          <span className="text-sm text-muted-foreground">
            {learner.effective.level
              ? "From " + learner.effective.level.toLowerCase() + " scope"
              : "No learner, class or batch decision recorded"}
          </span>
        </div>
        {learner.effective.reason ? (
          <p className="mt-3 text-sm text-body leading-[22px]">
            Current reason: {learner.effective.reason}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground leading-5">
          Learner decisions override class decisions, which override
          batch decisions. The Debar action below uses this same
          learner-level decision, not the separate timed/drive-based
          DB08 debarment lifecycle.
        </p>
      </section>

      <nav aria-label="Student placement journey" className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
        <ButtonLink variant="secondary" href={journey.history} className="w-full sm:w-auto">View placement history and round outcomes →</ButtonLink>
        <ButtonLink variant="secondary" href={journey.roster} className="w-full sm:w-auto">Student roster</ButtonLink>
      </nav>

      <section className="border-b border-border py-4">
        <Heading level={2} size="lg" className="text-[var(--lms-heading)]">
          Change learner-level eligibility
        </Heading>
        <p className="mt-2 mb-5 text-sm leading-[22px] text-body">
          Changes take effect for the learner&apos;s placement participation
          eligibility. A reason is required when marking ineligible.
          Concurrent changes are rejected instead of silently overwritten.
        </p>
        <TpoParticipationDecisionForm
          membershipId={learner.membershipId}
          initial={learner.direct}
        />
      </section>
      <Disclosure title="Debar / remove learner restriction" className="min-w-0 border-b border-border py-3" contentClassName="pt-3">
      <TpoDebarControl membershipId={learner.membershipId} initial={learner.direct}/>
      </Disclosure>
      <Disclosure title="Debar until a date or for N drives" className="min-w-0 border-b border-border py-3" contentClassName="pt-3">
      <TpoTimedDebarControl membershipId={learner.membershipId} initial={timedDebarments}/>
      </Disclosure>
    </div>
  );
}
