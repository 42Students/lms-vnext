import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** GR-19: loading is bounded by a visible recovery action. */
export default function Loading() {
  return <div className="min-w-0 space-y-4"><PageHeader title="Messages" /><GracefulPageLoading label="Loading conversation history…" shape="card" /></div>;
}
