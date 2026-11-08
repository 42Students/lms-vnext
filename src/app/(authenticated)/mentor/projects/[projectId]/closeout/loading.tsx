import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function Loading() {
  return <section aria-busy="true" aria-label="Project closeout loading"
    className="min-w-0 max-w-full space-y-4">
    <GracefulPageLoading label="Loading project closeout checklist…" shape="directory" />
  </section>;
}
