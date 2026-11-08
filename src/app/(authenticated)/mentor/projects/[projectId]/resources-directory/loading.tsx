import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function Loading() {
  return <section aria-busy="true" aria-label="Resource directory loading"
    className="min-w-0 max-w-full space-y-4 border-b border-[var(--lms-canvas-border)] pb-4">
    <GracefulPageLoading label="Loading registered project resources…" shape="directory" />
  </section>;
}
