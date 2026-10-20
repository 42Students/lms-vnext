import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
export default function LoadingClassProjectWorkspace(){return <section aria-busy="true" aria-label="Workspace creator loading" className="min-w-0 space-y-6"><PageHeader title="Create workspaces from a class" /><GracefulPageLoading label="Loading workspace creator" shape="directory" /><p role="status" className="text-sm text-muted-foreground">Loading class and template choices…</p></section>;}
