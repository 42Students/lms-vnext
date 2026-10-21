import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
export default function Loading(){
 return <div className="min-w-0 space-y-2" role="status" aria-live="polite">
  <p className="text-sm text-body">Loading this drive. You can edit it once it has loaded.</p>
  <GracefulPageLoading label="Loading drive edit"/>
 </div>;
}