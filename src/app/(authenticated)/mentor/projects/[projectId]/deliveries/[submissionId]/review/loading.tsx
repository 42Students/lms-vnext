import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function Loading() {
  return <section aria-label="Delivery review loading" aria-busy="true" className="space-y-4 border-b border-[var(--lms-canvas-border)] pb-4">
    <GracefulPageLoading label="Loading the recorded review…" shape="directory" />
    <p role="status">Loading the recorded review…</p>
  </section>;
}
