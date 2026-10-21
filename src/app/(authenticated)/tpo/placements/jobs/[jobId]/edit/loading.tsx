import {PageHeader} from "@/components/ui/page-header";
import {Skeleton} from "@/components/ui/skeleton";
export default function LoadingTpoDriveEdit(){
 return <div aria-busy="true" className="min-w-0 space-y-4">
  <PageHeader title="Edit drive" description="Loading drive setup…"/>
  <div role="status" className="text-sm text-muted-foreground">Loading saved drive details. Editing is unavailable until setup is ready.</div>
  <Skeleton label="Loading drive setup" variant="row" count={8}/>
 </div>;
}
