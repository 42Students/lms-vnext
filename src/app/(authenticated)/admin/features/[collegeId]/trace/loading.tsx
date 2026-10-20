import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function SuperAdminModuleTraceLoading() {
  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
      <PageHeader
        eyebrow="Super Admin · Module Access"
        title="Learner access trace"
        description="Reading college-scoped learner membership and module rules."
      />
      <GracefulPageLoading label="Resolving learner module access…" shape="directory" />
    </div>
  );
}
