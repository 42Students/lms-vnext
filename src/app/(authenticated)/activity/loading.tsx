import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** GR-19: loading is bounded by a visible recovery action. */
export default function Loading() {
  return <div className="min-w-0 space-y-4">
    <h1 className="text-2xl font-semibold leading-8 text-foreground sm:text-3xl">Activity Log</h1>
    <GracefulPageLoading />
  </div>;
}
