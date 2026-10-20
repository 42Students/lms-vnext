import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function Loading() {
  return <section aria-label="Meeting notes loading" aria-busy="true" className="min-w-0 max-w-full space-y-4 border-b border-[var(--lms-canvas-border)] pb-4">
    <GracefulPageLoading label="Loading meeting notes…" shape="directory" />
  </section>;
}
