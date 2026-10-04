import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerProfileWorkspace } from "@/components/profile/learner-profile-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnLearnerProfileWithRuntime } from "@/modules/people/runtime";
import { getCandidatePreferences } from "@/modules/placements/candidate-preferences-service";
import { getOwnAcademicEvidence } from "@/modules/placements/eligibility-service";

export default async function LearnerProfilePage() {
  const context = await getCurrentRequestContext();

  const [profileResult, preferencesResult, academicResult] =
    await Promise.allSettled([
      getOwnLearnerProfileWithRuntime(context),
      getCandidatePreferences(context),
      getOwnAcademicEvidence(context),
    ]);

  if (profileResult.status === "rejected") {
    throw profileResult.reason;
  }

  const { person, profile } = profileResult.value;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner"
        title="Profile"
        description="Your academic, career and placement profile in one place."
      />
      <LearnerProfileWorkspace
        displayName={person.user.displayName}
        primaryEmail={person.user.email}
        primaryPhone={person.user.phoneE164}
        rollNumber={profile.rollNumber}
        registrationNumber={profile.registrationNumber}
        initialDocument={profile.profileDocument}
        initialPreferences={
          preferencesResult.status === "fulfilled"
            ? preferencesResult.value
            : null
        }
        preferencesError={preferencesResult.status === "rejected"}
        initialAcademicEvidence={
          academicResult.status === "fulfilled"
            ? academicResult.value
            : null
        }
        academicEvidenceError={academicResult.status === "rejected"}
      />
    </div>
  );
}
