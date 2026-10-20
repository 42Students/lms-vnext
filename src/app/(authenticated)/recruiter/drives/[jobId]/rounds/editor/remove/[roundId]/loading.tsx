import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** GR-19: loading is bounded by a visible recovery action. */
export default function Loading() {
  return <div className="min-w-0 max-w-2xl space-y-4"><PageHeader title="Confirm unused round removal" /><GracefulPageLoading shape="card" /></div>;
}
