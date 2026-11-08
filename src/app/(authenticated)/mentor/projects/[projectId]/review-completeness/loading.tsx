import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function Loading() {
  return <section aria-busy="true" aria-label="Delivery review completeness loading"
    className="min-w-0 max-w-full space-y-4">
    <GracefulPageLoading label="Loading delivery review completeness…" shape="directory" />
  </section>;
}
