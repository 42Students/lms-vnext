import {PageHeader} from "@/components/ui/page-header";
import {Skeleton} from "@/components/ui/skeleton";
import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";

/** Six mapping rows reserve the old semester-to-course table density.
 * Slow requests expose the existing safe retry control. */
export default function Loading(){
 return <section className="min-w-0 space-y-4" aria-busy="true">
  <PageHeader title="Semester Course Mapping"/>
  <p role="status" className="text-xs text-muted-foreground">Loading course mappings and saved order…</p>
  <div className="border-y border-border py-3" aria-label="Loading six semester course mappings">
   <Skeleton variant="row" count={6} label="Loading semester course mapping rows"/>
  </div>
  <GracefulPageLoading label="Loading mapping…" shape="card"/>
 </section>;
}
