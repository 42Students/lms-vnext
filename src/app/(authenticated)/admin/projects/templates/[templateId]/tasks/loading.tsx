import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
import {Skeleton} from "@/components/ui/skeleton";

/** First visit matches the legacy eight template-task rows; the slow-state
 * refresh action remains provided by GracefulPageLoading. */
export default function Loading(){
 return <section className="min-w-0 space-y-3" aria-busy="true">
  <GracefulPageLoading shape="directory" label="Loading template tasks…"/>
  <div className="border-y border-border py-3" aria-hidden="true">
   <Skeleton variant="row" count={5} label="Loading remaining template task rows"/>
  </div>
 </section>;
}
