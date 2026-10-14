import {requireOwnLearnerProfileAccess} from "@/modules/people/learner-profile-access-service";
import {learnerProfileAcademicRecovery} from "@/modules/people/learner-profile-recovery-model";
import {LearnerProfileAcademicRetry} from "@/components/profile/learner-profile-academic-retry";
import { getCurrentRequestContext } from "@/auth/request-context";
import { learnerProfileSectionSchema } from "@/modules/people/learner-profile-checklist";
import { LearnerProfileWorkspace } from "@/components/profile/learner-profile-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnLearnerProfileWithRuntime } from "@/modules/people/runtime";
import { getOwnLearnerAcademicSummary } from "@/modules/people/learner-academic-summary-service";

export default async function LearnerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const query = await searchParams;
  const parsedSection = learnerProfileSectionSchema.safeParse(query.section);
  const initialSection = parsedSection.success ? parsedSection.data : null;
  const context = await getCurrentRequestContext();

  await requireOwnLearnerProfileAccess(context);
  const [{ person, profile }, academicOutcome] = await Promise.all([
    getOwnLearnerProfileWithRuntime(context),
    Promise.allSettled([getOwnLearnerAcademicSummary(context)]).then(([result])=>learnerProfileAcademicRecovery(result)),
  ]);
  const academic=academicOutcome.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner"
        title="Profile"
        description="Your academic, career and placement profile in one place."
      />
      <section aria-label="Academic identity" className="rounded-xl border border-border bg-surface p-4 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">Academic identity</h2>
        <p className="mt-1 text-lg font-semibold text-foreground">{academic?.title??person.user.displayName??"Your profile"}</p>
        {!academicOutcome.available ? <div role="status" className="mt-3 text-sm text-body">
          <p>Your academic summary is temporarily unavailable. Your saved profile remains available below; no missing enrollment has been inferred.</p>
          <LearnerProfileAcademicRetry />
        </div> : academic?.enrollment ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="font-semibold text-muted-foreground">Program</dt>
              <dd className="mt-1 text-foreground">{academic.enrollment.program}
                {academic.enrollment.programCode ? " · " + academic.enrollment.programCode : ""}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-muted-foreground">Batch / cohort</dt>
              <dd className="mt-1 text-foreground">{academic.enrollment.cohort ?? "Not recorded"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted-foreground">Department</dt>
              <dd className="mt-1 text-foreground">{academic.enrollment.department ?? "Not recorded"}</dd>
            </div>
          </dl>
        ) : (
          <p role="status" className="mt-3 text-sm text-body">
            No active program enrollment is recorded for your current college membership.
            This does not imply that your studies have ended. Contact your college administrator
            if your program should be listed.
          </p>
        )}
      </section>
      <LearnerProfileWorkspace
        initialSection={initialSection}
        displayName={person.user.displayName}
        primaryEmail={person.user.email}
        primaryPhone={person.user.phoneE164}
        rollNumber={profile.rollNumber}
        registrationNumber={profile.registrationNumber}
        initialDocument={profile.profileDocument}
      />
    </div>
  );
}
