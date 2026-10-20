import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function TpoAuditLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Oversight"
        title="Audit Log"
        description="Loading persisted college placement history…"
      />
      <LoadingState label="Loading audit events and summary…" />
    </div>
  );
}
