import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
export default function LoadingTpoHome() {
 return <div className="min-w-0 space-y-4" aria-label="Loading placement home">
  <PageHeader title="Home" />
  <Skeleton variant="line" count={1} label="Loading placement greeting" />
  <div className="grid min-w-0 gap-4 min-[992px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
   <Skeleton variant="card" count={1} label="Loading Next up" />
   <Skeleton variant="row" count={7} label="Loading placement work" />
  </div>
 </div>;
}
