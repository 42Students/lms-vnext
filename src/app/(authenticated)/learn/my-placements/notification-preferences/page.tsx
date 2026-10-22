import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { AuthorizationError } from "@/modules/permissions/policy";
import { LearnerPlacementNotificationSettings } from "@/components/placements/learner-placement-notification-settings";
import { getCandidatePreferences } from "@/modules/placements/candidate-preferences-service";

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
        action={<Link href="/learn/my-placements/notification-preferences"
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry preferences</Link>} />
    </div>;
  }
  return <div className="min-w-0 space-y-5">
    <Link href="/learn/my-placements" className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-[13px] font-semibold text-[var(--lms-link-text)] underline hover:underline">
      ← Back to My Placements
    </Link>
    <PageHeader title="Placement notifications"
      description="Manage the two registered placement notification preferences for your active Learner membership." />
    <LearnerPlacementNotificationSettings key={preferences.updatedAt?.toISOString()??"defaults"}
      initial={{
        notifyMatchingJobs:preferences.notifyMatchingJobs,
        notifyApplicationUpdates:preferences.notifyApplicationUpdates,
      }} />
  </div>;
}
