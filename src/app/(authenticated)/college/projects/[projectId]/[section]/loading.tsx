import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import {Skeleton} from "@/components/ui/skeleton";

/** GR-19: loading is bounded by a visible recovery action. */
export default function Loading() {
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Projects" />
    <GracefulPageLoading label="Loading workspace team and project details…" shape="directory" />
    <div aria-hidden="true" className="space-y-3"><Skeleton label="Loading team members" variant="row" count={6}/></div>
  </div>;
}
