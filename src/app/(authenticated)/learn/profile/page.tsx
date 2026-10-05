import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerProfileWorkspace } from "@/components/profile/learner-profile-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnLearnerProfileWithRuntime } from "@/modules/people/runtime";

export default async function LearnerProfilePage() {
  const context = await getCurrentRequestContext();

  const { person, profile } =
    await getOwnLearnerProfileWithRuntime(context);

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
      />
    </div>
  );
}
