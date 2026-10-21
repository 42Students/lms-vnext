import {PageHeader} from "@/components/ui/page-header";
import {Skeleton} from "@/components/ui/skeleton";
import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
export default function Loading(){
 return <section aria-busy="true" className="min-w-0 space-y-4">
  <PageHeader title="Audit"/>
  <Skeleton variant="row" count={4} label="Restoring scoped project audit rows"/>
  <GracefulPageLoading shape="card" label="Loading project audit…"/>
 </section>;
}
