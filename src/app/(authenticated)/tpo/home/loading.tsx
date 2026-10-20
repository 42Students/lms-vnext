import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
export default function LoadingTpoHome() {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Home" />
  <PageLoading label="Loading placement home…" variant="kpi" count={4} />
 </div>;
}
