import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
export default function LoadingTpoNotifications() {
 return <div aria-busy="true" className="min-w-0 space-y-4">
  <PageHeader title="Notifications" description="Loading notifications…"/>
  <div className="rounded-[14px] border border-[var(--lms-canvas-border)] bg-white p-4 shadow-[0_5px_20px_rgba(26,45,72,0.05)]">
   <Skeleton variant="row" label="Loading notifications" count={5}/>
  </div>
 </div>;
}
