import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** GR-19: loading is bounded by a visible recovery action. */
export default function Loading() {
  return <div className="min-w-0 max-w-full p-4 sm:p-6"><GracefulPageLoading label="Loading quiz…" shape="card" /></div>;
}
