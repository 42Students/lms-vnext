import Link from "next/link";
import {getOwnInterviewWithdrawalTargets} from "@/modules/placements/learner-interview-withdrawal-service";
import { notFound,redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCareerRoundsWorkspace } from "@/components/placements/learner-career-rounds-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { resolveOwnInterviewDeepLink } from "@/modules/placements/learner-interview-deeplink-model";
import { learnerInterviewScheduleViewSchema } from "@/modules/placements/learner-interview-view-model";
import { learnerRoundSearchQuerySchema } from "@/modules/placements/learner-round-search-query-model";
import { getLearnerPlacementRequestWorkspace } from "@/modules/placements/request-service";

export default async function LearnerPlacementInterviewsPage({ searchParams }: {
  searchParams: Promise<{
    applicationId?: string | string[];
    roundId?: string | string[];
    view?: string | string[];
    q?: string | string[];
  }>;
}) {
  const query=await searchParams;
  // Old Interviews tab moved into Schedule. Resolve aliases and syntax before
  // expensive scoped reads; keep record-specific links on the dedicated view.
  const hasSpecificRecord=query.applicationId!==undefined||query.roundId!==undefined;
  if(!hasSpecificRecord){
    const target=query.view==="month"||query.view==="calendar"?"calendar":
      query.view==="past"?"past":"coming";
    redirect("/learn/my-placements/schedule?view="+target);
  }
  const view=learnerInterviewScheduleViewSchema.safeParse(query.view??"all");
  const search=learnerRoundSearchQuerySchema.safeParse({q:query.q});
  if(!search.success||!view.success)notFound();
  const context=await getCurrentRequestContext();
  // Rows and withdrawal controls are scoped by signed-in learner membership.
  const [workspace,withdrawalTargets]=await Promise.all([
    getLearnerPlacementRequestWorkspace(context),
    getOwnInterviewWithdrawalTargets(context),
  ]);
  const link = resolveOwnInterviewDeepLink(workspace.rounds, {
    applicationId:query.applicationId,roundId:query.roundId,
  });
  if (!link.valid) notFound();

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader title="Interviews"
        description="Your scheduled placement interview rounds and joining details." />
      <p className="text-sm text-body">
        Looking for all scheduled tests, talks and interviews?{" "}
        <Link href="/learn/my-placements/schedule" className="lms-inline-link font-semibold underline underline-offset-4">
          Open Schedule
        </Link>.
        This view keeps interview details and withdrawal actions together.
      </p>
      <LearnerCareerRoundsWorkspace
        key={link.key ?? "all-interviews"}
        kind="INTERVIEW"
        withdrawalTargets={withdrawalTargets}
        initialSelectedKey={link.key}
        initialTimeView={view.data}
        initialSearch={search.data.q}
        snapshotNowIso={new Date().toISOString()}
        rounds={workspace.rounds.map(row => ({
          ...row,
          scheduledAt: row.scheduledAt?.toISOString() ?? null,
          exception: row.exception
            ? {
                scheduledAt: row.exception.scheduledAt.toISOString(),
                timezone: row.exception.timezone,
                mode: row.exception.mode,
                venue: row.exception.venue,
                meetingUrl: row.exception.meetingUrl,
              }
            : null,
        }))}
      />
    </div>
  );
}
