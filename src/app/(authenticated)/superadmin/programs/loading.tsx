import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** GR-19: loading is bounded by a visible recovery action. */
export default function Loading() {
  return <div className="min-w-0 max-w-full"><GracefulPageLoading label="Opening Super Admin programs…" shape="directory" /></div>;
}
