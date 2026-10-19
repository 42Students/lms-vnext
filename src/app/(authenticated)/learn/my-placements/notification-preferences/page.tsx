import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { LearnerPlacementNotificationSettings } from "@/components/placements/learner-placement-notification-settings";
import { getCandidatePreferences } from "@/modules/placements/candidate-preferences-service";

export default async function LearnerPlacementNotificationPreferencesPage(){
  const context=await getCurrentRequestContext();
  const preferences=await getCandidatePreferences(context);
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="Learner · My Placements" title="Placement notifications"
      description="Manage the two registered placement notification preferences for your active Learner membership." />
    <Link href="/learn/my-placements" className="inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text hover:underline">
      ← Back to My Placements
    </Link>
    <LearnerPlacementNotificationSettings key={preferences.updatedAt?.toISOString()??"defaults"}
      initial={{
        notifyMatchingJobs:preferences.notifyMatchingJobs,
        notifyApplicationUpdates:preferences.notifyApplicationUpdates,
      }} />
  </div>;
}
