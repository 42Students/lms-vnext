import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function SuperAdminModuleTraceLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · Module Access"
        title="Learner access trace"
        description="Reading college-scoped learner membership and module rules."
      />
      <LoadingState label="Resolving learner module access…" />
    </div>
  );
}
