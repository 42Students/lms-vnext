import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import {Skeleton} from "@/components/ui/skeleton";

export default function Loading() {
  return <section className="min-w-0 space-y-3" aria-busy="true">
   <GracefulPageLoading label="Loading drives" shape="directory" />
   <p role="status" className="text-sm text-muted-foreground">Refreshing drives…</p>
   <div className="hidden md:block" aria-hidden="true"><Skeleton variant="row" count={10} label="Loading desktop jobs"/></div>
   <div className="grid gap-3 md:hidden" aria-hidden="true"><Skeleton variant="card" count={4} label="Loading mobile jobs"/></div>
  </section>;
}
