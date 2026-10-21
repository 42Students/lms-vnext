import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/** Six-row skeleton retains the legacy activity-feed geometry during a
 * filter change without showing audit history from the prior scope.
 */
export default function Loading() {
  return <div aria-label="Loading activity" className="min-w-0 space-y-6">
    <PageHeader title="Activity Log" />
    <Skeleton variant="form" count={1} label="Loading activity controls" />
    <div className="max-w-[860px]">
      <Skeleton variant="row" count={6} label="Loading activity" />
    </div>
  </div>;
}
