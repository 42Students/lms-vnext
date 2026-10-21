import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
import {Skeleton} from "@/components/ui/skeleton";

/** Preserve the workspaces table dimensions while navigation fetches a
 * newly scoped result. The saved rows are never guessed or cross-college cached. */
export default function Loading(){
 return <section className="min-w-0 space-y-3" aria-busy="true">
  <GracefulPageLoading label="Loading project workspaces…" shape="directory"/>
  <p role="status" className="text-xs text-muted-foreground">
   Refreshing workspaces for the selected college. Previously fetched rows are not reused across scope changes.
  </p>
  <div aria-hidden="true"><Skeleton variant="row" count={8} label="Loading workspace rows"/></div>
 </section>;
}
