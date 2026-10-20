import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function LoadingClassProjectWorkspace() {
  return <section aria-busy="true" aria-label="Workspace creator loading" className="mx-auto max-w-5xl space-y-4 px-3 py-6">
    <GracefulPageLoading label="Loading workspace creator" shape="directory" />
    <p role="status" className="text-sm text-muted-foreground">Loading class and template choices…</p>
  </section>;
}
