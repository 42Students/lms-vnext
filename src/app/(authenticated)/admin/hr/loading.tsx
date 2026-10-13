import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function SuperAdminHrLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="HR Accounts"
        description="Loading employer recruiter accounts…"
      />
      <LoadingState label="Loading recruiter accounts and college access…" />
    </div>
  );
}
