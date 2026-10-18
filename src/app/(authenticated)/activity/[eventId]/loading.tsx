import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** GR-19: loading is bounded by a visible recovery action. */
export default function Loading() {
  return <div className="min-w-0 space-y-4">
    <nav aria-label="Breadcrumb" className="text-sm text-body">Activity Log</nav>
    <GracefulPageLoading />
  </div>;
}
