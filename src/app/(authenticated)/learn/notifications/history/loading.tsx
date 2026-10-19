import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerNotificationHistoryLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Personal notification history"
        description="Loading the next page of your personal notifications." />
      <LoadingState label="Loading notification history…" />
    </div>
  );
}
