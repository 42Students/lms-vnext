import Link from "next/link";
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Students"
        title="Placement participation decision"
        description={
          learner.displayName +
          " · Member-level eligibility override for the current college."
        }
        actions={
          <Link
            href="/tpo/students"
            className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-link"
          >
            Back to Students
          </Link>
        }
      />

      <section className="border-b border-border py-5">
        <h2 className="text-lg font-semibold text-foreground">
          Current participation
        </h2>
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
          <p className="mt-3 text-sm text-body">
            Current reason: {learner.effective.reason}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">
          Learner decisions override class decisions, which override
          batch decisions. The Debar action below uses this same
          learner-level decision, not the separate timed/drive-based
          DB08 debarment lifecycle.
        </p>
      </section>

      <nav aria-label="Student placement journey" className="flex flex-wrap gap-3">
        <Link href={journey.history} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 font-semibold text-link lms-inline-link">View placement history and round outcomes →</Link>
        <Link href={journey.roster} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 font-semibold text-link lms-inline-link">Student roster</Link>
      </nav>

      <TpoDebarControl
        membershipId={learner.membershipId}
        initial={learner.direct}
      />
      <TpoTimedDebarControl membershipId={learner.membershipId} initial={timedDebarments}/>

      <section className="border-b border-border py-5">
        <h2 className="text-lg font-semibold text-foreground">
          Change learner-level eligibility
        </h2>
        <p className="mt-2 mb-5 text-sm leading-6 text-body">
          Changes take effect for the learner&apos;s placement participation
          eligibility. A reason is required when marking ineligible.
          Concurrent changes are rejected instead of silently overwritten.
        </p>
        <TpoParticipationDecisionForm
          membershipId={learner.membershipId}
          initial={learner.direct}
        />
      </section>
    </div>
  );
}
