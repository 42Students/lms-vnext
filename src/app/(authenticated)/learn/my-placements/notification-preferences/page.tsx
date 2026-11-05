import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { AuthorizationError } from "@/modules/permissions/policy";
import { LearnerPlacementNotificationSettings } from "@/components/placements/learner-placement-notification-settings";
import { getCandidatePreferences } from "@/modules/placements/candidate-preferences-service";
import { TextLink } from "@/components/ui/text-link";

export default async function LearnerPlacementNotificationPreferencesPage(){
  const context=await getCurrentRequestContext();
  let preferences:Awaited<ReturnType<typeof getCandidatePreferences>>;
  try {
    preferences=await getCandidatePreferences(context);
  } catch(error) {
    if(error instanceof AuthorizationError)throw error;
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Placement notifications" />
      <ErrorState title="Could not load notification preferences"
        description="Your saved notification choices could not be verified. No change has been made."
        action={<TextLink href="/learn/my-placements/notification-preferences"
          className="inline-flex min-h-11 items-center md:min-h-9">Retry preferences</TextLink>} />
    </div>;
  }
  return <div className="min-w-0 space-y-5">
    <PageHeader title="Placement notifications"
      description="Manage the two registered placement notification preferences for your active Learner membership." />
    <TextLink href="/learn/my-placements" className="inline-flex min-h-11 md:min-h-9 items-center text-[13px]">
      ← Back to My Placements
    </TextLink>

    <LearnerPlacementNotificationSettings key={preferences.updatedAt?.toISOString()??"defaults"}
      initial={{
        notifyMatchingJobs:preferences.notifyMatchingJobs,
        notifyApplicationUpdates:preferences.notifyApplicationUpdates,
      }} />
  </div>;
}
